import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listRutinas, deleteRutina, toggleActiva, getRutina } from '../services/rutinas';
import RutinaCard from '../components/RutinaCard';

export default function MisRutinas() {
  const [rutinas, setRutinas] = useState([]);
  const [rutinasFiltradas, setRutinasFiltradas] = useState([]);
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'activas', 'inactivas'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rutinaDetalle, setRutinaDetalle] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [rutinaAEliminar, setRutinaAEliminar] = useState(null);
  const [ocultarRechazados, setOcultarRechazados] = useState(false);

  useEffect(() => {
    loadRutinas();
  }, []);

  useEffect(() => {
    filtrarRutinas();
  }, [filtro, rutinas]);

  const loadRutinas = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listRutinas();
      setRutinas(data.data || []);
    } catch (err) {
      console.error('Error al cargar rutinas:', err);
      setError(err.response?.data?.error || 'Error al cargar rutinas');
    } finally {
      setLoading(false);
    }
  };

  const filtrarRutinas = () => {
    let filtradas = rutinas;
    
    if (filtro === 'activas') {
      filtradas = rutinas.filter((r) => r.activa === 1 || r.activa === true);
    } else if (filtro === 'inactivas') {
      filtradas = rutinas.filter((r) => r.activa === 0 || r.activa === false);
    }
    
    setRutinasFiltradas(filtradas);
  };

  const handleVerDetalle = async (rutina) => {
    try {
      const data = await getRutina(rutina.id);
      setRutinaDetalle(data.data);
      setMostrarDetalle(true);
    } catch (err) {
      console.error('Error al obtener detalle:', err);
      alert('Error al cargar los detalles de la rutina');
    }
  };

  const handleEliminar = async () => {
    if (!rutinaAEliminar) return;

    try {
      await deleteRutina(rutinaAEliminar.id);
      setRutinaAEliminar(null);
      await loadRutinas();
    } catch (err) {
      console.error('Error al eliminar rutina:', err);
      alert(err.response?.data?.error || 'Error al eliminar la rutina');
    }
  };

  const handleToggleActiva = async (rutina) => {
    try {
      const nuevaActiva = !(rutina.activa === 1 || rutina.activa === true);
      await toggleActiva(rutina.id, nuevaActiva);
      await loadRutinas();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert(err.response?.data?.error || 'Error al cambiar el estado de la rutina');
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Rutinas</h1>
        <Link
          to="/asistente"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Crear Nueva Rutina
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFiltro('todas')}
          className={`px-4 py-2 rounded transition-colors ${
            filtro === 'todas'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltro('activas')}
          className={`px-4 py-2 rounded transition-colors ${
            filtro === 'activas'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Activas
        </button>
        <button
          onClick={() => setFiltro('inactivas')}
          className={`px-4 py-2 rounded transition-colors ${
            filtro === 'inactivas'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Inactivas
        </button>
      </div>

      {/* Lista de rutinas */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando rutinas...</div>
      ) : rutinasFiltradas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {filtro === 'todas'
              ? 'No tienes rutinas guardadas.'
              : filtro === 'activas'
              ? 'No tienes rutinas activas.'
              : 'No tienes rutinas inactivas.'}
          </p>
          <Link
            to="/asistente"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-block"
          >
            Crear mi primera rutina
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rutinasFiltradas.map((rutina) => (
            <RutinaCard
              key={rutina.id}
              rutina={rutina}
              onView={handleVerDetalle}
              onDelete={(r) => setRutinaAEliminar(r)}
              onToggleActiva={handleToggleActiva}
            />
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {mostrarDetalle && rutinaDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{rutinaDetalle.nombre}</h2>
              <button
                onClick={() => {
                  setMostrarDetalle(false);
                  setRutinaDetalle(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {rutinaDetalle.descripcion && (
              <p className="text-gray-600 mb-4">{rutinaDetalle.descripcion}</p>
            )}

            <div className="mb-4 text-sm text-gray-600">
              <p>
                <strong>Fecha de creación:</strong> {formatFecha(rutinaDetalle.fecha_creacion)}
              </p>
              {rutinaDetalle.fecha_inicio && (
                <p>
                  <strong>Fecha de inicio:</strong> {formatFecha(rutinaDetalle.fecha_inicio)}
                </p>
              )}
              {rutinaDetalle.fecha_fin && (
                <p>
                  <strong>Fecha de fin:</strong> {formatFecha(rutinaDetalle.fecha_fin)}
                </p>
              )}
              <p>
                <strong>Estado:</strong>{' '}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    rutinaDetalle.activa === 1 || rutinaDetalle.activa === true
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {rutinaDetalle.activa === 1 || rutinaDetalle.activa === true
                    ? 'Activa'
                    : 'Inactiva'}
                </span>
              </p>
            </div>

            <div>
              {(() => {
                let ejercicios = [];
                try {
                  if (Array.isArray(rutinaDetalle.ejercicios)) {
                    ejercicios = rutinaDetalle.ejercicios;
                  } else if (typeof rutinaDetalle.ejercicios === 'string') {
                    ejercicios = JSON.parse(rutinaDetalle.ejercicios);
                  } else {
                    ejercicios = [];
                  }
                } catch (e) {
                  console.error('Error al parsear ejercicios:', e);
                  ejercicios = [];
                }

                const ejerciciosVisibles = ocultarRechazados
                  ? ejercicios.filter((e) => {
                      const id = typeof e.estado_id === 'string' ? parseInt(e.estado_id, 10) : e.estado_id;
                      return id !== 3;
                    })
                  : ejercicios;

                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h3 className="text-lg font-semibold">Ejercicios:</h3>
                      {ejercicios.length > 0 && (
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={ocultarRechazados}
                            onChange={(e) => setOcultarRechazados(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Ocultar ejercicios rechazados</span>
                        </label>
                      )}
                    </div>
                    {ejerciciosVisibles.length === 0 ? (
                      <p className="text-gray-500">
                        {ejercicios.length === 0
                          ? 'No hay ejercicios definidos.'
                          : 'No hay ejercicios para mostrar (todos están rechazados o filtrados).'}
                      </p>
                    ) : (
                  <div className="space-y-3">
                    {ejerciciosVisibles.map((ejercicio, index) => {
                      // Determinar estado_id del ejercicio (por defecto 1 = PENDIENTE)
                      // Si tiene estado_id numérico, usarlo; si tiene estado string, mapearlo; sino default 1
                      let estadoId = ejercicio.estado_id;
                      
                      // Convertir a número si es string
                      if (typeof estadoId === 'string') {
                        estadoId = parseInt(estadoId, 10);
                      }
                      
                      if (!estadoId || isNaN(estadoId)) {
                        // Compatibilidad con ejercicios antiguos que usan estado como string
                        if (ejercicio.estado === 'APROBADO') estadoId = 2;
                        else if (ejercicio.estado === 'RECHAZADO') estadoId = 3;
                        else estadoId = 1; // PENDIENTE por defecto
                      }
                      
                      // Configuración del botón según el estado_id
                      const estadoConfig = {
                        1: { // PENDIENTE
                          emoji: '⚠️',
                          color: 'bg-yellow-500',
                          texto: 'Pendiente de Revisión por un Instructor',
                          hoverColor: 'hover:bg-yellow-600'
                        },
                        2: { // APROBADO
                          emoji: '✅',
                          color: 'bg-green-500',
                          texto: 'Verificado por un Instructor',
                          hoverColor: 'hover:bg-green-600'
                        },
                        3: { // RECHAZADO
                          emoji: '❌',
                          color: 'bg-red-500',
                          texto: 'Rechazado por un Instructor',
                          hoverColor: 'hover:bg-red-600'
                        },
                        4: { // SUGERIDO
                          emoji: '💡',
                          color: 'bg-indigo-500',
                          texto: 'Sugerido por un instructor',
                          hoverColor: 'hover:bg-indigo-600'
                        }
                      };
                      
                      const config = estadoConfig[estadoId] || estadoConfig[1];
                      
                      return (
                      <div key={index} className="border rounded p-3 relative">
                        {/* Botón de estado - en desktop esquina superior derecha */}
                        <div className="absolute top-2 right-2 sm:block hidden">
                          <button
                            className={`${config.color} ${config.hoverColor} text-white rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium transition-colors shadow-md`}
                          >
                            <span>{config.texto}</span>
                            <span>{config.emoji}</span>
                          </button>
                        </div>
                        
                        <h4 className="font-semibold mb-2 sm:pr-32 pr-0">{ejercicio.nombre || `Ejercicio ${index + 1}`}</h4>
                        
                        {/* Panel de estado para móvil - debajo del título */}
                        <div className="mb-2 sm:hidden">
                          <div className={`${config.color} text-white rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium shadow-md w-fit`}>
                            <span>{config.texto}</span>
                            <span>{config.emoji}</span>
                          </div>
                        </div>
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
                          {estadoId !== 4 && ejercicio.notas && (
                            <p>
                              <strong>Notas del Asistente IA:</strong> {ejercicio.notas}
                            </p>
                          )}
                          <p>
                            <strong>Notas del Instructor:</strong>{' '}
                            {ejercicio.descripcion_profesor && ejercicio.descripcion_profesor.trim()
                              ? ejercicio.descripcion_profesor
                              : estadoId === 4 && ejercicio.notas
                                ? ejercicio.notas
                                : estadoId === 4 && ejercicio.descripcion
                                  ? ejercicio.descripcion
                                  : 'Sin notas del instructor'}
                          </p>
                          {(estadoId === 2 || estadoId === 3 || estadoId === 4) && ejercicio.instructor_nombre && (
                            <p className="text-gray-500 text-xs mt-1">
                              {estadoId === 2 ? 'Aprobado por' : estadoId === 3 ? 'Rechazado por' : 'Sugerido por'} {ejercicio.instructor_nombre}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {rutinaAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas eliminar la rutina{' '}
              <strong>{rutinaAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRutinaAEliminar(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


