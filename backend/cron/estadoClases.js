/**
 * Job que actualiza el estado de clases activas cuya fecha+hora_fin ya pasó a "finalizada".
 * Cron configurable desde Configuración (root).
 */
const { query, get, run } = require('../db/database');

let cronJobRef = null;

/**
 * Clases con estado_clase_id = 1 (activa) y (fecha + hora_fin) < ahora se pasan a finalizada (2).
 * @returns {{ actualizados: number, total: number }}
 */
function runActualizarEstadoClases() {
  const toUpdate = query(
    `SELECT id FROM clases 
     WHERE estado_clase_id = 1 
     AND (fecha || ' ' || hora_fin) < datetime('now')`
  );
  const total = toUpdate.length;
  if (total === 0) {
    return { actualizados: 0, total: 0 };
  }
  run(
    `UPDATE clases 
     SET estado_clase_id = 2, fecha_cambio_estado = datetime('now') 
     WHERE estado_clase_id = 1 
     AND (fecha || ' ' || hora_fin) < datetime('now')`
  );
  return { actualizados: total, total };
}

/**
 * Lee estado_clases_cron_config y programa o detiene el cron.
 * Debe llamarse al iniciar el servidor y tras actualizar la config.
 */
function configurarCron() {
  try {
    const cron = require('node-cron');
    const config = get('SELECT * FROM estado_clases_cron_config WHERE id = 1');

    if (cronJobRef) {
      cronJobRef.stop();
      cronJobRef = null;
    }

    if (!config || !config.activo) {
      if (config && !config.activo) {
        console.log('⚠️ Cron de actualización de estado de clases desactivado');
      }
      return;
    }

    const hora = (config.hora || '00:00').trim();
    const [h, m] = hora.split(':').map((x) => parseInt(x, 10) || 0);
    const minute = Math.min(59, Math.max(0, m));
    const hour = Math.min(23, Math.max(0, h));
    const schedule = `${minute} ${hour} * * *`;

    cronJobRef = cron.schedule(schedule, () => {
      try {
        console.log('🔄 Ejecutando actualización de estado de clases...');
        const result = runActualizarEstadoClases();
        console.log(`✅ Estado de clases actualizado: ${result.actualizados} de ${result.total}`);
      } catch (err) {
        console.error('❌ Error en cron estado clases:', err);
      }
    });

    console.log(`✅ Cron estado clases: ${config.frecuencia} a las ${config.hora}`);
  } catch (err) {
    console.error('⚠️ Error al configurar cron estado clases:', err.message);
  }
}

module.exports = {
  runActualizarEstadoClases,
  configurarCron,
};
