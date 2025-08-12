import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function Maquinas() {
  const [maquinas, setMaquinas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [modelosToner, setModelosToner] = useState([]);
  const [tiposToner, setTiposToner] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filtroModelo, setFiltroModelo] = useState('');
  const [filtroSerie, setFiltroSerie] = useState('');
  const [filtroToner, setFiltroToner] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');

  const [form, setForm] = useState({
    modelo: '',
    serie: '',
    modelo_toner_id: '',
    tipo_toner_id: '',
    guia_entrega: '',
    departamento: '',
    fecha_instalacion: '',
    cliente_id: '',
    es_color: false,
  });

  useEffect(() => {
    fetchMaquinas();
    fetchClientes();
    fetchModelosToner();
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

  const fetchModelosToner = async () => {
    const { data } = await supabase.from('toners').select('id, modelo');
    setModelosToner(data);
  };

  const fetchTiposToner = async () => {
    const { data, error } = await supabase.from('tipos_toner').select('id, nombre');
    if (!error) setTiposToner(data);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openModal = (maquina = null) => {
    if (maquina) {
      setForm({
        modelo: maquina.modelo,
        serie: maquina.serie,
        modelo_toner_id: maquina.modelo_toner_id || '',
        tipo_toner_id: maquina.tipo_toner_id || '',
        guia_entrega: maquina.guia_entrega || '',
        departamento: maquina.departamento || '',
        fecha_instalacion: maquina.fecha_instalacion || '',
        cliente_id: maquina.cliente_id || '',
        es_color: maquina.es_color || false,
      });
      setEditingMaquina(maquina.id);
    } else {
      setForm({
        modelo: '',
        serie: '',
        modelo_toner_id: '',
        tipo_toner_id: '',
        guia_entrega: '',
        departamento: '',
        fecha_instalacion: '',
        cliente_id: '',
        es_color: false,
      });
      setEditingMaquina(null);
    }
    setModalOpen(true);
  };

  const saveMaquina = async () => {
    if (!form.modelo || !form.serie || !form.modelo_toner_id || !form.cliente_id || !form.tipo_toner_id) {
      return toast.error('Completa todos los campos obligatorios');
    }

    let response;
    if (editingMaquina) {
      response = await supabase.from('maquinas').update(form).eq('id', editingMaquina).select().single();
    } else {
      response = await supabase.from('maquinas').insert([form]).select().single();
    }

    if (response.error) {
      toast.error('Error al guardar máquina');
      return;
    }

    const maquina = response.data;

    // Insertar en toner_por_maquina solo si es nuevo
    if (!editingMaquina) {
      const colores = form.es_color ? ['Black', 'Cyan', 'Magenta', 'Yellow'] : ['Black'];
      const registros = colores.map((color) => ({
        maquina_id: maquina.id,
        color,
        modelo_toner_id: form.modelo_toner_id,
      }));

      await supabase.from('toner_por_maquina').insert(registros);
    }

    fetchMaquinas();
    setModalOpen(false);
    setEditingMaquina(null);
    toast.success('Máquina guardada correctamente');
  };

  const deleteMaquina = async (id) => {
    if (confirm('¿Eliminar esta máquina?')) {
      await supabase.from('maquinas').delete().eq('id', id);
      fetchMaquinas();
    }
  };

  const maquinasFiltradas = maquinas.filter((m) =>
    m.modelo.toLowerCase().includes(filtroModelo.toLowerCase()) &&
    m.serie.toLowerCase().includes(filtroSerie.toLowerCase()) &&
    m.tipos_toner?.nombre.toLowerCase().includes(filtroToner.toLowerCase()) &&
    m.clientes?.nombre.toLowerCase().includes(filtroCliente.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = maquinasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(maquinasFiltradas.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="ml-64 p-6 max-w-6xl mx-auto mt-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Gestión de Máquinas</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          + Nueva Máquina
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Modelo:</label>
          <select
            value={filtroModelo}
            onChange={(e) => setFiltroModelo(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="">Todos</option>
            {[...new Set(maquinas.map((m) => m.modelo))].map((modelo) => (
              <option key={modelo} value={modelo}>
                {modelo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Serie:</label>
          <input
            type="text"
            value={filtroSerie}
            onChange={(e) => setFiltroSerie(e.target.value)}
            className="w-full border px-2 py-1 rounded"
            placeholder="Buscar por serie"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de Tóner:</label>
          <select
            value={filtroToner}
            onChange={(e) => setFiltroToner(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="">Todos</option>
            {tiposToner.map((tipo) => (
              <option key={tipo.id} value={tipo.nombre}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>
          
        <div>
          <label className="block text-sm font-medium text-gray-700">Cliente:</label>
          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="">Todos</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.nombre}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-sm text-left border border-gray-200">
          <thead className="bg-blue-50 text-gray-700">
            <tr>
              <th className="px-4 py-2 border">N°</th>
              <th className="px-4 py-2 border">Modelo</th>
              <th className="px-4 py-2 border">Serie</th>
              <th className="px-4 py-2 border">Tipo de Tóner</th>
              <th className="px-4 py-2 border">Guía</th>
              <th className="px-4 py-2 border">Depto</th>
              <th className="px-4 py-2 border">Instalación</th>
              <th className="px-4 py-2 border">Cliente</th>
              <th className="px-4 py-2 border">Color</th>
              <th className="px-4 py-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((m, index) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{indexOfFirstItem + index + 1}</td>
                <td className="px-4 py-2 border">{m.modelo}</td>
                <td className="px-4 py-2 border">{m.serie}</td>
                <td className="px-4 py-2 border">{m.tipos_toner?.nombre}</td>
                <td className="px-4 py-2 border">{m.guia_entrega}</td>
                <td className="px-4 py-2 border">{m.departamento}</td>
                <td className="px-4 py-2 border">{m.fecha_instalacion}</td>
                <td className="px-4 py-2 border">{m.clientes?.nombre}</td>
                <td className="px-4 py-2 border">{m.es_color ? 'Sí' : 'No'}</td>
                <td className="px-4 py-2 border space-x-2">
                  <button
                    onClick={() => openModal(m)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteMaquina(m.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center space-x-2 mt-4 max-w-full overflow-x-auto px-2">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <div className="flex flex-wrap justify-center items-center space-x-2 mb-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, Math.ceil(totalPages / 2)).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.ceil(totalPages / 2)).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded shadow w-full max-w-2xl sm:flex sm:flex-col">
            <h3 className="text-lg font-semibold text-gray-700">
              {editingMaquina ? 'Editar Máquina' : 'Nueva Máquina'}
            </h3>

            <input name="modelo" placeholder="Modelo" value={form.modelo} onChange={handleChange} className="w-full border px-3 py-2 rounded mb-2" />
            <input name="serie" placeholder="Serie" value={form.serie} onChange={handleChange} className="w-full border px-3 py-2 rounded mb-2" />

            <label className="block text-sm font-medium text-gray-600">Modelo de Tóner:</label>
            <select name="modelo_toner_id" value={form.modelo_toner_id} onChange={handleChange} className="w-full border px-3 py-2 rounded mb-2">
              <option value="">-- Seleccionar modelo --</option>
              {modelosToner.map((m) => (
                <option key={m.id} value={m.id}>{m.modelo}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-600">Tipo de Tóner:</label>
            <select
              name="tipo_toner_id"
              value={form.tipo_toner_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mb-2"
            >
              <option value="">-- Seleccionar Tipo --</option>
              {tiposToner.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))};
            </select>

            <input name="guia_entrega" placeholder="Guía de entrega" value={form.guia_entrega} onChange={handleChange} className="w-full border px-3 py-2 rounded mb-2" />
            <input name="departamento" placeholder="Departamento" value={form.departamento} onChange={handleChange} className="w-full border px-3 py-2 rounded mb-2" />
            <input type="date" name="fecha_instalacion" value={form.fecha_instalacion} onChange={handleChange} className="w-full border px-3 py-2 rounded mb-2" />

            <select name="cliente_id" value={form.cliente_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
              <option value="">-- Seleccionar Cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" name="es_color" checked={form.es_color} onChange={handleChange} />
              ¿Es máquina color?
            </label>

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
