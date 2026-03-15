/**
 * Genera pagos históricos por socio. Monto = planes.precio del plan del socio (consistente con tabla planes).
 * Fechas 2023–2026; método efectivo/transferencia.
 */
const { query, insert } = require('./db');
const { randomDateInRange } = require('./utils/helpers');

const METODOS = ['efectivo', 'transferencia'];

async function seedPagos() {
  const sociosConPlan = query(
    `SELECT s.id AS socio_id, p.precio, p.duracion
     FROM socios s
     INNER JOIN planes p ON s.plan_id = p.id`
  );
  if (sociosConPlan.length === 0) return;

  for (const row of sociosConPlan) {
    const numPagos = 2 + Math.floor(Math.random() * 8);
    for (let i = 0; i < numPagos; i++) {
      const fecha = randomDateInRange({ needTime: false });
      const metodo = METODOS[Math.floor(Math.random() * METODOS.length)];
      insert(
        'INSERT INTO pagos (socio_id, monto, fecha, metodo_pago) VALUES (?, ?, ?, ?)',
        [row.socio_id, row.precio, fecha, metodo]
      );
    }
  }
}

module.exports = { seedPagos };
