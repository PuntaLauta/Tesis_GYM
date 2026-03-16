/**
 * Genera múltiples accesos por socio. Más accesos para activos; fechas 2023–2026.
 */
const { query, insert } = require('./db');
const { randomDateInRange } = require('./utils/helpers');
const seedRandom = require('./utils/seedRandom');

async function seedAccesos() {
  const socios = query(
    `SELECT s.id, se.nombre AS estado
     FROM socios s
     LEFT JOIN socio_estado se ON s.socio_estado_id = se.id`
  );
  if (socios.length === 0) return;

  for (const socio of socios) {
    const isActivo = socio.estado === 'activo';
    const numAccesos = isActivo
      ? 10 + Math.floor(seedRandom.random() * 30)
      : 1 + Math.floor(seedRandom.random() * 8);

    for (let i = 0; i < numAccesos; i++) {
      const fechaHora = randomDateInRange({ needTime: true });
      const permitido = isActivo ? (seedRandom.random() > 0.05 ? 1 : 0) : (seedRandom.random() > 0.7 ? 1 : 0);
      const motivo = permitido ? 'Socio activo' : (isActivo ? 'Verificación pendiente' : 'Membresía vencida');

      insert(
        'INSERT INTO accesos (socio_id, fecha_hora, permitido, motivo) VALUES (?, ?, ?, ?)',
        [socio.id, fechaHora, permitido, motivo]
      );
    }
  }
}

module.exports = { seedAccesos };
