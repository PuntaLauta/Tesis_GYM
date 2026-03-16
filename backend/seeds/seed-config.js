/**
 * Configura solo backup_config. No modifica configuracion_gym ni planes.
 */
const { run, query, insert } = require('./db');

async function seedConfig() {
  const existing = query('SELECT id FROM backup_config WHERE id = 1');
  if (existing.length > 0) {
    run(
      'UPDATE backup_config SET frecuencia = ?, hora = ?, mantener_backups = ?, activo = ? WHERE id = 1',
      ['diario', '02:00', 30, 1]
    );
  } else {
    insert(
      'INSERT INTO backup_config (id, frecuencia, hora, mantener_backups, activo) VALUES (1, ?, ?, ?, ?)',
      ['diario', '02:00', 30, 1]
    );
  }
}

module.exports = { seedConfig };
