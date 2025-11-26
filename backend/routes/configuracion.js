const express = require('express');
const { query, get, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/configuracion - Obtener configuración del gimnasio (público)
router.get('/', (req, res) => {
  try {
    const config = get('SELECT * FROM configuracion_gym WHERE id = 1');
    
    if (!config) {
      // Si no existe, retornar valores por defecto
      return res.json({
        data: {
          nombre: 'Gimnasio',
          telefono: '381 000000',
          email: 'soporte.am@gmail.com',
          horarios_lunes_viernes: 'Lunes a viernes: 7:00 a 23:00',
          horarios_sabado: 'Sabados: 8:00 a 20:00'
        }
      });
    }

    res.json({ data: config });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/configuracion - Actualizar configuración (solo root)
router.put('/', requireAuth, requireRole('root'), (req, res) => {
  try {
    const { nombre, telefono, email, horarios_lunes_viernes, horarios_sabado } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del gimnasio es requerido' });
    }

    // Verificar si existe la configuración
    const configExistente = get('SELECT id FROM configuracion_gym WHERE id = 1');

    if (configExistente) {
      // Actualizar
      run(
        `UPDATE configuracion_gym 
         SET nombre = ?, telefono = ?, email = ?, horarios_lunes_viernes = ?, horarios_sabado = ?
         WHERE id = 1`,
        [nombre, telefono || null, email || null, horarios_lunes_viernes || null, horarios_sabado || null]
      );
    } else {
      // Crear si no existe
      run(
        `INSERT INTO configuracion_gym (id, nombre, telefono, email, horarios_lunes_viernes, horarios_sabado)
         VALUES (1, ?, ?, ?, ?, ?)`,
        [nombre, telefono || null, email || null, horarios_lunes_viernes || null, horarios_sabado || null]
      );
    }

    const configActualizada = get('SELECT * FROM configuracion_gym WHERE id = 1');
    res.json({ data: configActualizada });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

