import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRutinas, generarRutina } from '../services/rutinas';
import { listTipoRutinas } from '../services/tipoRutina';

export default function Asistente() {
  const navigate = useNavigate();
  const [rutinas, setRutinas] = useState([]);
  const [loadingRutinas, setLoadingRutinas] = useState(true);
  const [mostrarModalCrearRutina, setMostrarModalCrearRutina] = useState(false);
  const [tipoRutinas, setTipoRutinas] = useState([]);
  const [loadingTipoRutinas, setLoadingTipoRutinas] = useState(false);
  const [formData, setFormData] = useState({
    tipo_rutina_id: '',
    sexo: '',
    edad: '',
    peso: '',
    notas: ''
  });
  const [error, setError] = useState('');
  const [errorModal, setErrorModal] = useState('');
  const [generandoRutina, setGenerandoRutina] = useState(false);

  useEffect(() => {
    loadRutinas();
    loadTipoRutinas();
  }, []);

  const loadRutinas = async () => {
    setLoadingRutinas(true);
    setError('');
    try {
      // Solo cargar rutinas activas
      const data = await listRutinas({ activa: true });
      setRutinas(data.data || []);
    } catch (err) {
      console.error('Error al cargar rutinas:', err);
      setError(err.response?.data?.error || 'Error al cargar rutinas');
    } finally {
      setLoadingRutinas(false);
    }
  };

  const loadTipoRutinas = async () => {
    setLoadingTipoRutinas(true);
    try {
      const data = await listTipoRutinas();
      setTipoRutinas(data.data || []);
    } catch (err) {
      console.error('Error al cargar tipos de rutina:', err);
    } finally {
      setLoadingTipoRutinas(false);
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return 'No especificada';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCrearRutina = () => {
    setFormData({
      tipo_rutina_id: '',
      sexo: '',
      edad: '',
      peso: '',
      notas: ''
    });
    setErrorModal('');
    setMostrarModalCrearRutina(true);
  };

  const handleSubmitCrearRutina = async (e) => {
    e.preventDefault();
    setErrorModal('');
    setGenerandoRutina(true);

    try {
      // Validar que todos los campos requeridos estén completos
      if (!formData.tipo_rutina_id || !formData.sexo || !formData.edad || !formData.peso) {
        setErrorModal('Por favor, complete todos los campos obligatorios');
        setGenerandoRutina(false);
        return;
      }

      // Validar rangos
      const edadNum = parseInt(formData.edad);
      const pesoNum = parseFloat(formData.peso);
      
      if (edadNum < 12 || edadNum > 99) {
        setErrorModal('La edad debe estar entre 12 y 99 años');
        setGenerandoRutina(false);
        return;
      }

      if (pesoNum < 20 || pesoNum > 300) {
        setErrorModal('El peso debe estar entre 20 y 300 kg');
        setGenerandoRutina(false);
        return;
      }

      // Llamar al endpoint para generar la rutina
      const response = await generarRutina({
        tipo_rutina_id: formData.tipo_rutina_id,
        sexo: formData.sexo,
        edad: edadNum,
        peso: pesoNum,
        notas: formData.notas.trim() || undefined
      });

      // Si es exitoso, cerrar modal, limpiar formulario y recargar lista
      setMostrarModalCrearRutina(false);
      setFormData({
        tipo_rutina_id: '',
        sexo: '',
        edad: '',
        peso: '',
        notas: ''
      });
      
      // Recargar la lista de rutinas
      await loadRutinas();
    } catch (err) {
      console.error('Error al generar rutina:', err);
      setErrorModal(err.response?.data?.error || 'Error al generar la rutina. Por favor, intenta nuevamente.');
    } finally {
      setGenerandoRutina(false);
    }
  };

  const handleConsultarRutina = (rutina) => {
    navigate(`/rutinas/${rutina.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Asistente Virtual de Entrenamiento</h1>

      {/* Card informativa */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-wide shadow-sm">
            🤖 Powered by IA
          </span>
          <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full uppercase tracking-wide shadow-sm">
            BETA
          </span>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          Crea rutinas personalizadas con Inteligencia Artificial
        </h2>
        
        <p className="text-gray-700 mb-4 leading-relaxed">
          Nuestro asistente virtual utiliza IA avanzada para generar rutinas de entrenamiento completamente personalizadas según tu perfil. 
          Solo necesitas completar un breve formulario con tu información y el sistema diseñará una rutina adaptada a tus necesidades, 
          incluyendo ejercicios específicos, series, repeticiones y tiempos de descanso.
        </p>
        
        <div className="bg-white/60 rounded-lg p-4 mb-4 border border-blue-100">
          <p className="text-sm text-gray-700 font-medium mb-2">✨ Características:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Rutinas adaptadas a tu edad, peso y sexo</li>
            <li>Considera limitaciones médicas o físicas</li>
            <li>Consulta sobre ejercicios con nuestro asistente IA</li>
            <li>Rutinas guardadas y accesibles en cualquier momento</li>
          </ul>
        </div>
        
        <button
          onClick={handleCrearRutina}
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          🚀 Crear Nueva Rutina
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Título de sección */}
      <h2 className="text-2xl font-bold mb-4 mt-8">Mis Rutinas</h2>

      {/* Listado de rutinas */}
      {loadingRutinas ? (
        <div className="text-center py-8 text-gray-500">Cargando rutinas...</div>
      ) : rutinas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 text-lg mb-4">
            No se encontraron rutinas. Haz click en 'Crear Nueva Rutina' arriba para comenzar 💪
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rutinas.map((rutina) => (
            <div
              key={rutina.id}
              onClick={() => handleConsultarRutina(rutina)}
              className="group bg-white p-4 rounded-lg shadow w-full cursor-pointer hover:shadow-lg hover:border-blue-300 border-2 border-transparent transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0 w-full md:w-auto">
                  <h3 className="font-bold text-lg">{rutina.nombre}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    Creada: {formatFecha(rutina.fecha_creacion)}
                  </div>
                </div>
                <div className="flex items-center ml-auto md:ml-4">
                  <span className="text-blue-600 text-4xl transition-transform duration-200 group-hover:-rotate-45">
                    →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crear Rutina */}
      {mostrarModalCrearRutina && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Crear Nueva Rutina</h3>
            
            {errorModal && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorModal}
              </div>
            )}

            {generandoRutina && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
                <p>Generando tu rutina personalizada... Esto puede tomar unos momentos.</p>
              </div>
            )}
            
            <form onSubmit={handleSubmitCrearRutina} className="space-y-4">
              {/* Tipo de Rutina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Rutina *
                </label>
                <select
                  value={formData.tipo_rutina_id}
                  onChange={(e) => setFormData({ ...formData, tipo_rutina_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingTipoRutinas}
                >
                  <option value="">Seleccione un tipo</option>
                  {tipoRutinas.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sexo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo *
                </label>
                <select
                  value={formData.sexo}
                  onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione</option>
                  <option value="hombre">Hombre</option>
                  <option value="mujer">Mujer</option>
                </select>
              </div>

              {/* Edad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edad *
                </label>
                <input
                  type="number"
                  min="12"
                  max="99"
                  value={formData.edad}
                  onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Peso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Notas */}
              <div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Complete este campo si tiene alguna limitación física o condición médica que debamos considerar al diseñar su rutina.
                  </p>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Lesión en rodilla izquierda, hipertensión controlada..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.notas.length}/500 caracteres
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalCrearRutina(false);
                    setErrorModal('');
                  }}
                  disabled={generandoRutina}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={generandoRutina}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generandoRutina ? 'Generando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
