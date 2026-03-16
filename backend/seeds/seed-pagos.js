/**
 * Genera pagos históricos por socio. Monto = planes.precio del plan del socio (consistente con tabla planes).
 * Fechas 2023–hoy. Socios activos (socio_estado_id = 1): se agrega un pago reciente para que la membresía siga vigente al login.
 */
const { query, insert } = require('./db');
const { randomDateInRange } = require('./utils/helpers');
const seedRandom = require('./utils/seedRandom');

const METODOS = ['efectivo', 'transferencia'];

function fechaHaceNDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

async function seedPagos() {
  const sociosConPlan = query(
    `SELECT s.id AS socio_id, s.socio_estado_id, p.precio, p.duracion
     FROM socios s
     INNER JOIN planes p ON s.plan_id = p.id`
  );
  if (sociosConPlan.length === 0) return;

  for (const row of sociosConPlan) {
    const numPagos = 2 + Math.floor(seedRandom.random() * 8);
    for (let i = 0; i < numPagos; i++) {
      const fecha = randomDateInRange({ needTime: false });
      const metodo = METODOS[Math.floor(seedRandom.random() * METODOS.length)];
      insert(
        'INSERT INTO pagos (socio_id, monto, fecha, metodo_pago) VALUES (?, ?, ?, ?)',
        [row.socio_id, row.precio, fecha, metodo]
      );
    }
    // Socios activos: último pago = hoy para que fecha_vencimiento >= hoy y no pasen a inactivo al login
    if (row.socio_estado_id === 1) {
      const fechaReciente = fechaHaceNDias(0);
      const metodo = METODOS[Math.floor(seedRandom.random() * METODOS.length)];
      insert(
        'INSERT INTO pagos (socio_id, monto, fecha, metodo_pago) VALUES (?, ?, ?, ?)',
        [row.socio_id, row.precio, fechaReciente, metodo]
      );
    }
  }
}

module.exports = { seedPagos };
