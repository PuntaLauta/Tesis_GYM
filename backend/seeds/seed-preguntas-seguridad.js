/**
 * Crea una pregunta de seguridad por usuario (respuesta hasheada con bcrypt).
 * La pregunta se elige al azar entre 5 opciones; la respuesta es la palabra plana indicada.
 */
const bcrypt = require('bcrypt');
const { query, insert } = require('./db');
const seedRandom = require('./utils/seedRandom');

const PREGUNTAS_SEGURIDAD = [
  { pregunta: '¿En qué ciudad naciste?', respuesta: 'ciudad' },
  { pregunta: '¿Cuál es tu equipo de fútbol preferido?', respuesta: 'equipo' },
  { pregunta: '¿Cuál es tu película favorita?', respuesta: 'pelicula' },
  { pregunta: '¿A qué escuela primaria asististe?', respuesta: 'escuela' },
  { pregunta: '¿Cuál fue tu primer auto?', respuesta: 'auto' },
];

async function seedPreguntasSeguridad() {
  const usuarios = query('SELECT id FROM usuarios');

  for (const u of usuarios) {
    const exist = query('SELECT id FROM preguntas_seguridad WHERE usuario_id = ?', [u.id]);
    if (exist.length > 0) continue;

    const indice = Math.floor(seedRandom.random() * PREGUNTAS_SEGURIDAD.length);
    const { pregunta, respuesta } = PREGUNTAS_SEGURIDAD[indice];
    const respuestaHash = await bcrypt.hash(respuesta, 10);

    insert(
      'INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)',
      [u.id, pregunta, respuestaHash]
    );
  }
}

module.exports = { seedPreguntasSeguridad };
