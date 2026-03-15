/**
 * Genera reservas ligadas a clases y socios. Fechas ts coherentes con la clase; estados variados.
 */
const { query, insert } = require('./db');
const seedRandom = require('./utils/seedRandom');

const ESTADOS = ['reservado', 'cancelado', 'asistio', 'ausente'];

async function seedReservas() {
  const clases = query('SELECT id, fecha, hora_inicio FROM clases WHERE estado = ?', ['activa']);
  const socios = query('SELECT id FROM socios');
  if (clases.length === 0 || socios.length === 0) return;

  const used = new Set();
  const numReservas = Math.min(1500, clases.length * 15);

  for (let i = 0; i < numReservas; i++) {
    const clase = clases[Math.floor(seedRandom.random() * clases.length)];
    const socio = socios[Math.floor(seedRandom.random() * socios.length)];
    const key = `${clase.id}-${socio.id}`;
    if (used.has(key)) continue;
    used.add(key);

    const [y, m, d] = clase.fecha.split('-').map(Number);
    const ts = new Date(y, m - 1, d, 0, 0, 0);
    ts.setDate(ts.getDate() - Math.floor(seedRandom.random() * 3));
    const tsStr = ts.toISOString().replace('T', ' ').substring(0, 19);
    const estado = ESTADOS[Math.floor(seedRandom.random() * ESTADOS.length)];

    try {
      insert(
        'INSERT INTO reservas (clase_id, socio_id, estado, ts) VALUES (?, ?, ?, ?)',
        [clase.id, socio.id, estado, tsStr]
      );
    } catch (e) {
      if (!e.message || !e.message.includes('UNIQUE')) throw e;
    }
  }
}

module.exports = { seedReservas };
