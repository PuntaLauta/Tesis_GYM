const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getClaseConOcupacion, getOcupacionClase } = require('../models/helpers');
const router = express.Router();

// GET /api/clases - Listar (público para ver, pero mejor con auth)
router.get('/', (req, res) => {
  try {
    const { desde, hasta, estado } = req.query;
    let sql = 'SELECT * FROM clases WHERE 1=1';
    const params = [];

    if (desde) {
      sql += ' AND fecha >= ?';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND fecha <= ?';
      params.push(hasta);
    }
    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY fecha, hora_inicio';

    const clases = query(sql, params);
    
    // Agregar ocupación a cada clase
    const clasesConOcupacion = clases.map(clase => {
      const ocupados = getOcupacionClase(clase.id);
      return {
        ...clase,
        ocupados,
        disponibles: clase.cupo - ocupados,
        porcentaje: clase.cupo > 0 ? Math.round((ocupados / clase.cupo) * 100) : 0,
      };
    });

    res.json({ data: clasesConOcupacion });
  } catch (error) {
    console.error('Error al listar clases:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/clases/:id - Detalle con ocupación
router.get('/:id', (req, res) => {
  try {
    const clase = getClaseConOcupacion(req.params.id);
    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    res.json({ data: clase });
  } catch (error) {
    console.error('Error al obtener clase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/clases - Crear (admin/root)
router.post('/', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const { nombre, fecha, hora_inicio, hora_fin, cupo, instructor } = req.body;

    if (!nombre || !fecha || !hora_inicio || !hora_fin || !cupo) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const result = insert(
      `INSERT INTO clases (nombre, fecha, hora_inicio, hora_fin, cupo, instructor, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'activa')`,
      [nombre, fecha, hora_inicio, hora_fin, cupo, instructor || null]
    );

    const nuevaClase = get('SELECT * FROM clases WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ data: nuevaClase });
  } catch (error) {
    console.error('Error al crear clase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/clases/:id - Editar (admin/root)
router.put('/:id', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const { nombre, fecha, hora_inicio, hora_fin, cupo, instructor, estado } = req.body;

    const clase = get('SELECT * FROM clases WHERE id = ?', [req.params.id]);
    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    run(
      `UPDATE clases 
       SET nombre = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, cupo = ?, instructor = ?, estado = ?
       WHERE id = ?`,
      [
        nombre || clase.nombre,
        fecha || clase.fecha,
        hora_inicio || clase.hora_inicio,
        hora_fin || clase.hora_fin,
        cupo || clase.cupo,
        instructor !== undefined ? instructor : clase.instructor,
        estado || clase.estado,
        req.params.id
      ]
    );

    const claseActualizada = get('SELECT * FROM clases WHERE id = ?', [req.params.id]);
    res.json({ data: claseActualizada });
  } catch (error) {
    console.error('Error al actualizar clase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/clases/:id - Cancelar (admin/root)
router.delete('/:id', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const clase = get('SELECT * FROM clases WHERE id = ?', [req.params.id]);
    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    // Cancelar clase
    run('UPDATE clases SET estado = ? WHERE id = ?', ['cancelada', req.params.id]);

    // Cancelar todas las reservas activas
    run(
      `UPDATE reservas SET estado = 'cancelado' 
       WHERE clase_id = ? AND estado = 'reservado'`,
      [req.params.id]
    );

    res.json({ message: 'Clase cancelada y reservas actualizadas' });
  } catch (error) {
    console.error('Error al cancelar clase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

