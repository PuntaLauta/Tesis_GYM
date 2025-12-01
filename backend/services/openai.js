/**
 * Servicio para integración con Claude (Anthropic) usando Anthropic SDK
 * Utiliza el modelo Claude Haiku 4.5
 */

const Anthropic = require('@anthropic-ai/sdk');

// Verificar que la API key esté configurada
const apiKey = process.env.ANTHROPIC_API_KEY || '';

if (!apiKey) {
  console.warn('⚠️  ADVERTENCIA: ANTHROPIC_API_KEY no está configurada en las variables de entorno');
}

const client = new Anthropic({
  apiKey: apiKey
});

/**
 * Envía un mensaje a Claude usando Anthropic SDK
 * @param {string} mensaje - Mensaje del usuario
 * @param {string} tipo - Tipo de consulta: 'rutina', 'ejercicio', 'asistencia', 'general'
 * @param {object} contexto - Contexto adicional del usuario (opcional)
 * @returns {Promise<{texto: string, rutinaData: object|null}>} Respuesta del asistente con texto y datos estructurados
 */
async function chatWithGPT(mensaje, tipo = 'general', contexto = {}) {
  try {
    // Verificar que la API key esté configurada antes de hacer la llamada
    if (!apiKey || apiKey.trim() === '') {
      console.error('Error: ANTHROPIC_API_KEY no está configurada');
      return {
        texto: 'Error de configuración: La API key de Claude no está configurada. Por favor, contacta al administrador.',
        rutinaData: null
      };
    }

    // Construir el prompt del sistema según el tipo de consulta
    let systemPrompt = "Eres un asistente virtual de entrenamiento para un gimnasio. Ayudas a los usuarios con rutinas de ejercicio, información sobre ejercicios y consejos de entrenamiento. Siempre responde en español.";
    
    if (tipo === 'rutina') {
      systemPrompt += " Cuando el usuario pide una rutina de entrenamiento, proporciona rutinas detalladas con ejercicios, series, repeticiones y períodos de descanso. Si es posible, estructura la respuesta de manera que pueda ser parseada en formato JSON con un array de ejercicios.";
    } else if (tipo === 'ejercicio') {
      systemPrompt += " Cuando te pregunten sobre ejercicios específicos, proporciona información detallada sobre técnica, músculos trabajados y consejos.";
    } else if (tipo === 'asistencia') {
      systemPrompt += " Proporciona consejos útiles de entrenamiento y apoyo. Si el usuario menciona dolor o lesión, recomienda consultar con un profesional médico.";
    }

    // Construir el mensaje del usuario con contexto si existe
    let userMessage = mensaje;
    if (contexto && Object.keys(contexto).length > 0) {
      userMessage += `\n\nContexto adicional: ${JSON.stringify(contexto)}`;
    }

    // Llamar a la API de Claude
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    const respuestaTexto = message.content[0].text;

    // Intentar extraer rutinaData si el tipo es 'rutina' y la respuesta contiene información estructurada
    let rutinaData = null;
    if (tipo === 'rutina' && respuestaTexto) {
      rutinaData = intentarExtraerRutinaData(respuestaTexto);
    }

    return {
      texto: respuestaTexto,
      rutinaData: rutinaData
    };
  } catch (error) {
    console.error('Error al llamar a Claude:', error);
    console.error('Error details:', {
      status: error.status,
      statusCode: error.statusCode,
      message: error.message,
      type: error.constructor.name,
      error: error.error ? JSON.stringify(error.error) : 'N/A'
    });
    
    // Manejar errores específicos de Anthropic
    const errorStatus = error.status || error.statusCode;
    const errorMessage = (error.message || '').toLowerCase();
    
    // Error 429: Rate limit
    if (errorStatus === 429) {
      return {
        texto: 'Lo siento, se ha excedido el límite de solicitudes. Por favor, intenta nuevamente en unos momentos.',
        rutinaData: null
      };
    }
    
    // Error 401/403: Authentication
    if (errorStatus === 401 || errorStatus === 403) {
      if (errorMessage.includes('api key') || errorMessage.includes('authentication') || errorMessage.includes('invalid') || errorMessage.includes('unauthorized')) {
        return {
          texto: 'Error de autenticación con Claude: La API key no es válida o ha expirado. Por favor, contacta al administrador para verificar la configuración.',
          rutinaData: null
        };
      }
      return {
        texto: 'Error de autenticación con Claude. Por favor, contacta al administrador.',
        rutinaData: null
      };
    }

    // Verificar si el error menciona API key o autenticación en el mensaje
    if (errorMessage.includes('api key') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid api key')) {
      return {
        texto: 'Error de autenticación con Claude: La API key no está configurada correctamente o no es válida. Por favor, contacta al administrador.',
        rutinaData: null
      };
    }
    
    // En caso de otros errores, retornar un mensaje de error amigable
    return {
      texto: `Lo siento, hubo un error al procesar tu solicitud. ${error.message || 'Por favor, intenta nuevamente en unos momentos.'}`,
      rutinaData: null
    };
  }
}

/**
 * Intenta extraer datos estructurados de rutina de la respuesta del asistente
 * @param {string} texto - Texto de la respuesta
 * @returns {object|null} Datos de rutina estructurados o null
 */
function intentarExtraerRutinaData(texto) {
  try {
    // Buscar patrones comunes en la respuesta para extraer información de rutina
    const ejercicios = [];
    const lineas = texto.split('\n');
    
    let nombreRutina = null;
    let descripcionRutina = null;

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      
      // Buscar nombre de rutina (líneas con ** o títulos)
      if (linea.includes('**') && !nombreRutina) {
        const match = linea.match(/\*\*(.+?)\*\*/);
        if (match && match[1] && match[1].length < 100) {
          nombreRutina = match[1].trim();
        }
      }

      // Buscar ejercicios (líneas que contienen guiones y números)
      if (linea.startsWith('-') || linea.match(/^\d+\./)) {
        const ejercicioMatch = linea.match(/(?:[-•]\s*|^\d+\.\s*)(.+?)(?:\s*:\s*|\s*-\s*|\s*$)/);
        if (ejercicioMatch) {
          const nombreEjercicio = ejercicioMatch[1].trim();
          
          // Buscar series y repeticiones en la misma línea o siguiente
          const seriesMatch = linea.match(/(\d+)\s*(?:series|series?)\s*x\s*(\d+(?:-\d+)?)/i);
          const repeticionesMatch = linea.match(/(\d+(?:-\d+)?)\s*(?:repeticiones?|reps?)/i);
          
          if (seriesMatch || repeticionesMatch) {
            ejercicios.push({
              nombre: nombreEjercicio,
              series: seriesMatch ? parseInt(seriesMatch[1]) : 3,
              repeticiones: seriesMatch ? seriesMatch[2] : (repeticionesMatch ? repeticionesMatch[1] : '10-12'),
              descanso: '1 min',
              notas: ''
            });
          } else if (nombreEjercicio.length > 0) {
            ejercicios.push({
              nombre: nombreEjercicio,
              series: 3,
              repeticiones: '10-12',
              descanso: '1 min',
              notas: ''
            });
          }
        }
      }
    }

    // Si encontramos ejercicios, crear el objeto rutinaData
    if (ejercicios.length > 0) {
      return {
        nombre: nombreRutina || 'Rutina Personalizada',
        descripcion: descripcionRutina || 'Rutina generada por el asistente',
        ejercicios: ejercicios,
        fecha_inicio: new Date().toISOString().split('T')[0]
      };
    }

    return null;
  } catch (error) {
    console.error('Error al extraer rutinaData:', error);
    return null;
  }
}

module.exports = {
  chatWithGPT,
};
