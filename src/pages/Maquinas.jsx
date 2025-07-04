import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Maquinas() {
  const [maquinas, setMaquinas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tiposToner, setTiposToner] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState(null);

  const [form, setForm] = useState({
    modelo: '',
    serie: '',
    tipo_toner_id: '',
    guia_entrega: '',
    departamento: '',
    fecha_instalacion: '',
    cliente_id: '',
  });

  useEffect(() => {
    fetchMaquinas();
    fetchClientes();
    fetchTiposToner();
  }, []);

  const fetchMaquinas = async () => {
    const { data, error } = await supabase
      .from('maquinas')
      .select('*, clientes(nombre), tipos_toner(nombre)')
      .order('fecha_instalacion', { ascending: false });
    if (!error) setMaquinas(data);
  };

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nombre');
    setClientes(data);
  };

  const fetchTiposToner = async () => {
    const { data } = await supabase.from('tipos_toner').select('id, nombre');
    setTiposToner(data);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openModal = (maquina = null) => {
    if (maquina) {
      setForm({
        modelo: maquina.modelo,
        serie: maquina.serie,
        tipo_toner_id: maquina.tipo_toner_id || '',
        guia_entrega: maquina.guia_entrega || '',
        departamento: maquina.departamento || '',
        fecha_instalacion: maquina.fecha_instalacion || '',
        cliente_id: maquina.cliente_id || '',
      });
      setEditingMaquina(maquina.id);
    } else {
      setForm({
        modelo: '',
        serie: '',
        tipo_toner_id: '',
        guia_entrega: '',
        departamento: '',
        fecha_instalacion: '',
        cliente_id: '',
      });
      setEditingMaquina(null);
    }
    setModalOpen(true);
  };

  const saveMaquina = async () => {
    const { error } = editingMaquina
      ? await supabase.from('maquinas').update(form).eq('id', editingMaquina)
      : await supabase.from('maquinas').insert([form]);

    if (!error) {
      fetchMaquinas();
      setModalOpen(false);
    } else {
      alert('Error: ' + error.message);
    }
  };

  const deleteMaquina = async (id) => {
    if (confirm('¿Eliminar esta máquina?')) {
      await supabase.from('maquinas').delete().eq('id', id);
      fetchMaquinas();
    }
  };

  return (
    <div className="p-6 mt-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Gestión de Máquinas</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          + Nueva Máquina
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-sm text-left border border-gray-200">
          <thead className="bg-blue-50 text-gray-700">
            <tr>
              <th className="px-4 py-2 border">Modelo</th>
              <th className="px-4 py-2 border">Serie</th>
              <th className="px-4 py-2 border">Tipo Tóner</th>
              <th className="px-4 py-2 border">Guía</th>
              <th className="px-4 py-2 border">Depto</th>
              <th className="px-4 py-2 border">Instalación</th>
              <th className="px-4 py-2 border">Cliente</th>
              <th className="px-4 py-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {maquinas.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{m.modelo}</td>
                <td className="px-4 py-2 border">{m.serie}</td>
                <td className="px-4 py-2 border">{m.tipos_toner?.nombre || 'N/A'}</td>
                <td className="px-4 py-2 border">{m.guia_entrega}</td>
                <td className="px-4 py-2 border">{m.departamento}</td>
                <td className="px-4 py-2 border">{m.fecha_instalacion}</td>
                <td className="px-4 py-2 border">{m.clientes?.nombre}</td>
                <td className="px-4 py-2 border space-x-2">
                  <button
                    onClick={() => openModal(m)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteMaquina(m.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              {editingMaquina ? 'Editar Máquina' : 'Nueva Máquina'}
            </h3>

            <input name="modelo" placeholder="Modelo" value={form.modelo} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
            <input name="serie" placeholder="Serie" value={form.serie} onChange={handleChange} className="w-full border px-3 py-2 rounded" />

            <select name="tipo_toner_id" value={form.tipo_toner_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
              <option value="">-- Tipo de Tóner --</option>
              {tiposToner.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>

            <input name="guia_entrega" placeholder="Guía de entrega" value={form.guia_entrega} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
            <input name="departamento" placeholder="Departamento" value={form.departamento} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
            <input type="date" name="fecha_instalacion" value={form.fecha_instalacion} onChange={handleChange} className="w-full border px-3 py-2 rounded" />

            <select name="cliente_id" value={form.cliente_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
              <option value="">-- Seleccionar Cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
              <button onClick={saveMaquina} className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
