import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [tonerStats, setTonerStats] = useState({});
  const [porClienteStats, setPorClienteStats] = useState({});
  const [rendimientoStats, setRendimientoStats] = useState({});
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const opcionesHora = { hour: '2-digit', minute: '2-digit', hour12: false };
    return `${fecha.toLocaleTimeString([], opcionesHora)} - ${fecha.toLocaleDateString([], opcionesFecha)}`;
  };

  useEffect(() => {
    const cargarEstadisticas = async () => {
      const { data, error } = await supabase
        .from('registros')
        .select(`fecha, cliente_id, modelo_toner_id, contador_actual, ultimo_contador, clientes(nombre), toners(modelo, rendimiento)`);

      if (error) return toast.error('Error al cargar estadísticas');

      const tonerMensual = {};
      const porCliente = {};
      const rendimiento = {};

      data.forEach((reg) => {
        const mes = new Date(reg.fecha).getMonth();
        const modelo = reg.toners?.modelo || 'Desconocido';
        const cliente = reg.clientes?.nombre || 'Sin cliente';

        if (!tonerMensual[mes]) tonerMensual[mes] = {};
        tonerMensual[mes][modelo] = (tonerMensual[mes][modelo] || 0) + 1;

        if (!porCliente[mes]) porCliente[mes] = {};
        porCliente[mes][cliente] = (porCliente[mes][cliente] || 0) + 1;

        if (!rendimiento[modelo]) rendimiento[modelo] = { total: 0, count: 0 };
        const diferencia = (reg.contador_actual || 0) - (reg.ultimo_contador || 0);
        if (diferencia >= 0) {
          rendimiento[modelo].total += diferencia;
          rendimiento[modelo].count++;
        }
      });

      setTonerStats(tonerMensual);
      setPorClienteStats(porCliente);

      const promedio = {};
      for (const modelo in rendimiento) {
        promedio[modelo] = rendimiento[modelo].count > 0
          ? Math.round(rendimiento[modelo].total / rendimiento[modelo].count)
          : 0;
      }
      setRendimientoStats(promedio);
    };

    const cargarPendientes = async () => {
      const { data, error } = await supabase
        .from('registros_pendientes')
        .select(`*, clientes(nombre), toners(modelo), tipos_toner(nombre)`)
        .order('creado_el', { ascending: false });

      if (error) return toast.error('Error al cargar pendientes');
      setPendientes(data || []);
    };

    const cargarHistorial = async () => {
      if (user?.role !== 'secretaria') return;

      const { data, error } = await supabase
        .from('registros_historial')
        .select(`id, fecha, cliente_id, modelo_toner_id, tipo_toner_id, resultado, observaciones, toners(modelo), tipos_toner(nombre), clientes(nombre)`)
        .eq('creado_por', user.id)
        .order('fecha', { ascending: false });

      if (error) return toast.error('Error al cargar historial');
      setHistorial(data || []);
    };

    if (user?.role === 'admin') {
      cargarEstadisticas();
      cargarPendientes();
    }

    if (user) cargarHistorial();
  }, [user]);

  const aprobarRegistro = async (registro) => {
    const { error } = await supabase.from('registros').insert({
      fecha: registro.fecha,
      guia: registro.guia,
      cliente_id: registro.cliente_id,
      modelo_maquina: registro.modelo_maquina,
      serie_maquina: registro.serie_maquina,
      modelo_toner_id: registro.modelo_toner_id,
      tipo_toner_instalado_id: registro.tipo_toner_instalado_id,
      ultimo_contador: registro.ultimo_contador,
      contador_actual: registro.contador_actual,
      observaciones: registro.observaciones
    });

    if (error) return toast.error('No se pudo aprobar');

    await supabase.from('registros_historial').insert({
      serie_maquina: registro.serie_maquina,
      resultado: 'aprobado',
      observaciones: registro.observaciones,
      creado_por: registro.creado_por,
      fecha: registro.fecha,
      cliente_id: registro.cliente_id,
      modelo_toner_id: registro.modelo_toner_id,
      tipo_toner_id: registro.tipo_toner_instalado_id
    });

    await supabase.from('registros_pendientes').delete().eq('id', registro.id);
    setPendientes(pendientes.filter(p => p.id !== registro.id));
  };

  const rechazarRegistro = async (registro) => {
    await supabase.from('registros_historial').insert({
      serie_maquina: registro.serie_maquina,
      resultado: 'rechazado',
      observaciones: registro.observaciones,
      creado_por: registro.creado_por,
      fecha: registro.fecha,
      cliente_id: registro.cliente_id,
      modelo_toner_id: registro.modelo_toner_id,
      tipo_toner_id: registro.tipo_toner_instalado_id
    });

    await supabase.from('registros_pendientes').delete().eq('id', registro.id);
    setPendientes(pendientes.filter(p => p.id !== registro.id));
  };

  const eliminarHistorial = async (id) => {
    await supabase.from('registros_historial').delete().eq('id', id);
    setHistorial(historial.filter((r) => r.id !== id));
  };

  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const generarDataset = (stats) => {
    const series = new Set();
    Object.values(stats).forEach(m => Object.keys(m).forEach(s => series.add(s)));
    return Array.from(series).map((serie, idx) => ({
      label: serie,
      data: labels.map((_, i) => stats[i]?.[serie] || 0),
      backgroundColor: `hsl(${idx * 50}, 70%, 60%)`
    }));
  };

  return (
    <div className="p-6 mt-24 max-w-7xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold mb-2">Bienvenido, {user?.username}</h1>
      <p className="text-gray-600 mb-4">Rol: {user?.role}</p>

      {user?.role === 'admin' && (
        <>
          <div className="bg-white shadow rounded p-4 overflow-auto mb-10">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Registros Pendientes</h2>
            {pendientes.length === 0 ? (
              <p className="text-gray-400">No hay registros pendientes.</p>
            ) : (
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-2 py-1">Fecha</th>
                    <th className="px-2 py-1">Serie</th>
                    <th className="px-2 py-1">Cliente</th>
                    <th className="px-2 py-1">Modelo</th>
                    <th className="px-2 py-1">Tipo</th>
                    <th className="px-2 py-1">Contador</th>
                    <th className="px-2 py-1">Observaciones</th>
                    <th className="px-2 py-1">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="px-2 py-1">{formatearFecha(r.fecha)}</td>
                      <td className="px-2 py-1">{r.serie_maquina}</td>
                      <td className="px-2 py-1">{r.clientes?.nombre}</td>
                      <td className="px-2 py-1">{r.toners?.modelo}</td>
                      <td className="px-2 py-1">{r.tipos_toner?.nombre}</td>
                      <td className="px-2 py-1">{r.ultimo_contador} → {r.contador_actual}</td>
                      <td className="px-2 py-1">{r.observaciones || '—'}</td>
                      <td className="px-2 py-1 space-x-1">
                        <button onClick={() => aprobarRegistro(r)} className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">✅</button>
                        <button onClick={() => rechazarRegistro(r)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">❌</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-white shadow rounded p-4 h-[400px]">
              <Bar data={{ labels, datasets: generarDataset(tonerStats) }}
                   options={{ plugins: { title: { display: true, text: 'Cambios por Modelo/Mes' } }, responsive: true, maintainAspectRatio: false }} />
            </div>
            <div className="bg-white shadow rounded p-4 h-[400px]">
              <Bar data={{ labels, datasets: generarDataset(porClienteStats) }}
                   options={{ plugins: { title: { display: true, text: 'Cambios por Cliente/Mes' } }, responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white shadow rounded p-4 h-[400px] mb-10">
            <Bar data={{
              labels: Object.keys(rendimientoStats),
              datasets: [{
                label: 'Promedio de Páginas por Tóner',
                data: Object.values(rendimientoStats),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
              }]
            }} options={{ plugins: { title: { display: true, text: 'Rendimiento Promedio por Tóner' } }, responsive: true, maintainAspectRatio: false }} />
          </div>
        </>
      )}

      {user?.role === 'secretaria' && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Historial de Registros</h2>
          {historial.length === 0 ? (
            <p className="text-gray-400">No hay registros aún.</p>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-2 py-1">Fecha</th>
                  <th className="px-2 py-1">Cliente</th>
                  <th className="px-2 py-1">Modelo</th>
                  <th className="px-2 py-1">Tipo</th>
                  <th className="px-2 py-1">Estado</th>
                  <th className="px-2 py-1">Observaciones</th>
                  <th className="px-2 py-1">Acción</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-2 py-1">{formatearFecha(r.fecha)}</td>
                    <td className="px-2 py-1">{r.clientes?.nombre}</td>
                    <td className="px-2 py-1">{r.toners?.modelo}</td>
                    <td className="px-2 py-1">{r.tipos_toner?.nombre}</td>
                    <td className="px-2 py-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${r.resultado === 'aprobado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.resultado === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'}
                      </span>
                    </td>
                    <td className="px-2 py-1">{r.observaciones || '—'}</td>
                    <td className="px-2 py-1">
                      <button onClick={() => eliminarHistorial(r.id)} className="text-red-500 hover:text-red-700 text-xs">🗑 Limpiar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
