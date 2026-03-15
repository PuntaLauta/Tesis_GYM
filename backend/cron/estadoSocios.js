/**
 * Job que actualiza el estado de todos los socios (misma lógica que al hacer login).
 * Cron configurable desde Configuración (root).
 */
const { query, get, run } = require('../db/database');
const { calcularEstadoSocioConPagos } = require('../models/helpers');

let cronJobRef = null;

/**
 * Recorre todos los socios y actualiza socio_estado_id según pagos (activo/inactivo/abandono).
 * No toca socios con cancelado_por_admin = 1.
 * @returns {{ actualizados: number, total: number }}
 */
function runActualizarEstadoSocios() {
  const socios = query('SELECT id, cancelado_por_admin, socio_estado_id FROM socios');
  let actualizados = 0;

  for (const socio of socios) {
    if (socio.cancelado_por_admin) continue;

    try {
      const resultado = calcularEstadoSocioConPagos(socio.id);
      const { estadoRecomendado } = resultado;

      if (
        estadoRecomendado &&
        ['activo', 'inactivo', 'abandono'].includes(estadoRecomendado)
      ) {
        const estadoRow = get('SELECT id FROM socio_estado WHERE nombre = ?', [estadoRecomendado]);
        if (estadoRow && estadoRow.id !== socio.socio_estado_id) {
          run("UPDATE socios SET socio_estado_id = ?, fecha_cambio = datetime('now') WHERE id = ?", [
            estadoRow.id,
            socio.id,
          ]);
          actualizados++;
        }
      }
    } catch (err) {
      console.error('Error al actualizar estado del socio', socio.id, err.message);
    }
  }

  return { actualizados, total: socios.length };
}

/**
 * Lee estado_socios_cron_config y programa o detiene el cron.
 * Debe llamarse al iniciar el servidor y tras actualizar la config.
 */
function configurarCron() {
  try {
    const cron = require('node-cron');
    const config = get('SELECT * FROM estado_socios_cron_config WHERE id = 1');

    if (cronJobRef) {
      cronJobRef.stop();
      cronJobRef = null;
    }

    if (!config || !config.activo) {
      if (config && !config.activo) {
        console.log('⚠️ Cron de actualización de estado de socios desactivado');
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
        console.log('🔄 Ejecutando actualización de estado de socios...');
        const result = runActualizarEstadoSocios();
        console.log(`✅ Estado de socios actualizado: ${result.actualizados} de ${result.total}`);
      } catch (err) {
        console.error('❌ Error en cron estado socios:', err);
      }
    });

    console.log(`✅ Cron estado socios: ${config.frecuencia} a las ${config.hora}`);
  } catch (err) {
    console.error('⚠️ Error al configurar cron estado socios:', err.message);
  }
}

module.exports = {
  runActualizarEstadoSocios,
  configurarCron,
};
