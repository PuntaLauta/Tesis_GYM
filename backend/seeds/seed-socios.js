/**
 * Crea socios asociados a usuarios cliente. Distribución de estados: ~80% activo, 10% inactivo, 9% abandono, 1% suspendido.
 * fecha_cambio y datos en rango 2023–2026.
 */
const { query, insert } = require('./db');
const { createDniGenerator, getSocioEstadoId, randomDateInRange, randomDateLastNDays, generarToken6Digitos } = require('./utils/helpers');
const seedRandom = require('./utils/seedRandom');

const NOTAS_ALEATORIAS = [
  'Prefiere horario matutino.',
  'Alérgico a látex, usar bandas alternativas.',
  'Renovar carnet en marzo.',
  'Viene con amigo los viernes.',
  'Dejó indumentaria en lockers.',
  'Consulta por plan familiar.',
  'Recuperación post lesión, sin impacto.',
  'Trae toalla propia.',
  'Horario preferido: después de las 18.',
  'Solicitó factura A.',
  'Entrena solo fines de semana.',
  'Indicar estacionamiento para moto.',
];

async function seedSocios() {
  const clientes = query('SELECT id, nombre, email FROM usuarios WHERE rol = ? ORDER BY id', ['cliente']);
  if (clientes.length === 0) return;

  const planes = query('SELECT id FROM planes');
  const planIds = planes.length > 0 ? planes.map((p) => p.id) : [];
  const nextDni = createDniGenerator();

  const existsToken = (token) => query('SELECT id FROM socios WHERE qr_token = ?', [token]).length > 0;

  for (let i = 0; i < clientes.length; i++) {
    const u = clientes[i];
    const socioEstadoId = getSocioEstadoId(i, true);
    // Socios activos: fecha_cambio reciente (últimos 30 días) para consistencia con test data actual
    const fechaCambio =
      socioEstadoId === 1
        ? randomDateLastNDays(30, { needTime: true })
        : randomDateInRange({ needTime: true });
    const canceladoPorAdmin = socioEstadoId === 3 ? 1 : 0; // 3 = suspendido
    const planId = planIds.length > 0 ? planIds[Math.floor(seedRandom.random() * planIds.length)] : null;
    const documento = nextDni();
    const telefono = '381' + String(Math.floor(1000000 + seedRandom.random() * 9000000));
    const qrToken = generarToken6Digitos(existsToken);
    const notas =
      seedRandom.random() < 0.35
        ? NOTAS_ALEATORIAS[Math.floor(seedRandom.random() * NOTAS_ALEATORIAS.length)]
        : null;

    insert(
      `INSERT INTO socios (nombre, documento, telefono, socio_estado_id, fecha_cambio, cancelado_por_admin, plan_id, usuario_id, qr_token, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.nombre, documento, telefono, socioEstadoId, fechaCambio, canceladoPorAdmin, planId, u.id, qrToken, notas]
    );
  }
}

module.exports = { seedSocios };
