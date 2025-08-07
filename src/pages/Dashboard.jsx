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
import { formatearNumeroCL } from '../utils/formatUtils';

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
  const [usuarios, setUsuarios] = useState([]);
  const [observacionModal, setObservacionModal] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return `${fecha.toLocaleDateString([], opcionesFecha)}`;
  };

  const getEmailById = (id) => {
    const user = usuarios.find((u) => u.id === id);
    return user?.email || '—';
  };

  useEffect(() => {
    const cargarUsuarios = async () => {
      const { data, error } = await supabase.from('users_livianos').select('id, email');
      if (!error) setUsuarios(data);
    };

    const cargarEstadisticas = async () => {
      const { data, error } = await supabase
        .from('registros')
        .select(`fecha, cliente_id, modelo_toner_id, contador_actual, ultimo_contador, clientes(nombre), toners(modelo, rendimiento), aprobado_por`);

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

      const promedio = {};
      for (const modelo in rendimiento) {
        promedio[modelo] = rendimiento[modelo].count > 0
          ? Math.round(rendimiento[modelo].total / rendimiento[modelo].count)
          : 0;
      }

      setTonerStats(tonerMensual);
      setPorClienteStats(porCliente);
      setRendimientoStats(promedio);
    };

    const cargarPendientes = async () => {
      const { data, error } = await supabase
        .from('registros_pendientes')
        .select(`*, clientes(nombre), toners(modelo), tipos_toner(nombre)`)
        .order('creado_el', { ascending: false });

      if (!error) setPendientes(data || []);
    };

    const cargarHistorial = async () => {
      const { data, error } = await supabase
        .from('registros_historial')
        .select(`id, fecha, cliente_id, modelo_toner_id, tipo_toner_id, resultado, observaciones, aprobado_por, toners(modelo), tipos_toner(nombre), clientes(nombre), color`)
        .eq('creado_por', user.id)
        .order('fecha', { ascending: false });

      if (!error) setHistorial(data || []);
    };

    if (user) {
      cargarUsuarios();
      if (user.role === 'admin') {
        cargarEstadisticas();
        cargarPendientes();
      }
      if (user.role === 'secretaria') {
        cargarHistorial();
      }
    }
  }, [user]);

  const aprobarRegistro = async (registro) => {
    const { error } = await supabase.from('registros').insert({
      fecha: registro.fecha,
      guia: registro.guia,
      cliente_id: registro.cliente_id,
      modelo_maquina: registro.modelo_maquina,
      serie_maquina: registro.serie_maquina,
      modelo_toner_id: registro.modelo_toner_id,
      color: registro.color,
      tipo_toner_instalado_id: registro.tipo_toner_instalado_id,
      ultimo_contador: registro.ultimo_contador,
      contador_actual: registro.contador_actual,
      observaciones: registro.observaciones,
      aprobado_por: user.id,
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
      color: registro.color,
      tipo_toner_id: registro.tipo_toner_instalado_id,
      aprobado_por: user.id,
    });

    await supabase.from('registros_pendientes').delete().eq('id', registro.id);
    setPendientes((prev) => prev.filter((p) => p.id !== registro.id));
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
      color: registro.color,
      tipo_toner_id: registro.tipo_toner_instalado_id,
      aprobado_por: user.id,
    });

    await supabase.from('registros_pendientes').delete().eq('id', registro.id);
    setPendientes((prev) => prev.filter((p) => p.id !== registro.id));
  };

  const eliminarHistorial = async (id) => {
    await supabase.from('registros_historial').delete().eq('id', id);
    setHistorial((prev) => prev.filter((r) => r.id !== id));
  };

  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const generarDataset = (stats) => {
    const series = new Set();
    Object.values(stats).forEach((m) => Object.keys(m).forEach((s) => series.add(s)));
    return Array.from(series).map((serie, idx) => ({
      label: serie,
      data: labels.map((_, i) => stats[i]?.[serie] || 0),
      backgroundColor: `hsl(${idx * 50}, 70%, 60%)`,
    }));
  };

  return (
    <div className="p-6 mt-24 max-w-7xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-bold mb-2">Bienvenido, {getEmailById(user.id)}</h1>
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
                    <th className="px-2 py-1">Color</th>
                    <th className="px-2 py-1">Tipo</th>
                    <th className="px-2 py-1">Contador</th>
                    <th className="px-2 py-1">Diferencia</th>
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
                      <td className="px-2 py-1">{r.color}</td>
                      <td className="px-2 py-1">{r.tipos_toner?.nombre}</td>
                      <td className="px-2 py-1">{formatearNumeroCL(r.ultimo_contador)} → {formatearNumeroCL(r.contador_actual)}</td>
                      <td className="px-2 py-1">{formatearNumeroCL((r.contador_actual) - (r.ultimo_contador))}</td>
                      <td className="px-2 py-1">
                        {r.observaciones
                          ? <button onClick={() => setObservacionModal(r.observaciones)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded">Ver</button>
                          : '—'}
                      </td>
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

          <div className="bg-white shadow rounded p-4 h-[400px]">
            <Bar data={{ labels, datasets: generarDataset(tonerStats) }} options={{ plugins: { title: { display: true, text: 'Cambios por Modelo/Mes' } }, responsive: true, maintainAspectRatio: false }} />
          </div>

          <div className="bg-white shadow rounded p-4 h-[400px] mb-10">
            <Bar data={{
              labels: Object.keys(rendimientoStats),
              datasets: [{
                label: 'Promedio de Páginas por Tóner',
                data: Object.values(rendimientoStats),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
              }],
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
                  <th className="px-2 py-1">Color</th>
                  <th className="px-2 py-1">Tipo</th>
                  <th className="px-2 py-1">Estado</th>
                  <th className="px-2 py-1">Observaciones</th>
                  <th className="px-2 py-1">Autorizado por</th>
                  <th className="px-2 py-1">Acción</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-2 py-1">{formatearFecha(r.fecha)}</td>
                    <td className="px-2 py-1">{r.clientes?.nombre}</td>
                    <td className="px-2 py-1">{r.toners?.modelo}</td>
                    <td className="px-2 py-1">{r.color}</td>
                    <td className="px-2 py-1">{r.tipos_toner?.nombre}</td>
                    <td className="px-2 py-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${r.resultado === 'aprobado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.resultado === 'aprobado' ? '✅ Aprobado' : '❌ Rechazado'}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      {r.observaciones
                        ? <button onClick={() => setObservacionModal(r.observaciones)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded">Ver</button>
                        : '—'}
                    </td>
                    <td className="px-2 py-1">{getEmailById(r.aprobado_por)}</td>
                    <td className="px-2 py-1">
                      <button onClick={() => eliminarHistorial(r.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">🗑 Limpiar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {observacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-2">Observación</h2>
            <div className="text-gray-800 whitespace-pre-line break-words">
              {observacionModal}
            </div>
            <div className="text-right mt-4">
              <button
                onClick={() => setObservacionModal(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
