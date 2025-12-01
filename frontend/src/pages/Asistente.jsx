import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendMessage, getConversaciones, deleteAllConversaciones } from '../services/asistente';
import { createRutina } from '../services/rutinas';
import ChatMessage from '../components/ChatMessage';

export default function Asistente() {
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [tipo, setTipo] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [rutinaDataActual, setRutinaDataActual] = useState(null);
  const [mostrarModalRutina, setMostrarModalRutina] = useState(false);
  const [guardandoRutina, setGuardandoRutina] = useState(false);
  const [rutinaForm, setRutinaForm] = useState({ nombre: '', descripcion: '' });
  const [mostrarModalLimpiar, setMostrarModalLimpiar] = useState(false);
  const [limpiandoChat, setLimpiandoChat] = useState(false);

  useEffect(() => {
    loadConversaciones();
  }, []);

  useEffect(() => {
    // Solo hacer scroll automático si no es la carga inicial y hay mensajes nuevos
    if (!isInitialLoad && mensajes.length > 0) {
      // Pequeño delay para asegurar que el DOM se actualizó
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [mensajes, isInitialLoad]);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const loadConversaciones = async () => {
    try {
      const data = await getConversaciones({ limit: 20 });
      const conversaciones = data.data || [];
      
      // Convertir conversaciones a formato de mensajes
      const mensajesFormateados = [];
      conversaciones.forEach((conv) => {
        mensajesFormateados.push({
          mensaje: conv.mensaje_usuario,
          esUsuario: true,
          fecha: conv.fecha,
          rutinaData: null,
        });
        mensajesFormateados.push({
          mensaje: conv.respuesta_asistente,
          esUsuario: false,
          fecha: conv.fecha,
          rutinaData: conv.rutinaData || null,
        });
      });
      
      setMensajes(mensajesFormateados);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
      setIsInitialLoad(false);
    }
  };

  const handleEnviar = async (mensajeTexto = null, tipoMensaje = null) => {
    const mensajeFinal = mensajeTexto || inputMensaje.trim();
    const tipoFinal = tipoMensaje || tipo;

    if (!mensajeFinal) return;

    // Agregar mensaje del usuario inmediatamente
    const nuevoMensajeUsuario = {
      mensaje: mensajeFinal,
      esUsuario: true,
      fecha: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setInputMensaje('');
    setLoading(true);
    setError('');

    try {
      const response = await sendMessage(mensajeFinal, tipoFinal);
      const respuesta = response.data;

      // Agregar respuesta del asistente
      const nuevoMensajeAsistente = {
        mensaje: respuesta.respuesta_asistente,
        esUsuario: false,
        fecha: respuesta.fecha,
        rutinaData: respuesta.rutinaData || null,
      };
      setMensajes((prev) => [...prev, nuevoMensajeAsistente]);
      
      // Si hay rutinaData, preparar el formulario
      if (respuesta.rutinaData) {
        setRutinaDataActual(respuesta.rutinaData);
        setRutinaForm({
          nombre: respuesta.rutinaData.nombre || '',
          descripcion: respuesta.rutinaData.descripcion || '',
        });
      }
      
      // Hacer scroll después de agregar la respuesta
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError(err.response?.data?.error || 'Error al enviar el mensaje');
      // Remover el mensaje del usuario si falló
      setMensajes((prev) => prev.filter((m, i) => i !== prev.length - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleEnviar();
  };

  const handleBotonRapido = (tipoBoton, mensaje) => {
    setTipo(tipoBoton);
    handleEnviar(mensaje, tipoBoton);
  };

  const handleGuardarRutina = async () => {
    if (!rutinaDataActual) return;

    setGuardandoRutina(true);
    try {
      const rutinaData = {
        nombre: rutinaForm.nombre || rutinaDataActual.nombre,
        descripcion: rutinaForm.descripcion || rutinaDataActual.descripcion,
        ejercicios: JSON.stringify(rutinaDataActual.ejercicios),
      };

      await createRutina(rutinaData);
      setMostrarModalRutina(false);
      setRutinaDataActual(null);
      alert('¡Rutina guardada exitosamente! Puedes verla en "Mis Rutinas".');
    } catch (err) {
      console.error('Error al guardar rutina:', err);
      alert(err.response?.data?.error || 'Error al guardar la rutina');
    } finally {
      setGuardandoRutina(false);
    }
  };

  const handleLimpiarChat = async () => {
    setLimpiandoChat(true);
    try {
      await deleteAllConversaciones();
      setMensajes([]);
      setMostrarModalLimpiar(false);
      setIsInitialLoad(true);
    } catch (err) {
      console.error('Error al limpiar chat:', err);
      alert(err.response?.data?.error || 'Error al limpiar el chat');
    } finally {
      setLimpiandoChat(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Asistente Virtual de Entrenamiento</h1>
        <Link
          to="/rutinas"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Mis Rutinas
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Botones rápidos */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => handleBotonRapido('rutina', 'Quiero crear una rutina para principiantes')}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          💪 Crear Rutina
        </button>
        <button
          onClick={() => handleBotonRapido('ejercicio', '¿Cómo hacer sentadillas?')}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          📚 Consultar Ejercicio
        </button>
        <button
          onClick={() => handleBotonRapido('asistencia', 'Necesito ayuda con mi entrenamiento')}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          🤝 Necesito Ayuda
        </button>
      </div>

      {/* Área de chat */}
      <div className="bg-[#b9b9b9] border border-gray-400 rounded-lg shadow-sm mb-4" style={{ height: '500px' }}>
        <div className="p-4 h-full overflow-y-auto text-gray-900" style={{ scrollBehavior: 'smooth' }}>
          {mensajes.length === 0 ? (
            <div className="text-center text-gray-700 mt-8">
              <p className="text-lg mb-2">¡Hola! 👋</p>
              <p>Soy tu asistente virtual de entrenamiento.</p>
              <p className="mt-2">Puedo ayudarte a crear rutinas, consultar ejercicios o resolver dudas.</p>
              <p className="mt-4 text-sm text-gray-600">Usa los botones de arriba o escribe tu pregunta directamente.</p>
            </div>
          ) : (
            mensajes.map((msg, index) => (
              <div key={index}>
                <ChatMessage
                  mensaje={msg.mensaje}
                  esUsuario={msg.esUsuario}
                  fecha={msg.fecha}
                />
                {!msg.esUsuario && msg.rutinaData && (
                  <div className="flex justify-start mb-4">
                    <button
                      onClick={() => {
                        setRutinaDataActual(msg.rutinaData);
                        setRutinaForm({
                          nombre: msg.rutinaData.nombre || '',
                          descripcion: msg.rutinaData.descripcion || '',
                        });
                        setMostrarModalRutina(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      💾 Guardar Rutina
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
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
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <input
          type="text"
          value={inputMensaje}
          onChange={(e) => setInputMensaje(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={loading}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !inputMensaje.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Enviar
        </button>
      </form>

      {/* Botón limpiar chat */}
      <div className="text-center">
        <button
          onClick={() => setMostrarModalLimpiar(true)}
          disabled={mensajes.length === 0 || loading}
          className="text-blue-600 hover:text-blue-800 underline text-sm disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
        >
          Limpiar chat
        </button>
      </div>

      {/* Modal para guardar rutina */}
      {mostrarModalRutina && rutinaDataActual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Guardar Rutina</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la rutina *
                </label>
                <input
                  type="text"
                  value={rutinaForm.nombre}
                  onChange={(e) => setRutinaForm({ ...rutinaForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={rutinaForm.descripcion}
                  onChange={(e) => setRutinaForm({ ...rutinaForm, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ejercicios ({rutinaDataActual.ejercicios?.length || 0})
                </label>
                <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {rutinaDataActual.ejercicios?.map((ejercicio, idx) => (
                    <div key={idx} className="mb-3 pb-3 border-b last:border-b-0">
                      <p className="font-semibold">{ejercicio.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {ejercicio.series} series x {ejercicio.repeticiones} repeticiones
                        {ejercicio.descanso && ` - Descanso: ${ejercicio.descanso}`}
                      </p>
                      {ejercicio.notas && (
                        <p className="text-xs text-gray-500 mt-1">{ejercicio.notas}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setMostrarModalRutina(false);
                  setRutinaDataActual(null);
                }}
                disabled={guardandoRutina}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarRutina}
                disabled={guardandoRutina || !rutinaForm.nombre.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {guardandoRutina ? 'Guardando...' : 'Guardar Rutina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para limpiar chat */}
      {mostrarModalLimpiar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">¿Limpiar chat?</h3>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que deseas eliminar todas las conversaciones? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setMostrarModalLimpiar(false)}
                disabled={limpiandoChat}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleLimpiarChat}
                disabled={limpiandoChat}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {limpiandoChat ? 'Limpiando...' : 'Limpiar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

