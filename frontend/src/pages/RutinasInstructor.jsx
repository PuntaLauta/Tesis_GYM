import { useState, useEffect } from 'react';
import { listRutinasInstructor, revisarEjercicio } from '../services/rutinas';

export default function RutinasInstructor() {
  const [rutinas, setRutinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [ejercicioRevisar, setEjercicioRevisar] = useState(null);
  const [notasRevisar, setNotasRevisar] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    loadRutinas();
  }, []);

  const loadRutinas = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listRutinasInstructor();
      setRutinas(data.data || []);
    } catch (err) {
      console.error('Error al cargar rutinas:', err);
      setError(err.response?.data?.error || 'Error al cargar rutinas');
    } finally {
      setLoading(false);
    }
  };

  const handleVerEjercicios = (rutina) => {
    setRutinaSeleccionada(rutina);
  };

  const handleCerrarEjercicios = () => {
    setRutinaSeleccionada(null);
  };

  const handleRevisarEjercicio = (ejercicio) => {
    setEjercicioRevisar(ejercicio);
    setNotasRevisar(ejercicio.descripcion_profesor || '');
  };

  const handleCerrarModal = () => {
    setEjercicioRevisar(null);
    setNotasRevisar('');
  };

  const handleAprobar = async () => {
    if (!ejercicioRevisar) return;
    
    setGuardando(true);
    try {
      await revisarEjercicio(ejercicioRevisar.id, 'aprobado', notasRevisar);
      // Recargar rutinas para actualizar estados
      await loadRutinas();
      // Actualizar la rutina seleccionada si existe
      if (rutinaSeleccionada) {
        const data = await listRutinasInstructor();
        const rutinaActualizada = data.data.find(r => r.id === rutinaSeleccionada.id);
        if (rutinaActualizada) {
          setRutinaSeleccionada(rutinaActualizada);
        }
      }
      handleCerrarModal();
    } catch (err) {
      console.error('Error al aprobar ejercicio:', err);
      alert(err.response?.data?.error || 'Error al aprobar el ejercicio');
    } finally {
      setGuardando(false);
    }
  };

  const handleRechazar = async () => {
    if (!ejercicioRevisar) return;
    
    setGuardando(true);
    try {
      await revisarEjercicio(ejercicioRevisar.id, 'rechazado', notasRevisar);
      // Recargar rutinas para actualizar estados
      await loadRutinas();
      // Actualizar la rutina seleccionada si existe
      if (rutinaSeleccionada) {
        const data = await listRutinasInstructor();
        const rutinaActualizada = data.data.find(r => r.id === rutinaSeleccionada.id);
        if (rutinaActualizada) {
          setRutinaSeleccionada(rutinaActualizada);
        }
      }
      handleCerrarModal();
    } catch (err) {
      console.error('Error al rechazar ejercicio:', err);
      alert(err.response?.data?.error || 'Error al rechazar el ejercicio');
    } finally {
      setGuardando(false);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Cargando rutinas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Si hay una rutina seleccionada, mostrar sus ejercicios
  let ejercicios = [];
  if (rutinaSeleccionada) {
    try {
      ejercicios = Array.isArray(rutinaSeleccionada.ejercicios)
        ? rutinaSeleccionada.ejercicios
        : typeof rutinaSeleccionada.ejercicios === 'string'
        ? JSON.parse(rutinaSeleccionada.ejercicios)
        : [];
    } catch (e) {
      ejercicios = [];
    }
  }

  return (
    <>
      {rutinaSeleccionada ? (
        // Vista de ejercicios de una rutina
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={handleCerrarEjercicios}
              className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              ← Volver a rutinas
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{rutinaSeleccionada.nombre}</h1>
            {rutinaSeleccionada.descripcion && (
              <p className="text-gray-600 mt-2">{rutinaSeleccionada.descripcion}</p>
            )}
          </div>

          <div className="space-y-4">
            {ejercicios.length === 0 ? (
              <p className="text-gray-500">No hay ejercicios definidos.</p>
            ) : (
              ejercicios.map((ejercicio, index) => {
                // Determinar estado_id del ejercicio
                let estadoId = ejercicio.estado_id;
                if (typeof estadoId === 'string') {
                  estadoId = parseInt(estadoId, 10);
                }
                if (!estadoId || isNaN(estadoId)) {
                  estadoId = 1; // PENDIENTE por defecto
                }

                // Configuración del tooltip según el estado_id
                const estadoConfig = {
                  1: { // PENDIENTE
                    emoji: '⚠️',
                    color: 'bg-yellow-500',
                    texto: 'Pendiente de Revisión',
                    hoverColor: 'hover:bg-yellow-600'
                  },
                  2: { // APROBADO
                    emoji: '✅',
                    color: 'bg-green-500',
                    texto: 'Aprobado por Instructor',
                    hoverColor: 'hover:bg-green-600'
                  },
                  3: { // RECHAZADO
                    emoji: '❌',
                    color: 'bg-red-500',
                    texto: 'Rechazado por Instructor',
                    hoverColor: 'hover:bg-red-600'
                  }
                };

                const config = estadoConfig[estadoId] || estadoConfig[1];

                return (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative bg-white">
                    {/* Tooltip de estado en esquina superior derecha */}
                    <div className="absolute top-2 right-2">
                      <div className="group relative">
                        <button
                          className={`${config.color} ${config.hoverColor} text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors shadow-md`}
                          title={config.texto}
                        >
                          <span>{config.texto}</span>
                          <span>{config.emoji}</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="font-semibold mb-2 pr-32">{ejercicio.nombre || `Ejercicio ${index + 1}`}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {ejercicio.series && (
                        <p>
                          <strong>Series:</strong> {ejercicio.series}
                        </p>
                      )}
                      {ejercicio.repeticiones && (
                        <p>
                          <strong>Repeticiones:</strong> {ejercicio.repeticiones}
                        </p>
                      )}
                      {ejercicio.descanso && (
                        <p>
                          <strong>Descanso:</strong> {ejercicio.descanso}
                        </p>
                      )}
                      {ejercicio.notas && (
                        <p>
                          <strong>Notas del Asistente IA:</strong> {ejercicio.notas}
                        </p>
                      )}
                      <p>
                        <strong>Notas del Instructor:</strong> {ejercicio.descripcion_profesor && ejercicio.descripcion_profesor.trim() 
                          ? ejercicio.descripcion_profesor 
                          : 'Sin notas del instructor'}
                      </p>
                    </div>

                    {/* Botón Revisar ejercicio solo si está PENDIENTE */}
                    {estadoId === 1 && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleRevisarEjercicio(ejercicio)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Revisar ejercicio
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        // Vista de lista de rutinas
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Rutinas</h1>

          {rutinas.length === 0 ? (
            <p className="text-gray-500">No hay rutinas disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rutinas.map((rutina) => {
                let ejerciciosCard = [];
                try {
                  ejerciciosCard = Array.isArray(rutina.ejercicios)
                    ? rutina.ejercicios
                    : typeof rutina.ejercicios === 'string'
                    ? JSON.parse(rutina.ejercicios)
                    : [];
                } catch (e) {
                  ejerciciosCard = [];
                }

                return (
                  <div
                    key={rutina.id}
                    className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleVerEjercicios(rutina)}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {rutina.nombre}
                    </h3>
                    {rutina.descripcion && (
                      <p className="text-sm text-gray-600 mb-3">{rutina.descripcion}</p>
                    )}
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Ejercicios:</strong> {ejerciciosCard.length} ejercicio{ejerciciosCard.length !== 1 ? 's' : ''}
                      </p>
                      {rutina.fecha_creacion && (
                        <p>
                          <strong>Fecha de creación:</strong> {formatFecha(rutina.fecha_creacion)}
                        </p>
                      )}
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          rutina.activa === 1 || rutina.activa === true
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rutina.activa === 1 || rutina.activa === true ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal para revisar ejercicio - siempre disponible */}
      {ejercicioRevisar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Revisar Ejercicio</h2>
            <p className="text-gray-700 mb-4">
              <strong>Ejercicio:</strong> {ejercicioRevisar.nombre}
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Notas
              </label>
              <textarea
                value={notasRevisar}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setNotasRevisar(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Escribe las notas del instructor (máximo 500 caracteres)"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {notasRevisar.length}/500 caracteres
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAprobar}
                disabled={guardando}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? 'Guardando...' : 'Aprobar'}
              </button>
              <button
                onClick={handleRechazar}
                disabled={guardando}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? 'Guardando...' : 'Rechazar'}
              </button>
              <button
                onClick={handleCerrarModal}
                disabled={guardando}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

