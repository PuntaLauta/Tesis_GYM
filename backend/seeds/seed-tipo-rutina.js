/**
 * Inserta los 4 tipos de rutina por defecto si no existen.
 * No borra datos existentes (clear-data no toca tipo_rutina).
 */
const { query, run } = require('./db');

const TIPOS_RUTINA = [
  ['Fuerza', 'Rutina orientada a desarrollo de fuerza máxima y potencia. Incluye ejercicios compuestos y trabajo con cargas altas.'],
  ['Hipertrofia', 'Rutina para ganancia de masa muscular. Volumen moderado-alto, rangos de repeticiones 8-12, múltiples series.'],
  ['Full body', 'Rutina de cuerpo completo por sesión. Ideal para 2-4 días por semana y mantenimiento general.'],
  ['Resistencia', 'Rutina enfocada en resistencia muscular y cardiovascular. Circuitos, repeticiones altas y poco descanso.'],
];

function seedTipoRutina() {
  for (const [nombre, descripcion] of TIPOS_RUTINA) {
    const exist = query('SELECT 1 FROM tipo_rutina WHERE nombre = ?', [nombre]);
    if (!exist || exist.length === 0) {
      run('INSERT INTO tipo_rutina (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
    }
  }
}

module.exports = { seedTipoRutina };
