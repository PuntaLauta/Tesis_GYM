import { useState, useEffect } from 'react';
import { listRutinasInstructor, revisarEjercicio, actualizarNotasEjercicio } from '../services/rutinas';

export default function RutinasInstructor() {
  const [rutinas, setRutinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [ejercicioRevisar, setEjercicioRevisar] = useState(null);
  const [notasRevisar, setNotasRevisar] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [ejercicioEditarNotas, setEjercicioEditarNotas] = useState(null);
  const [notasEditar, setNotasEditar] = useState('');
  const [estadoEditar, setEstadoEditar] = useState(2); // 2 = APROBADO, 3 = RECHAZADO
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  
  // Estados para filtros
  const [ocultarInactivas, setOcultarInactivas] = useState(false);
  const [socioFiltro, setSocioFiltro] = useState('');
  const [socioFiltroTexto, setSocioFiltroTexto] = useState('');
  const [socioDropdownAbierto, setSocioDropdownAbierto] = useState(false);
  const [soloPendientes, setSoloPendientes] = useState(false);

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

  const handleEditarNotas = (ejercicio) => {
    setEjercicioEditarNotas(ejercicio);
    setNotasEditar(ejercicio.descripcion_profesor || '');
    // Establecer el estado actual del ejercicio
    let estadoId = ejercicio.estado_id;
    if (typeof estadoId === 'string') {
      estadoId = parseInt(estadoId, 10);
    }
    if (!estadoId || isNaN(estadoId)) {
      estadoId = 2; // Por defecto APROBADO
    }
    setEstadoEditar(estadoId);
  };

  const handleCerrarModalNotas = () => {
    setEjercicioEditarNotas(null);
    setNotasEditar('');
    setEstadoEditar(2);
  };

  const handleGuardarNotas = async () => {
    if (!ejercicioEditarNotas) return;
    
    setGuardandoNotas(true);
    try {
      // Convertir estado a string para la API
      const estadoString = estadoEditar === 2 ? 'aprobado' : 'rechazado';
      
      // Usar revisarEjercicio para actualizar tanto el estado como las notas
      await revisarEjercicio(ejercicioEditarNotas.id, estadoString, notasEditar);
      
      // Recargar rutinas para actualizar notas y estado
      await loadRutinas();
      // Actualizar la rutina seleccionada si existe
      if (rutinaSeleccionada) {
        const data = await listRutinasInstructor();
        const rutinaActualizada = data.data.find(r => r.id === rutinaSeleccionada.id);
        if (rutinaActualizada) {
          setRutinaSeleccionada(rutinaActualizada);
        }
      }
      handleCerrarModalNotas();
    } catch (err) {
      console.error('Error al actualizar revisión:', err);
      alert(err.response?.data?.error || 'Error al actualizar la revisión');
    } finally {
      setGuardandoNotas(false);
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

  // Obtener socios únicos que tienen rutinas activas
  const getSociosConRutinasActivas = () => {
    const sociosMap = new Map();
    rutinas.forEach(rutina => {
      if (rutina.activa === 1 || rutina.activa === true) {
        if (rutina.socio_id && rutina.socio_nombre) {
          if (!sociosMap.has(rutina.socio_id)) {
            sociosMap.set(rutina.socio_id, {
              id: rutina.socio_id,
              nombre: rutina.socio_nombre
            });
          }
        }
      }
    });
    return Array.from(sociosMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  };

  // Calcular ejercicios pendientes de una rutina
  const calcularEjerciciosPendientes = (ejercicios) => {
    if (!ejercicios || !Array.isArray(ejercicios)) return 0;
    let pendientes = 0;
    ejercicios.forEach(ejercicio => {
      const estadoId = typeof ejercicio.estado_id === 'string' 
        ? parseInt(ejercicio.estado_id, 10) 
        : ejercicio.estado_id;
      if (!estadoId || isNaN(estadoId) || estadoId === 1) {
        pendientes++;
      }
    });
    return pendientes;
  };

  // Filtrar rutinas según los filtros aplicados
  const filtrarRutinas = () => {
    return rutinas.filter(rutina => {
      // Filtro: Ocultar rutinas inactivas
      if (ocultarInactivas && (rutina.activa !== 1 && rutina.activa !== true)) {
        return false;
      }

      // Filtro: Por socio
      if (socioFiltro && rutina.socio_id !== parseInt(socioFiltro, 10)) {
        return false;
      }

      // Filtro: Solo rutinas con ejercicios pendientes
      if (soloPendientes) {
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
        const pendientes = calcularEjerciciosPendientes(ejerciciosCard);
        if (pendientes === 0) {
          return false;
        }
      }

      return true;
    });
  };

  const handleLimpiarFiltros = () => {
    setOcultarInactivas(false);
    setSocioFiltro('');
    setSocioFiltroTexto('');
    setSocioDropdownAbierto(false);
    setSoloPendientes(false);
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
            <p className="text-gray-600 mt-2">
              Generada por {rutinaSeleccionada.socio_nombre || 'N/A'} (ID: {rutinaSeleccionada.socio_id}) el día {formatFecha(rutinaSeleccionada.fecha_creacion)}
            </p>
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
                  }
                };

                const config = estadoConfig[estadoId] || estadoConfig[1];

                return (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative bg-white">
                    {/* Botón de estado - en desktop esquina superior derecha */}
                    <div className="absolute top-2 right-2 sm:block hidden">
                      <button
                        className={`${config.color} ${config.hoverColor} text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors shadow-md`}
                      >
                        <span>{config.texto}</span>
                        <span>{config.emoji}</span>
                      </button>
                    </div>

                    <h4 className="font-semibold mb-2 sm:pr-40 pr-0">{ejercicio.nombre || `Ejercicio ${index + 1}`}</h4>
                    
                    {/* Panel de estado para móvil - debajo del título */}
                    <div className="mb-3 sm:hidden">
                      <div className={`${config.color} text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium shadow-md w-fit`}>
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
                      {(estadoId === 2 || estadoId === 3) && ejercicio.instructor_nombre && (
                        <p className="text-gray-500 text-xs mt-1">
                          Revisado por {ejercicio.instructor_nombre}
                        </p>
                      )}
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

                    {/* Botón Editar revisión solo si está APROBADO o RECHAZADO */}
                    {(estadoId === 2 || estadoId === 3) && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleEditarNotas(ejercicio)}
                          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          Editar revisión
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

          {/* Sector de Filtros */}
          <div className="bg-white border rounded-lg p-3 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Filtros</h2>
              <button
                onClick={handleLimpiarFiltros}
                className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-xs"
              >
                Limpiar filtros
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Buscador con dropdown custom para socio - PRIMERO */}
              <div>
                <label htmlFor="filtro-socio" className="block text-xs font-medium text-gray-700 mb-1">
                  Filtrar por socio
                </label>
                <div className="relative">
                  <input
                    id="filtro-socio"
                    type="text"
                    placeholder="Todos los socios (escribí para buscar...)"
                    value={socioFiltroTexto}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSocioFiltroTexto(value);
                      setSocioDropdownAbierto(true);
                      if (value.trim() === '') {
                        setSocioFiltro('');
                      }
                    }}
                    onFocus={() => setSocioDropdownAbierto(true)}
                    onBlur={() => {
                      // Cerrar con pequeño delay para permitir click en opción
                      setTimeout(() => setSocioDropdownAbierto(false), 100);
                    }}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {socioDropdownAbierto && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSocioFiltro('');
                          setSocioFiltroTexto('');
                          setSocioDropdownAbierto(false);
                        }}
                      >
                        Todos los socios
                      </button>
                      {getSociosConRutinasActivas()
                        .filter((socio) => {
                          if (!socioFiltroTexto.trim()) return true;
                          const term = socioFiltroTexto.toLowerCase();
                          return (
                            socio.nombre.toLowerCase().includes(term) ||
                            String(socio.id).includes(term)
                          );
                        })
                        .map((socio) => (
                          <button
                            key={socio.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSocioFiltro(String(socio.id));
                              setSocioFiltroTexto(`${socio.id} - ${socio.nombre}`);
                              setSocioDropdownAbierto(false);
                            }}
                          >
                            {socio.id} - {socio.nombre}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox: Solo rutinas pendientes - SEGUNDO */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="solo-pendientes"
                  checked={soloPendientes}
                  onChange={(e) => setSoloPendientes(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="solo-pendientes" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Solo rutinas pendientes de revisión
                </label>
              </div>

              {/* Checkbox: Ocultar rutinas inactivas - ÚLTIMO */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ocultar-inactivas"
                  checked={ocultarInactivas}
                  onChange={(e) => setOcultarInactivas(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="ocultar-inactivas" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Ocultar rutinas inactivas
                </label>
              </div>
            </div>
          </div>

          {rutinas.length === 0 ? (
            <p className="text-gray-500">No hay rutinas disponibles.</p>
          ) : (
            <>
              {filtrarRutinas().length === 0 ? (
                <div className="bg-gray-50 border rounded-lg p-6 text-center">
                  <p className="text-gray-500">No hay rutinas que coincidan con los filtros seleccionados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtrarRutinas().map((rutina) => {
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

                // Calcular ejercicios pendientes
                const ejerciciosPendientes = calcularEjerciciosPendientes(ejerciciosCard);

                const tienePendientes = ejerciciosPendientes > 0;
                const todosCompletos = ejerciciosCard.length > 0 && ejerciciosPendientes === 0;

                const rutinaActiva = rutina.activa === 1 || rutina.activa === true;

                return (
                  <div
                    key={rutina.id}
                    className={`bg-white border rounded-lg p-4 shadow-sm transition-shadow ${
                      rutinaActiva
                        ? 'hover:shadow-md cursor-pointer'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (!rutinaActiva) return;
                      handleVerEjercicios(rutina);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 flex-1">
                        {rutina.nombre}
                      </h3>
                      {ejerciciosCard.length > 0 && (
                        <div className="ml-2 flex items-center gap-1">
                          {tienePendientes ? (
                            <>
                              <span className="text-xl">⚠️</span>
                              <span className="text-xs text-yellow-600 font-medium">
                                {ejerciciosPendientes} pendiente{ejerciciosPendientes !== 1 ? 's' : ''}
                              </span>
                            </>
                          ) : todosCompletos ? (
                            <>
                              <span className="text-xl">✅</span>
                              <span className="text-xs text-green-600 font-medium">
                                Revisiones completadas
                              </span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
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
                      <p>
                        <strong>Socio:</strong> {rutina.socio_nombre || 'N/A'} (ID: {rutina.socio_id})
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          rutinaActiva
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rutinaActiva ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                );
                  })}
                </div>
              )}
            </>
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

      {/* Modal para editar notas - siempre disponible */}
      {ejercicioEditarNotas && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCerrarModalNotas}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Editar Revisión</h2>
              <button
                onClick={handleCerrarModalNotas}
                disabled={guardandoNotas}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
            <p className="text-gray-700 mb-4">
              <strong>Ejercicio:</strong> {ejercicioEditarNotas.nombre}
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Estado
              </label>
              <select
                value={estadoEditar}
                onChange={(e) => setEstadoEditar(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={guardandoNotas}
              >
                <option value={2}>Aprobado</option>
                <option value={3}>Rechazado</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Notas del Instructor
              </label>
              <textarea
                value={notasEditar}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setNotasEditar(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="4"
                placeholder="Escribe las notas del instructor (máximo 500 caracteres)"
                maxLength={500}
                disabled={guardandoNotas}
              />
              <p className="text-xs text-gray-500 mt-1">
                {notasEditar.length}/500 caracteres
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGuardarNotas}
                disabled={guardandoNotas}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardandoNotas ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                onClick={handleCerrarModalNotas}
                disabled={guardandoNotas}
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

