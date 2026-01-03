import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRutina, toggleActiva } from '../services/rutinas';
import { sendMessage } from '../services/asistente';
import ChatMessage from '../components/ChatMessage';

export default function DetalleRutina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rutina, setRutina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [errorChat, setErrorChat] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const chatEndRef = useRef(null);

  // Clave para localStorage basada en el ID de la rutina
  const getChatStorageKey = (rutinaId) => `chat_rutina_${rutinaId}`;

  // Cargar mensajes desde localStorage
  const loadMensajesFromStorage = (rutinaId) => {
    try {
      const stored = localStorage.getItem(getChatStorageKey(rutinaId));
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error al cargar mensajes desde localStorage:', e);
    }
    return [];
  };

  // Guardar mensajes en localStorage
  const saveMensajesToStorage = (rutinaId, mensajes) => {
    try {
      localStorage.setItem(getChatStorageKey(rutinaId), JSON.stringify(mensajes));
    } catch (e) {
      console.error('Error al guardar mensajes en localStorage:', e);
    }
  };

  useEffect(() => {
    loadRutina();
  }, [id]);

  // Cargar mensajes cuando se carga la rutina o cambia el ID
  useEffect(() => {
    if (id) {
      const mensajesGuardados = loadMensajesFromStorage(id);
      setMensajes(mensajesGuardados);
    }
  }, [id]);

  const loadRutina = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRutina(id);
      setRutina(data.data);
    } catch (err) {
      console.error('Error al cargar rutina:', err);
      setError(err.response?.data?.error || 'Error al cargar los detalles de la rutina');
    } finally {
      setLoading(false);
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

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      // Guardar mensajes en localStorage cada vez que cambien
      if (id) {
        saveMensajesToStorage(id, mensajes);
      }
    }
  }, [mensajes, id]);

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    const mensajeTexto = inputMensaje.trim();
    if (!mensajeTexto || !rutina) return;

    // Agregar mensaje del usuario inmediatamente
    const nuevoMensajeUsuario = {
      mensaje: mensajeTexto,
      esUsuario: true,
      fecha: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setInputMensaje('');
    setLoadingChat(true);
    setErrorChat('');

    try {
      // Parsear ejercicios de la rutina
      let ejercicios = [];
      try {
        ejercicios = typeof rutina.ejercicios === 'string' 
          ? JSON.parse(rutina.ejercicios) 
          : rutina.ejercicios || [];
      } catch (e) {
        ejercicios = [];
      }

      // Preparar contexto con información de la rutina
      const contexto = {
        rutina: {
          nombre: rutina.nombre,
          descripcion: rutina.descripcion || '',
          ejercicios: ejercicios
        }
      };

      // Enviar mensaje al asistente
      const response = await sendMessage(mensajeTexto, 'ejercicio', contexto);
      const respuesta = response.data;

      // Agregar respuesta del asistente
      const nuevoMensajeAsistente = {
        mensaje: respuesta.respuesta_asistente,
        esUsuario: false,
        fecha: respuesta.fecha || new Date().toISOString(),
      };
      setMensajes((prev) => [...prev, nuevoMensajeAsistente]);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setErrorChat(err.response?.data?.error || 'Error al enviar el mensaje');
      // Remover el mensaje del usuario si falló
      setMensajes((prev) => prev.filter((m, i) => i !== prev.length - 1));
    } finally {
      setLoadingChat(false);
    }
  };

  const handleEliminarRutina = async () => {
    if (!rutina) return;
    
    if (!confirm(`¿Estás seguro de que deseas eliminar la rutina "${rutina.nombre}"? Esta acción la marcará como inactiva y ya no aparecerá en tu listado de rutinas.`)) {
      return;
    }

    setEliminando(true);
    try {
      await toggleActiva(rutina.id, false);
      // Limpiar mensajes del chat de esta rutina del localStorage
      localStorage.removeItem(getChatStorageKey(rutina.id));
      // Redirigir a la lista de rutinas
      navigate('/asistente');
    } catch (err) {
      console.error('Error al eliminar rutina:', err);
      alert(err.response?.data?.error || 'Error al eliminar la rutina');
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8 text-gray-500">Cargando detalles de la rutina...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/asistente')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Volver a Rutinas
        </button>
      </div>
    );
  }

  if (!rutina) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Rutina no encontrada</p>
          <button
            onClick={() => navigate('/asistente')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Volver a Rutinas
          </button>
        </div>
      </div>
    );
  }

  // Parsear ejercicios
  // El backend puede devolver ejercicios como array (desde rutina_ejercicio) o como JSON string
  let ejercicios = [];
  try {
    // El backend devuelve los ejercicios en rutina.ejercicios como array cuando hay registros en rutina_ejercicio
    if (Array.isArray(rutina.ejercicios)) {
      // Si ya es un array, usarlo directamente (viene desde rutina_ejercicio)
      ejercicios = rutina.ejercicios;
    } else if (typeof rutina.ejercicios === 'string') {
      // Si es string, parsearlo (fallback para rutinas antiguas)
      ejercicios = JSON.parse(rutina.ejercicios);
    } else {
      ejercicios = [];
    }
  } catch (e) {
    console.error('Error al parsear ejercicios:', e);
    ejercicios = [];
  }
  

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Botón volver */}
      <button
        onClick={() => navigate('/asistente')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        <span>←</span>
        <span>Volver a Rutinas</span>
      </button>

      {/* Header de la rutina */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{rutina.nombre}</h1>
            {rutina.descripcion && (
              <p className="text-gray-600 text-lg">{rutina.descripcion}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                rutina.activa === 1 || rutina.activa === true
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {rutina.activa === 1 || rutina.activa === true ? 'Activa' : 'Inactiva'}
            </span>
            <button
              onClick={handleEliminarRutina}
              disabled={eliminando}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <strong>Fecha de creación:</strong>
            <p>{formatFecha(rutina.fecha_creacion)}</p>
          </div>
          {rutina.fecha_inicio && (
            <div>
              <strong>Fecha de inicio:</strong>
              <p>{formatFecha(rutina.fecha_inicio)}</p>
            </div>
          )}
          {rutina.fecha_fin && (
            <div>
              <strong>Fecha de fin:</strong>
              <p>{formatFecha(rutina.fecha_fin)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Chat */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Consulta sobre tu Rutina</h2>
        
        {errorChat && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorChat}
          </div>
        )}

        {/* Área de chat */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-sm mb-4" style={{ height: '400px' }}>
          <div className="p-4 h-full overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
            {mensajes.length === 0 ? (
              <div className="text-center text-gray-600 mt-8">
                <p className="text-lg mb-2">💬 Haz una pregunta sobre tu rutina</p>
                <p className="text-sm">Puedes preguntar sobre técnica, modificaciones, músculos trabajados, etc.</p>
              </div>
            ) : (
              mensajes.map((msg, index) => (
                <ChatMessage
                  key={index}
                  mensaje={msg.mensaje}
                  esUsuario={msg.esUsuario}
                  fecha={msg.fecha}
                />
              ))
            )}
            {loadingChat && (
              <div className="flex justify-start mb-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input de mensaje */}
        <form onSubmit={handleEnviarMensaje} className="flex gap-2">
          <input
            type="text"
            value={inputMensaje}
            onChange={(e) => setInputMensaje(e.target.value)}
            placeholder="Escribe tu pregunta sobre la rutina..."
            disabled={loadingChat}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loadingChat || !inputMensaje.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>
      </div>

      {/* Lista de ejercicios */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Ejercicios</h2>
        
        {ejercicios.length === 0 ? (
          <p className="text-gray-500">No hay ejercicios definidos en esta rutina.</p>
        ) : (
          <div className="space-y-4">
            {ejercicios.map((ejercicio, index) => {
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
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative">
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
                    <div className="absolute right-0 top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                        {config.texto}
                        <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start justify-between mb-3 pr-10">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {index + 1}. {ejercicio.nombre || `Ejercicio ${index + 1}`}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {ejercicio.series && (
                    <div className="bg-blue-50 p-3 rounded">
                      <strong className="text-blue-800 block mb-1">Series</strong>
                      <span className="text-gray-700">{ejercicio.series}</span>
                    </div>
                  )}
                  
                  {ejercicio.repeticiones && (
                    <div className="bg-green-50 p-3 rounded">
                      <strong className="text-green-800 block mb-1">Repeticiones</strong>
                      <span className="text-gray-700">{ejercicio.repeticiones}</span>
                    </div>
                  )}
                  
                  {ejercicio.descanso && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <strong className="text-yellow-800 block mb-1">Descanso</strong>
                      <span className="text-gray-700">{ejercicio.descanso}</span>
                    </div>
                  )}
                </div>

                {/* Notas del Asistente IA */}
                {ejercicio.notas && ejercicio.notas.trim() && (
                  <div className="mt-3 pt-3 border-t">
                    <strong className="text-gray-700 block mb-1">Notas del Asistente IA:</strong>
                    <p className="text-gray-600 text-sm">{ejercicio.notas}</p>
                  </div>
                )}
                
                {/* Notas del Instructor */}
                <div className="mt-3 pt-3 border-t">
                  <strong className="text-gray-700 block mb-1">Notas del Instructor:</strong>
                  <p className="text-gray-600 text-sm italic">
                    {ejercicio.notas_instructor && ejercicio.notas_instructor.trim() 
                      ? ejercicio.notas_instructor 
                      : 'Sin notas del instructor'}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

