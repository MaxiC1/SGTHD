import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { formatearNumeroCL } from '../utils/formatUtils';

export default function RegistroForm() {
  const [serieInput, setSerieInput] = useState('');
  const [maquinasFiltradas, setMaquinasFiltradas] = useState([]);
  const [serieSeleccionada, setSerieSeleccionada] = useState('');
  const [datosMaquina, setDatosMaquina] = useState(null);
  const [tiposToner, setTiposToner] = useState([]);
  const [tipoTonerInstalado, setTipoTonerInstalado] = useState('');
  const [ultimoContador, setUltimoContador] = useState(null);
  const [fechaUltimoCambio, setFechaUltimoCambio] = useState(null);
  const [rendimientoEsperado, setRendimientoEsperado] = useState(null);

  const [contadorActual, setContadorActual] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fecha, setFecha] = useState('');
  const [guia, setGuia] = useState('');
  const [mensajeDuracion, setMensajeDuracion] = useState('');

  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const fetchDatos = async () => {
      const { data: tipos } = await supabase.from('tipos_toner').select('*');
      setTiposToner(tipos || []);
    };
    fetchDatos();
  }, []);

  useEffect(() => {
    if (!serieInput) return;
    const fetchFiltrado = async () => {
      const { data } = await supabase
        .from('maquinas')
        .select('id, serie')
        .ilike('serie', `%${serieInput}%`);
      setMaquinasFiltradas(data || []);
    };
    fetchFiltrado();
  }, [serieInput]);

  useEffect(() => {
    if (!serieSeleccionada) {
      setDatosMaquina(null);
      return;
    }

    const fetchMaquina = async () => {
      const { data: maquina } = await supabase
        .from('maquinas')
        .select(`
          id, modelo, cliente_id, modelo_toner_id, tipo_toner_id,
          departamento, serie,
          clientes ( nombre, ubicacion )
        `)
        .eq('serie', serieSeleccionada)
        .single();

      if (maquina) {
        let modeloToner = '';
        let rendimiento = 0;

        if (maquina.modelo_toner_id) {
          const { data: toner } = await supabase
            .from('toners')
            .select('modelo, rendimiento')
            .eq('id', maquina.modelo_toner_id)
            .single();

          modeloToner = toner?.modelo || '';
          rendimiento = toner?.rendimiento || 0;
        }

        setDatosMaquina({
          ...maquina,
          cliente: maquina.clientes?.nombre || '',
          ubicacion: maquina.clientes?.ubicacion || '',
          modelo_toner: modeloToner,
          rendimiento,
        });

        setRendimientoEsperado(rendimiento);
        setTipoTonerInstalado(maquina.tipo_toner_id);

        const { data: ultimos } = await supabase
          .from('registros')
          .select('contador_actual, fecha')
          .eq('serie_maquina', serieSeleccionada)
          .order('fecha', { ascending: false })
          .limit(1)
        
        const ultimo = ultimos?.[0];

        setUltimoContador(ultimo?.contador_actual || 0);
        setFechaUltimoCambio(ultimo?.fecha || null);
      }
    };
    fetchMaquina();
  }, [serieSeleccionada]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const contadorNumerico = parseInt(contadorActual);

    if (contadorNumerico < (ultimoContador ?? 0)) {
      alert('Error: el contador actual no puede ser menor que el último registrado.');
      return;
    }

    const diferencia = contadorNumerico - (ultimoContador ?? 0);
    const requiereObs = rendimientoEsperado && diferencia < rendimientoEsperado;

    if (requiereObs && !observaciones.trim()) {
      alert('Debe ingresar una observación si el tóner duró menos de lo esperado.');
      return;
    }

    const { error } = await supabase.from('registros_pendientes').insert([{
      fecha,
      guia,
      cliente_id: datosMaquina.cliente_id,
      modelo_maquina: datosMaquina.modelo,
      serie_maquina: serieSeleccionada,
      modelo_toner_id: datosMaquina.modelo_toner_id,
      tipo_toner_instalado_id: tipoTonerInstalado,
      ultimo_contador: ultimoContador,
      contador_actual: contadorNumerico,
      observaciones,
      creado_por: user?.id
    }]);

    if (!error) {
      let mensaje = '';
      if (diferencia === rendimientoEsperado) mensaje = '✅ El tóner duró lo estimado.';
      else if (diferencia < rendimientoEsperado) mensaje = '⚠️ Duró menos de lo esperado.';
      else mensaje = '🎉 El tóner duró más de lo estimado.';

      setMensajeDuracion(mensaje);
      alert('Registro guardado correctamente');

      // Reset
      setSerieSeleccionada('');
      setSerieInput('');
      setContadorActual('');
      setFecha('');
      setGuia('');
      setObservaciones('');
      setDatosMaquina(null);
    } else {
      alert('Error al guardar: ' + error.message);
    }
  };

  const formularioInvalido = !fecha || !guia || !serieSeleccionada || contadorActual === '';

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold text-blue-700">Registrar cambio de tóner</h2>

      {/* Fecha y guía */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Fecha del cambio</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Guía de despacho</label>
          <input
            type="text"
            value={guia}
            onChange={(e) => setGuia(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
      </div>

      {/* Buscador de serie */}
      <div>
        <label className="block text-sm font-medium">Buscar número de serie</label>
        <input
          type="text"
          value={serieInput}
          onChange={(e) => {
            setSerieInput(e.target.value);
            setSerieSeleccionada('');
          }}
          placeholder="Buscar serie..."
          className="w-full border p-2 rounded"
        />
        {serieInput && maquinasFiltradas.length > 0 && (
          <ul className="border border-gray-300 rounded max-h-40 overflow-y-auto">
            {maquinasFiltradas.map((m) => (
              <li
                key={m.id}
                className="cursor-pointer px-2 py-1 hover:bg-gray-100"
                onClick={() => {
                  setSerieSeleccionada(m.serie);
                  setSerieInput(m.serie);
                  setMaquinasFiltradas([]);
                }}
              >
                {m.serie}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Info de máquina */}
      {datosMaquina && (
        <div className="border rounded p-4 bg-gray-50 space-y-2">
          <div><strong>Cliente:</strong> {datosMaquina.cliente}</div>
          <div><strong>Ubicación:</strong> {datosMaquina.ubicacion}</div>
          <div><strong>Departamento:</strong> {datosMaquina.departamento}</div>
          <div><strong>Modelo de máquina:</strong> {datosMaquina.modelo}</div>
          <div><strong>Modelo de tóner:</strong> {datosMaquina.modelo_toner}</div>
          <div><strong>Tóner recomendado:</strong> {tiposToner.find(t => t.id === datosMaquina.tipo_toner_id)?.nombre}</div>
          <div>
            <label className="block font-medium">Tóner a despachar</label>
            <select
              value={tipoTonerInstalado}
              onChange={(e) => setTipoTonerInstalado(e.target.value)}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">-- Selecciona tipo de tóner --</option>
              {tiposToner.map(tipo => (
                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
              ))}
            </select>
          </div>
          <div><strong>Rendimiento esperado:</strong> {formatearNumeroCL(rendimientoEsperado)} copias</div>
          <div><strong>Último contador:</strong> {formatearNumeroCL(ultimoContador)}</div>
          {fechaUltimoCambio && (
            <div><strong>Último cambio:</strong> {new Date(fechaUltimoCambio).toLocaleDateString()}</div>
          )}
        </div>
      )}

      {/* Contador actual */}
      <div>
        <label className="block text-sm font-medium">Contador actual</label>
        <input
          type="number"
          value={contadorActual}
          onChange={(e) => setContadorActual(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium">Observaciones</label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="w-full border p-2 rounded"
          rows={3}
        />
      </div>

      {/* Advertencia */}
      {formularioInvalido && (
        <p className="text-red-600 text-sm">Completa todos los campos requeridos.</p>
      )}

      {/* Botón */}
      <button
        type="submit"
        disabled={formularioInvalido}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Guardar registro
      </button>

      {mensajeDuracion && (
        <p className="mt-3 text-blue-700 font-semibold">{mensajeDuracion}</p>
      )}
    </form>
  );
}