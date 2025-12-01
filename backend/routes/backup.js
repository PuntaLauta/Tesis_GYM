const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { query, get, run } = require('../db/database');
const { crearBackup, listarBackups, restaurarBackup, eliminarBackup, limpiarBackupsAntiguos } = require('../db/backup');
const router = express.Router();

// Todas las rutas requieren autenticación y rol root
router.use(requireAuth);
router.use(requireRole('root'));

// GET /api/backup - Listar backups disponibles
router.get('/', (req, res) => {
  try {
    const backups = listarBackups();
    res.json({ data: backups });
  } catch (error) {
    console.error('Error al listar backups:', error);
    res.status(500).json({ error: 'Error al listar backups' });
  }
});

// POST /api/backup - Crear backup manual
router.post('/', (req, res) => {
  try {
    const nombreArchivo = crearBackup('manual');
    res.json({ 
      message: 'Backup creado correctamente',
      archivo: nombreArchivo
    });
  } catch (error) {
    console.error('Error al crear backup:', error);
    res.status(500).json({ error: 'Error al crear backup: ' + error.message });
  }
});

// POST /api/backup/restore - Restaurar desde backup
router.post('/restore', (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'Nombre del backup requerido' });
    }

    restaurarBackup(nombre, tipo || 'manual');
    res.json({ message: 'Backup restaurado correctamente. El servidor debe reiniciarse.' });
  } catch (error) {
    console.error('Error al restaurar backup:', error);
    res.status(500).json({ error: 'Error al restaurar backup: ' + error.message });
  }
});

// DELETE /api/backup/:nombre - Eliminar backup
router.delete('/:nombre', (req, res) => {
  try {
    const { nombre } = req.params;
    const { tipo } = req.query;
    
    eliminarBackup(nombre, tipo || 'manual');
    res.json({ message: 'Backup eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar backup:', error);
    res.status(500).json({ error: 'Error al eliminar backup: ' + error.message });
  }
});

// GET /api/backup/config - Obtener configuración de backups automáticos
router.get('/config', (req, res) => {
  try {
    const config = get('SELECT * FROM backup_config WHERE id = 1');
    
    if (!config) {
      // Configuración por defecto
      return res.json({
        data: {
          frecuencia: 'diario',
          hora: '02:00',
          mantener_backups: 30,
          activo: 1
        }
      });
    }

    res.json({ data: config });
  } catch (error) {
    console.error('Error al obtener configuración de backup:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// PUT /api/backup/config - Configurar backups automáticos
router.put('/config', (req, res) => {
  try {
    const { frecuencia, hora, mantener_backups, activo } = req.body;

    if (frecuencia && !['diario', 'semanal', 'mensual'].includes(frecuencia)) {
      return res.status(400).json({ error: 'Frecuencia inválida. Debe ser: diario, semanal o mensual' });
    }

    const configExistente = get('SELECT id FROM backup_config WHERE id = 1');

    if (configExistente) {
      // Actualizar
      run(
        `UPDATE backup_config 
         SET frecuencia = ?, hora = ?, mantener_backups = ?, activo = ?
         WHERE id = 1`,
        [
          frecuencia !== undefined ? frecuencia : configExistente.frecuencia,
          hora !== undefined ? hora : configExistente.hora,
          mantener_backups !== undefined ? mantener_backups : configExistente.mantener_backups,
          activo !== undefined ? activo : configExistente.activo
        ]
      );
    } else {
      // Crear si no existe
      run(
        `INSERT INTO backup_config (id, frecuencia, hora, mantener_backups, activo)
         VALUES (1, ?, ?, ?, ?)`,
        [
          frecuencia || 'diario',
          hora || '02:00',
          mantener_backups || 30,
          activo !== undefined ? activo : 1
        ]
      );
    }

    const configActualizada = get('SELECT * FROM backup_config WHERE id = 1');
    res.json({ data: configActualizada });
  } catch (error) {
    console.error('Error al actualizar configuración de backup:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// POST /api/backup/cleanup - Limpiar backups antiguos manualmente
router.post('/cleanup', (req, res) => {
  try {
    const config = get('SELECT mantener_backups FROM backup_config WHERE id = 1');
    const diasMantener = config ? config.mantener_backups : 30;
    
    const eliminados = limpiarBackupsAntiguos(diasMantener);
    res.json({ 
      message: `Se eliminaron ${eliminados} backups antiguos`,
      eliminados 
    });
  } catch (error) {
    console.error('Error al limpiar backups:', error);
    res.status(500).json({ error: 'Error al limpiar backups' });
  }
});

module.exports = router;



