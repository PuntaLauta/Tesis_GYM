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
    
    // Si el contexto incluye información de rutina, agregarla al system prompt
    if (contexto && contexto.rutina) {
      const rutina = contexto.rutina;
      systemPrompt += `\n\nEl usuario está consultando sobre su rutina específica:\n`;
      systemPrompt += `Nombre de la rutina: ${rutina.nombre || 'No especificado'}\n`;
      if (rutina.descripcion) {
        systemPrompt += `Descripción: ${rutina.descripcion}\n`;
      }
      
      if (rutina.ejercicios && Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0) {
        systemPrompt += `\nEjercicios de la rutina:\n`;
        rutina.ejercicios.forEach((ejercicio, index) => {
          systemPrompt += `${index + 1}. ${ejercicio.nombre || 'Ejercicio sin nombre'}\n`;
          if (ejercicio.series) systemPrompt += `   - Series: ${ejercicio.series}\n`;
          if (ejercicio.repeticiones) systemPrompt += `   - Repeticiones: ${ejercicio.repeticiones}\n`;
          if (ejercicio.descanso) systemPrompt += `   - Descanso: ${ejercicio.descanso}\n`;
          if (ejercicio.notas && ejercicio.notas.trim()) systemPrompt += `   - Notas: ${ejercicio.notas}\n`;
        });
      }
      
      systemPrompt += `\nPuedes responder preguntas sobre:\n`;
      systemPrompt += `- Técnica de ejecución de los ejercicios específicos de esta rutina\n`;
      systemPrompt += `- Modificaciones o alternativas para los ejercicios\n`;
      systemPrompt += `- Orden y progresión de los ejercicios\n`;
      systemPrompt += `- Tiempos de descanso recomendados\n`;
      systemPrompt += `- Músculos trabajados por cada ejercicio\n`;
      systemPrompt += `- Cualquier duda específica sobre esta rutina\n`;
      systemPrompt += `Responde siempre basándote en la información específica de esta rutina que se te ha proporcionado.`;
    } else if (tipo === 'rutina') {
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

/**
 * Genera una rutina personalizada usando Claude basada en datos del formulario
 * @param {string} tipoRutina - Nombre del tipo de rutina (ej: "Fuerza", "Hipertrofia")
 * @param {string} sexo - Sexo del usuario ("hombre" o "mujer")
 * @param {number} edad - Edad del usuario
 * @param {number} peso - Peso del usuario en kg
 * @param {string} notasMedicas - Notas médicas o limitaciones (opcional)
 * @returns {Promise<object>} Objeto con nombre, descripcion y ejercicios en formato JSON
 */
async function generarRutinaPersonalizada(tipoRutina, sexo, edad, peso, notasMedicas = '') {
  try {
    // Verificar que la API key esté configurada
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('ANTHROPIC_API_KEY no está configurada');
    }

    // System prompt estructurado
    const systemPrompt = `Eres un asistente experto en entrenamiento físico y diseño de rutinas personalizadas.

Tu tarea es generar una rutina completamente adaptada al usuario utilizando la información recibida desde un formulario.

La información será proporcionada a través de los siguientes datos:
- tipo_rutina: El tipo de rutina solicitada
- sexo: El sexo del usuario (hombre o mujer)
- edad: La edad del usuario
- peso: El peso del usuario en kilogramos
- notas_medicas: Limitaciones físicas o condiciones médicas (si las hay)

Debes usar estos datos para crear una rutina adecuada al perfil del usuario, considerando nivel físico esperado, riesgos potenciales, y limitaciones mencionadas.

IMPORTANTE: Tu respuesta DEBE ser ÚNICAMENTE un JSON válido, sin texto adicional antes o después. No incluyas explicaciones, comentarios ni texto fuera del JSON.

El JSON debe seguir estrictamente esta estructura:
{
  "nombre": "string (nombre descriptivo de la rutina)",
  "descripcion": "string (descripción breve de la rutina y objetivos)",
  "ejercicios": [
    {
      "nombre": "string (nombre del ejercicio)",
      "series": number (número de series, ej: 3),
      "repeticiones": "string (rango o número, ej: '8-12' o '10')",
      "descanso": "string (tiempo de descanso, ej: '1-2 min')",
      "notas": "string (notas adicionales sobre técnica o precauciones, puede estar vacío)"
    }
  ]
}

Asegúrate de que:
- El array de ejercicios tenga entre 4 y 8 ejercicios
- Los ejercicios sean apropiados para el tipo de rutina, edad, sexo y peso del usuario
- Si hay notas médicas, adaptes los ejercicios para evitar agravar condiciones existentes
- Las series y repeticiones sean apropiadas para el nivel del usuario
- El nombre de la rutina sea descriptivo y específico`;

    // Construir el mensaje del usuario
    let userMessage = `Genera una rutina para ${tipoRutina}. Soy ${sexo}, tengo ${edad} años, peso ${peso} kg`;
    if (notasMedicas && notasMedicas.trim()) {
      userMessage += `, y tengo las siguientes limitaciones: ${notasMedicas.trim()}`;
    }
    userMessage += '.';

    // Llamar a la API de Claude
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    const respuestaTexto = message.content[0].text.trim();

    // Intentar extraer JSON de la respuesta
    let rutinaData = null;
    try {
      // Intentar parsear directamente
      rutinaData = JSON.parse(respuestaTexto);
    } catch (parseError) {
      // Si falla, intentar extraer JSON del texto (puede haber texto antes/después)
      const jsonMatch = respuestaTexto.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rutinaData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo extraer JSON válido de la respuesta');
      }
    }

    // Validar estructura del JSON
    if (!rutinaData.nombre || !rutinaData.descripcion || !Array.isArray(rutinaData.ejercicios)) {
      throw new Error('El JSON generado no tiene la estructura correcta');
    }

    // Validar que cada ejercicio tenga los campos requeridos
    for (const ejercicio of rutinaData.ejercicios) {
      if (!ejercicio.nombre || ejercicio.series === undefined || !ejercicio.repeticiones) {
        throw new Error('Algunos ejercicios no tienen todos los campos requeridos');
      }
    }

    return rutinaData;
  } catch (error) {
    console.error('Error al generar rutina personalizada:', error);
    
    // Manejar errores específicos
    if (error.message.includes('ANTHROPIC_API_KEY')) {
      throw new Error('Error de configuración: La API key de Claude no está configurada');
    }
    
    if (error.message.includes('JSON')) {
      throw new Error('Error al procesar la respuesta de Claude: formato JSON inválido');
    }

    // Re-lanzar otros errores
    throw error;
  }
}

module.exports = {
  chatWithGPT,
  generarRutinaPersonalizada,
};
