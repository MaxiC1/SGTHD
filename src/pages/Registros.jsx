// src/pages/Registros.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import ExportarPDF from '../components/ExportarPDF';

export default function Registros() {
  const user = useAuthStore(state => state.user);

  const [registros, setRegistros] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [toners, setToners] = useState([]);

  const [filtroSerie, setFiltroSerie] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroToner, setFiltroToner] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroLimite, setFiltroLimite] = useState('');

  const [observacionModal, setObservacionModal] = useState(null);

  useEffect(() => {
    const fetchInicial = async () => {
      const { data: regs, error: errR } = await supabase
        .from('registros')
        .select(`
          id, fecha, guia, serie_maquina, modelo_maquina,
          contador_actual, ultimo_contador, observaciones,
          clientes:cliente_id ( nombre ),
          toners:modelo_toner_id ( modelo, rendimiento ),
          tipos_toner_instalado:tipo_toner_instalado_id ( nombre )
        `)
        .order('fecha', { ascending: false });
      if (!errR) setRegistros(regs);

      const { data: cls } = await supabase
        .from('clientes')
        .select('id, nombre');
      setClientes(cls || []);

      const { data: tns } = await supabase
        .from('toners')
        .select('id, modelo');
      setToners(tns || []);
    };
    fetchInicial();
  }, []);

  const registrosFiltrados = registros
    .filter(r => {
      if (fechaInicio && fechaFin) {
        const f = new Date(r.fecha);
        if (f < new Date(fechaInicio) || f > new Date(fechaFin)) return false;
      }
      return true;
    })
    .filter(r => filtroCliente ? r.clientes?.nombre === filtroCliente : true)
    .filter(r => filtroSerie ? r.serie_maquina.toLowerCase().includes(filtroSerie.toLowerCase()) : true)
    .filter(r => filtroToner ? r.toners?.modelo === filtroToner : true);

  const withLimit = filtroLimite
    ? registrosFiltrados.slice(0, parseInt(filtroLimite))
    : registrosFiltrados;

  const eliminarRegistro = async (id) => {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      const { error } = await supabase.from('registros').delete().eq('id', id);
      if (!error) {
        setRegistros(prev => prev.filter(r => r.id !== id));
      } else {
        alert('Error al eliminar: ' + error.message);
      }
    }
  };

  return (
    <div className="p-4 mt-20">
      <h1 className="text-xl font-bold mb-4">Registros de Cambios de Tóner</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium">Desde</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Hasta</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium">Cliente</label>
          <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className="border p-2 w-full">
            <option value="">-- Todos --</option>
            {clientes.map(c => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Modelo Tóner</label>
          <select value={filtroToner} onChange={e => setFiltroToner(e.target.value)} className="border p-2 w-full">
            <option value="">-- Todos --</option>
            {toners.map(t => (
              <option key={t.id} value={t.modelo}>{t.modelo}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Últimos</label>
          <select value={filtroLimite} onChange={e => setFiltroLimite(e.target.value)} className="border p-2 w-full">
            <option value="">-- Todos --</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filtrar por número de serie..."
          value={filtroSerie}
          onChange={e => setFiltroSerie(e.target.value)}
          className="border p-2 w-full max-w-sm"
        />
      </div>

      <div className="mb-4">
        <ExportarPDF
          registros={withLimit}
          filtros={{
            cliente: filtroCliente,
            serie: filtroSerie,
            toner: filtroToner,
            rango: fechaInicio && fechaFin ? { inicio: fechaInicio, fin: fechaFin } : null,
            limite: filtroLimite,
          }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">Fecha</th>
              <th className="border p-2">Guía</th>
              <th className="border p-2">Cliente</th>
              <th className="border p-2">Modelo</th>
              <th className="border p-2">Serie</th>
              <th className="border p-2">Tóner</th>
              <th className="border p-2">Tipo</th>
              <th className="border p-2">Último</th>
              <th className="border p-2">Actual</th>
              <th className="border p-2">Diferencia</th>
              <th className="border p-2">Obs.</th>
              <th className="border p-2">Estado Tóner</th>
              {user?.role === 'admin' && <th className="border p-2">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {withLimit.map(r => (
              <tr key={r.id}>
                <td className="border p-2">{new Date(r.fecha).toLocaleDateString()}</td>
                <td className="border p-2">{r.guia || '-'}</td>
                <td className="border p-2">{r.clientes?.nombre || '-'}</td>
                <td className="border p-2">{r.modelo_maquina || '-'}</td>
                <td className="border p-2">{r.serie_maquina || '-'}</td>
                <td className="border p-2">{r.toners?.modelo || '-'}</td>
                <td className="border p-2">{r.tipos_toner_instalado?.nombre || '-'}</td>
                <td className="border p-2">{r.ultimo_contador || 0}</td>
                <td className="border p-2">{r.contador_actual || 0}</td>
                <td className="border p-2">{(r.contador_actual || 0) - (r.ultimo_contador || 0)}</td>
                <td className="border p-2">
                  {r.observaciones
                    ? <button className="text-blue-600 underline" onClick={() => setObservacionModal(r.observaciones)}>Ver</button>
                    : '-'}
                </td>
                <td className="border p-2">
                  {(() => {
                    const dif = (r.contador_actual || 0) - (r.ultimo_contador || 0);
                    const rend = r.toners?.rendimiento || 0;
                    if (rend === 0) return '-';
                    const margen = rend * 0.1;
                    if (dif < rend - margen) return <span className="text-red-600 font-semibold">Bajo rendimiento</span>;
                    if (dif > rend + margen) return <span className="text-yellow-600 font-semibold">Sobre rendimiento</span>;
                    return <span className="text-green-600 font-semibold">OK</span>;
                  })()}
                </td>
                {user?.role === 'admin' && (
                  <td className="border p-2">
                    <button onClick={() => eliminarRegistro(r.id)} className="text-red-600 hover:underline">Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {observacionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-2">Observación</h2>
            <p>{observacionModal}</p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setObservacionModal(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}