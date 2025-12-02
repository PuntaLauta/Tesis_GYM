import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendMessage, getConversaciones } from '../services/asistente';
import ChatMessage from './ChatMessage';

export default function Chatbox({ socioEstado = 'activo' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();
  
  const isSocioActivo = socioEstado === 'activo';

  useEffect(() => {
    if (isOpen) {
      loadConversaciones();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isInitialLoad && mensajes.length > 0 && isOpen) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [mensajes, isInitialLoad, isOpen]);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const loadConversaciones = async () => {
    try {
      const data = await getConversaciones({ limit: 10 });
      const conversaciones = data.data || [];
      
      // Convertir conversaciones a formato de mensajes
      const mensajesFormateados = [];
      conversaciones.forEach((conv) => {
        mensajesFormateados.push({
          mensaje: conv.mensaje_usuario,
          esUsuario: true,
          fecha: conv.fecha,
        });
        mensajesFormateados.push({
          mensaje: conv.respuesta_asistente,
          esUsuario: false,
          fecha: conv.fecha,
        });
      });
      
      setMensajes(mensajesFormateados);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
      setIsInitialLoad(false);
    }
  };

  const handleEnviar = async () => {
    const mensajeFinal = inputMensaje.trim();
    if (!mensajeFinal) return;

    // Verificar que el socio esté activo antes de enviar
    if (!isSocioActivo) {
      setError('Tu cuenta debe estar activa para usar el asistente. Contacta a recepción para reactivar tu membresía.');
      return;
    }

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
      const response = await sendMessage(mensajeFinal, 'general');
      const respuesta = response.data;

      // Agregar respuesta del asistente
      const nuevoMensajeAsistente = {
        mensaje: respuesta.respuesta_asistente,
        esUsuario: false,
        fecha: respuesta.fecha,
      };
      setMensajes((prev) => [...prev, nuevoMensajeAsistente]);
      setIsInitialLoad(false);
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

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors z-50"
          aria-label="Abrir chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chatbox expandido */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white border rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Asistente Virtual</h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/asistente')}
                className="text-xs px-2 py-1 bg-blue-700 rounded hover:bg-blue-800 transition-colors"
              >
                Ver más
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Cerrar chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Área de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {!isSocioActivo ? (
              <div className="text-center text-gray-600 mt-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-700 font-semibold mb-2">Asistente Desactivado</p>
                  <p className="text-sm text-red-600 mb-1">Tu cuenta está inactiva.</p>
                  <p className="text-xs text-red-500">Contacta a recepción para reactivar tu membresía y acceder al asistente virtual.</p>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                    {error}
                  </div>
                )}
                {mensajes.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p className="text-sm mb-2">¡Hola! 👋</p>
                    <p className="text-xs">Escribe tu mensaje para comenzar.</p>
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
                {loading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-200 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMensaje}
                onChange={(e) => setInputMensaje(e.target.value)}
                placeholder={!isSocioActivo ? "Cuenta inactiva" : "Escribe tu mensaje..."}
                disabled={loading || !isSocioActivo}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              <button
                type="submit"
                disabled={loading || !inputMensaje.trim() || !isSocioActivo}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

