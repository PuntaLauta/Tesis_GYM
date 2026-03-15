/**
 * Crea socios asociados a usuarios cliente. Distribución de estados: ~80% activo, 10% inactivo, 9% abandono, 1% suspendido.
 * fecha_cambio y datos en rango 2023–2026.
 */
const { query, insert } = require('./db');
const { createDniGenerator, getSocioEstadoId, randomDateInRange, generarToken6Digitos } = require('./utils/helpers');

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
    const fechaCambio = randomDateInRange({ needTime: true });
    const canceladoPorAdmin = socioEstadoId === 3 ? 1 : 0; // 3 = suspendido
    const planId = planIds.length > 0 ? planIds[Math.floor(Math.random() * planIds.length)] : null;
    const documento = nextDni();
    const telefono = '381' + String(Math.floor(1000000 + Math.random() * 9000000));
    const qrToken = generarToken6Digitos(existsToken);

    insert(
      `INSERT INTO socios (nombre, documento, telefono, socio_estado_id, fecha_cambio, cancelado_por_admin, plan_id, usuario_id, qr_token, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.nombre, documento, telefono, socioEstadoId, fechaCambio, canceladoPorAdmin, planId, u.id, qrToken, null]
    );
  }
}

module.exports = { seedSocios };
