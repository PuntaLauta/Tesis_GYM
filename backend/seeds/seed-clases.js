/**
 * Asegura al menos 10 tipos de clase en tipo_clase (INSERT OR IGNORE) y genera múltiples clases entre 2023 y 2026.
 */
const { query, insert } = require('./db');
const { randomDateInRange } = require('./utils/helpers');

const TIPOS_CLASE = [
  ['Crossfit', 'Entrenamiento funcional de alta intensidad'],
  ['Zumba', 'Clase aeróbica grupal con música'],
  ['Funcional', 'Entrenamiento funcional general'],
  ['Boxeo', 'Clase de boxeo y cardio'],
  ['Yoga', 'Clase de movilidad y relajación'],
  ['Pilates', 'Trabajo de core y control postural'],
  ['Spinning', 'Ciclismo indoor'],
  ['HIIT', 'Entrenamiento interválico de alta intensidad'],
  ['Stretching', 'Clase de estiramientos y recuperación'],
  ['Cardio', 'Entrenamiento aeróbico general'],
];

const HORARIOS = [
  ['07:00', '08:00'],
  ['08:00', '09:00'],
  ['09:00', '10:00'],
  ['10:00', '11:00'],
  ['17:00', '18:00'],
  ['18:00', '19:00'],
  ['19:00', '20:00'],
  ['20:00', '21:00'],
];

const NUM_CLASES = 400;

async function seedClases() {
  for (const [nombre, descripcion] of TIPOS_CLASE) {
    const exist = query('SELECT id FROM tipo_clase WHERE nombre = ?', [nombre]);
    if (exist.length === 0) {
      insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
    }
  }

  const tipos = query('SELECT id, nombre FROM tipo_clase');
  const instructores = query('SELECT id, nombre FROM instructores WHERE activo = 1');
  if (instructores.length === 0) {
    const todos = query('SELECT id, nombre FROM instructores');
    if (todos.length === 0) return;
    instructores.push(...todos);
  }

  for (let i = 0; i < NUM_CLASES; i++) {
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const inst = instructores[Math.floor(Math.random() * instructores.length)];
    const fecha = randomDateInRange({ needTime: false });
    const [horaInicio, horaFin] = HORARIOS[Math.floor(Math.random() * HORARIOS.length)];
    const cupo = 12 + Math.floor(Math.random() * 14);
    const estado = Math.random() > 0.05 ? 'activa' : 'cancelada';

    insert(
      `INSERT INTO clases (tipo_clase_id, fecha, hora_inicio, hora_fin, cupo, instructor_id, instructor, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo.id, fecha, horaInicio, horaFin, cupo, inst.id, inst.nombre, estado]
    );
  }
}

module.exports = { seedClases };
