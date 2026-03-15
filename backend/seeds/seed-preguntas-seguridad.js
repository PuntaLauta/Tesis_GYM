/**
 * Crea una pregunta de seguridad por usuario (respuesta hasheada con bcrypt).
 */
const bcrypt = require('bcrypt');
const { query, insert } = require('./db');

const PREGUNTA = '¿Ciudad donde naciste?';
const RESPUESTA_POR_DEFECTO = 'test';

async function seedPreguntasSeguridad() {
  const usuarios = query('SELECT id FROM usuarios');
  const respuestaHash = await bcrypt.hash(RESPUESTA_POR_DEFECTO, 10);

  for (const u of usuarios) {
    const exist = query('SELECT id FROM preguntas_seguridad WHERE usuario_id = ?', [u.id]);
    if (exist.length > 0) continue;
    insert(
      'INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)',
      [u.id, PREGUNTA, respuestaHash]
    );
  }
}

module.exports = { seedPreguntasSeguridad };
