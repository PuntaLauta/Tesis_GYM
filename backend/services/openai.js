/**
 * Servicio mock para integración con ChatGPT API
 * Actualmente retorna respuestas simuladas para desarrollo
 * TODO: Reemplazar con llamada real a OpenAI API cuando se implemente
 */

/**
 * Simula una llamada a ChatGPT API
 * @param {string} mensaje - Mensaje del usuario
 * @param {string} tipo - Tipo de consulta: 'rutina', 'ejercicio', 'asistencia', 'general'
 * @param {object} contexto - Contexto adicional del usuario (opcional)
 * @returns {Promise<{texto: string, rutinaData: object|null}>} Respuesta del asistente con texto y datos estructurados
 */
async function chatWithGPT(mensaje, tipo = 'general', contexto = {}) {
  // Simular delay de red (1-2 segundos)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  // Retornar respuestas simuladas según el tipo
  switch (tipo) {
    case 'rutina':
      return generarRespuestaRutina(mensaje, contexto);
    
    case 'ejercicio':
      return generarRespuestaEjercicio(mensaje);
    
    case 'asistencia':
      return generarRespuestaAsistencia(mensaje);
    
    default:
      return generarRespuestaGeneral(mensaje);
  }
}

/**
 * Genera una respuesta simulada para consultas de rutinas
 * @returns {{texto: string, rutinaData: object|null}}
 */
function generarRespuestaRutina(mensaje, contexto) {
  const mensajeLower = mensaje.toLowerCase();
  
  if (mensajeLower.includes('principiante') || mensajeLower.includes('empezar')) {
    const texto = `¡Perfecto! Te voy a crear una rutina para principiantes. Aquí tienes una rutina de 3 días por semana:

**Rutina para Principiantes (3 días/semana)**

**Día 1 - Tren Superior:**
- Press de banca: 3 series x 8-10 repeticiones
- Remo con barra: 3 series x 8-10 repeticiones
- Press de hombros: 3 series x 10-12 repeticiones
- Curl de bíceps: 3 series x 10-12 repeticiones
- Tríceps en polea: 3 series x 10-12 repeticiones

**Día 2 - Tren Inferior:**
- Sentadillas: 3 series x 8-10 repeticiones
- Peso muerto: 3 series x 8-10 repeticiones
- Prensa de piernas: 3 series x 10-12 repeticiones
- Extensiones de cuádriceps: 3 series x 12-15 repeticiones
- Curl de piernas: 3 series x 12-15 repeticiones

**Día 3 - Full Body:**
- Sentadillas: 3 series x 10 repeticiones
- Press de banca: 3 series x 10 repeticiones
- Remo: 3 series x 10 repeticiones
- Press de hombros: 3 series x 10 repeticiones
- Plancha: 3 series x 30-45 segundos

Descansa 1 minuto entre series. ¿Te gustaría guardar esta rutina?`;

    const rutinaData = {
      nombre: "Rutina para Principiantes",
      descripcion: "Rutina de 3 días por semana para nivel principiante",
      ejercicios: [
        { nombre: "Press de banca", series: 3, repeticiones: "8-10", descanso: "1 min", notas: "Día 1" },
        { nombre: "Remo con barra", series: 3, repeticiones: "8-10", descanso: "1 min", notas: "Día 1" },
        { nombre: "Press de hombros", series: 3, repeticiones: "10-12", descanso: "1 min", notas: "Día 1" },
        { nombre: "Curl de bíceps", series: 3, repeticiones: "10-12", descanso: "1 min", notas: "Día 1" },
        { nombre: "Tríceps en polea", series: 3, repeticiones: "10-12", descanso: "1 min", notas: "Día 1" },
        { nombre: "Sentadillas", series: 3, repeticiones: "8-10", descanso: "1 min", notas: "Día 2" },
        { nombre: "Peso muerto", series: 3, repeticiones: "8-10", descanso: "1 min", notas: "Día 2" },
        { nombre: "Prensa de piernas", series: 3, repeticiones: "10-12", descanso: "1 min", notas: "Día 2" },
        { nombre: "Extensiones de cuádriceps", series: 3, repeticiones: "12-15", descanso: "1 min", notas: "Día 2" },
        { nombre: "Curl de piernas", series: 3, repeticiones: "12-15", descanso: "1 min", notas: "Día 2" },
        { nombre: "Plancha", series: 3, repeticiones: "30-45 segundos", descanso: "1 min", notas: "Día 3" },
      ],
      fecha_inicio: new Date().toISOString().split('T')[0],
    };

    return { texto, rutinaData };
  }
  
  if (mensajeLower.includes('intermedio') || mensajeLower.includes('avanzado')) {
    const texto = `Te voy a crear una rutina para nivel intermedio/avanzado. Aquí tienes una rutina de 4 días (Push/Pull):

**Rutina Push/Pull (4 días/semana)**

**Día 1 - Push (Empuje):**
- Press de banca: 4 series x 6-8 repeticiones
- Press inclinado con mancuernas: 3 series x 8-10 repeticiones
- Press de hombros: 4 series x 8-10 repeticiones
- Elevaciones laterales: 3 series x 12-15 repeticiones
- Tríceps en polea: 3 series x 10-12 repeticiones
- Fondos: 3 series x fallo

**Día 2 - Pull (Tirón):**
- Peso muerto: 4 series x 5-6 repeticiones
- Remo con barra: 4 series x 8-10 repeticiones
- Dominadas: 3 series x 8-10 repeticiones
- Remo con mancuernas: 3 series x 10-12 repeticiones
- Curl de bíceps: 3 series x 10-12 repeticiones
- Martillo: 3 series x 12-15 repeticiones

**Día 3 - Push:**
- Press de banca inclinado: 4 series x 6-8 repeticiones
- Press de hombros: 4 series x 8-10 repeticiones
- Aperturas: 3 series x 12-15 repeticiones
- Extensiones de tríceps: 3 series x 10-12 repeticiones

**Día 4 - Pull:**
- Remo T: 4 series x 8-10 repeticiones
- Jalones al pecho: 4 series x 10-12 repeticiones
- Remo con cable: 3 series x 10-12 repeticiones
- Curl con barra: 3 series x 10-12 repeticiones

Descansa 90 segundos entre series. ¿Quieres guardar esta rutina?`;

    const rutinaData = {
      nombre: "Rutina Push/Pull Intermedio",
      descripcion: "Rutina de 4 días por semana para nivel intermedio/avanzado",
      ejercicios: [
        { nombre: "Press de banca", series: 4, repeticiones: "6-8", descanso: "90 seg", notas: "Día 1 - Push" },
        { nombre: "Press inclinado con mancuernas", series: 3, repeticiones: "8-10", descanso: "90 seg", notas: "Día 1 - Push" },
        { nombre: "Press de hombros", series: 4, repeticiones: "8-10", descanso: "90 seg", notas: "Día 1 - Push" },
        { nombre: "Elevaciones laterales", series: 3, repeticiones: "12-15", descanso: "90 seg", notas: "Día 1 - Push" },
        { nombre: "Tríceps en polea", series: 3, repeticiones: "10-12", descanso: "90 seg", notas: "Día 1 - Push" },
        { nombre: "Fondos", series: 3, repeticiones: "Fallo", descanso: "90 seg", notas: "Día 1 - Push" },
        { nombre: "Peso muerto", series: 4, repeticiones: "5-6", descanso: "90 seg", notas: "Día 2 - Pull" },
        { nombre: "Remo con barra", series: 4, repeticiones: "8-10", descanso: "90 seg", notas: "Día 2 - Pull" },
        { nombre: "Dominadas", series: 3, repeticiones: "8-10", descanso: "90 seg", notas: "Día 2 - Pull" },
        { nombre: "Remo con mancuernas", series: 3, repeticiones: "10-12", descanso: "90 seg", notas: "Día 2 - Pull" },
        { nombre: "Curl de bíceps", series: 3, repeticiones: "10-12", descanso: "90 seg", notas: "Día 2 - Pull" },
        { nombre: "Martillo", series: 3, repeticiones: "12-15", descanso: "90 seg", notas: "Día 2 - Pull" },
      ],
      fecha_inicio: new Date().toISOString().split('T')[0],
    };

    return { texto, rutinaData };
  }
  
  const texto = `Entiendo que quieres una rutina personalizada. Para ayudarte mejor, necesito saber:
- ¿Cuál es tu nivel de experiencia? (principiante, intermedio, avanzado)
- ¿Cuántos días a la semana puedes entrenar?
- ¿Qué objetivos tienes? (ganar masa muscular, perder peso, tonificar, etc.)
- ¿Tienes alguna lesión o limitación física?

Con esta información podré crear una rutina perfecta para ti.`;

  return { texto, rutinaData: null };
}

/**
 * Genera una respuesta simulada para consultas de ejercicios
 * @returns {{texto: string, rutinaData: null}}
 */
function generarRespuestaEjercicio(mensaje) {
  const mensajeLower = mensaje.toLowerCase();
  
  if (mensajeLower.includes('sentadilla')) {
    const texto = `**Sentadillas (Squats)**

**Músculos trabajados:**
- Cuádriceps (principal)
- Glúteos
- Isquiotibiales
- Core

**Técnica:**
1. Párate con los pies separados al ancho de los hombros
2. Mantén la espalda recta y el pecho erguido
3. Baja flexionando las rodillas y las caderas, como si te sentaras en una silla
4. Baja hasta que tus muslos estén paralelos al suelo (o más abajo si puedes)
5. Empuja con los talones para volver a la posición inicial

**Consejos:**
- No dejes que las rodillas se vayan hacia adentro
- Mantén el peso en los talones
- Respira al bajar, exhala al subir
- Para principiantes: 3 series x 10-15 repeticiones

¿Quieres guardar este ejercicio en tus favoritos?`;
    return { texto, rutinaData: null };
  }
  
  if (mensajeLower.includes('press') || mensajeLower.includes('banca')) {
    const texto = `**Press de Banca (Bench Press)**

**Músculos trabajados:**
- Pectorales (principal)
- Deltoides anteriores
- Tríceps

**Técnica:**
1. Acuéstate en el banco con los pies firmes en el suelo
2. Agarra la barra con las manos ligeramente más anchas que los hombros
3. Baja la barra controladamente hasta tocar el pecho
4. Empuja la barra hacia arriba hasta extender los brazos
5. Mantén los hombros y glúteos en contacto con el banco

**Consejos:**
- No rebotes la barra en el pecho
- Mantén los codos a 45 grados del cuerpo
- Respira al bajar, exhala al empujar
- Para principiantes: 3 series x 8-10 repeticiones

¿Quieres guardar este ejercicio en tus favoritos?`;
    return { texto, rutinaData: null };
  }
  
  if (mensajeLower.includes('peso muerto') || mensajeLower.includes('deadlift')) {
    const texto = `**Peso Muerto (Deadlift)**

**Músculos trabajados:**
- Espalda baja (principal)
- Glúteos
- Isquiotibiales
- Trapecios
- Core

**Técnica:**
1. Párate con los pies separados al ancho de las caderas
2. Agarra la barra con las manos fuera de las piernas
3. Mantén la espalda recta y el pecho erguido
4. Levanta la barra extendiendo las caderas y las rodillas
5. Mantén la barra cerca del cuerpo durante todo el movimiento
6. Baja la barra controladamente invirtiendo el movimiento

**Consejos:**
- Nunca redondees la espalda
- Mantén el core activo
- La barra debe moverse en línea recta
- Para principiantes: 3 series x 5-8 repeticiones

⚠️ Este ejercicio requiere técnica perfecta. Si eres principiante, aprende primero con un entrenador.

¿Quieres guardar este ejercicio en tus favoritos?`;
    return { texto, rutinaData: null };
  }
  
  const texto = `Puedo ayudarte con información sobre cualquier ejercicio. Algunos ejercicios populares que puedo explicarte:
- Sentadillas
- Press de banca
- Peso muerto
- Dominadas
- Press de hombros
- Remo
- Y muchos más...

¿Sobre qué ejercicio específico quieres información?`;
  return { texto, rutinaData: null };
}

/**
 * Genera una respuesta simulada para consultas de asistencia
 * @returns {{texto: string, rutinaData: null}}
 */
function generarRespuestaAsistencia(mensaje) {
  const mensajeLower = mensaje.toLowerCase();
  
  if (mensajeLower.includes('dolor') || mensajeLower.includes('lesi')) {
    const texto = `Entiendo tu preocupación. Si sientes dolor o sospechas una lesión, es importante que:

1. **Detengas el ejercicio** que causa el dolor inmediatamente
2. **Apliques hielo** en la zona afectada (15-20 minutos)
3. **Descansas** y evita cargar peso en esa área
4. **Consulta con un médico o fisioterapeuta** si el dolor persiste

⚠️ **Importante:** No soy un profesional médico. Si el dolor es intenso o persiste, busca atención médica profesional.

Para prevenir lesiones:
- Calienta siempre antes de entrenar
- Usa la técnica correcta
- No aumentes el peso demasiado rápido
- Escucha a tu cuerpo

¿Hay algo más en lo que pueda ayudarte?`;
    return { texto, rutinaData: null };
  }
  
  if (mensajeLower.includes('progres') || mensajeLower.includes('mejorar')) {
    const texto = `Para progresar en el gimnasio, te recomiendo:

1. **Consistencia:** Entrena regularmente (3-4 veces por semana mínimo)
2. **Progresión:** Aumenta gradualmente el peso o las repeticiones
3. **Nutrición:** Come suficiente proteína y calorías según tus objetivos
4. **Descanso:** Duerme 7-9 horas y descansa entre entrenamientos
5. **Técnica:** Prioriza la forma correcta sobre el peso

**Regla de progresión:**
- Si puedes hacer todas las repeticiones con buena forma, aumenta el peso en 2.5-5kg
- Si no puedes, mantén el peso y trabaja en mejorar la técnica

¿Quieres que te ayude a crear una rutina específica para tus objetivos?`;
    return { texto, rutinaData: null };
  }
  
  const texto = `Estoy aquí para ayudarte con:
- Planificación de rutinas personalizadas
- Información sobre ejercicios y técnica
- Consejos de progresión y entrenamiento
- Resolver dudas sobre tu entrenamiento

¿En qué puedo ayudarte específicamente?`;
  return { texto, rutinaData: null };
}

/**
 * Genera una respuesta general
 * @returns {{texto: string, rutinaData: null}}
 */
function generarRespuestaGeneral(mensaje) {
  const texto = `Hola! Soy tu asistente virtual de entrenamiento. Puedo ayudarte con:

💪 **Planificación de rutinas** personalizadas según tus objetivos
📚 **Información sobre ejercicios** y técnica correcta
🤝 **Asistencia y consejos** para mejorar tu entrenamiento
⭐ **Guardar ejercicios favoritos** para consultarlos después

¿En qué puedo ayudarte hoy? Puedes preguntarme sobre rutinas, ejercicios específicos, o cualquier duda que tengas sobre entrenamiento.`;
  return { texto, rutinaData: null };
}

module.exports = {
  chatWithGPT,
};


