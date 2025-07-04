import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Toners() {
  const [toners, setToners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modelo, setModelo] = useState('');
  const [rendimiento, setRendimiento] = useState('');

  useEffect(() => {
    fetchToners();
  }, []);

  const fetchToners = async () => {
    const { data } = await supabase.from('toners').select('*').order('modelo');
    setToners(data);
  };

  const openModal = (toner = null) => {
    setEditing(toner);
    setModelo(toner?.modelo || '');
    setRendimiento(toner?.rendimiento || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setModelo('');
    setRendimiento('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modelo || !rendimiento) return alert('Completa todos los campos');

    if (editing) {
      await supabase
        .from('toners')
        .update({ modelo, rendimiento: parseInt(rendimiento) })
        .eq('id', editing.id);
    } else {
      await supabase
        .from('toners')
        .insert([{ modelo, rendimiento: parseInt(rendimiento) }]);
    }

    fetchToners();
    closeModal();
  };

  const eliminarToner = async (id) => {
    if (confirm('¿Eliminar este modelo de tóner?')) {
      const { error } = await supabase.from('toners').delete().eq('id', id);
      if (!error) {
        fetchToners();
      } else {
        alert('Error al eliminar: ' + error.message);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">Modelos de Tóner</h1>

      <button
        onClick={() => openModal()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
      >
        Agregar Tóner
      </button>

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 border">Modelo</th>
              <th className="p-2 border">Rendimiento</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {toners.map((toner) => (
              <tr key={toner.id} className="hover:bg-gray-50">
                <td className="p-2 border">{toner.modelo}</td>
                <td className="p-2 border">{toner.rendimiento}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => openModal(toner)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarToner(toner.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-sm w-full">
            <h2 className="text-lg font-bold text-blue-700 mb-4">
              {editing ? 'Editar Tóner' : 'Agregar Tóner'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Modelo</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Rendimiento</label>
                <input
                  type="number"
                  value={rendimiento}
                  onChange={(e) => setRendimiento(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}