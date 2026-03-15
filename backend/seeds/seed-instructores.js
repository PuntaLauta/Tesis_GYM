/**
 * Crea filas en `instructores` para cada usuario con rol instructor.
 * Al menos 3 en estado inactivo (activo = 0).
 */
const { query, insert } = require('./db');
const seedRandom = require('./utils/seedRandom');

async function seedInstructores() {
  const usuarios = query('SELECT id, nombre, email FROM usuarios WHERE rol = ? ORDER BY id', ['instructor']);
  if (usuarios.length === 0) return;

  const numInactivos = Math.min(3, usuarios.length);
  const inactivoIndices = new Set();
  while (inactivoIndices.size < numInactivos) {
    inactivoIndices.add(Math.floor(seedRandom.random() * usuarios.length));
  }

  for (let i = 0; i < usuarios.length; i++) {
    const u = usuarios[i];
    const activo = inactivoIndices.has(i) ? 0 : 1;
    const telefono = '381' + String(Math.floor(1000000 + seedRandom.random() * 9000000));
    insert(
      'INSERT INTO instructores (usuario_id, nombre, email, telefono, activo) VALUES (?, ?, ?, ?, ?)',
      [u.id, u.nombre, u.email, telefono, activo]
    );
  }
}

module.exports = { seedInstructores };
