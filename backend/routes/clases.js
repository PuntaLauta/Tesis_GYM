const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getClaseConOcupacion, getOcupacionClase } = require('../models/helpers');
const router = express.Router();

// GET /api/clases - Listar (público para ver, pero mejor con auth)
router.get('/', (req, res) => {
  try {
    const { desde, hasta, estado, tipo_clase_id } = req.query;
    let sql = `SELECT c.*, tc.nombre as nombre, tc.descripcion as tipo_descripcion 
               FROM clases c 
               LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id 
               WHERE 1=1`;
    const params = [];

    if (desde) {
      sql += ' AND c.fecha >= ?';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND c.fecha <= ?';
      params.push(hasta);
    }
    if (estado) {
      sql += ' AND c.estado = ?';
      params.push(estado);
    }
    if (tipo_clase_id) {
      sql += ' AND c.tipo_clase_id = ?';
      params.push(tipo_clase_id);
    }

    sql += ' ORDER BY c.fecha, c.hora_inicio';

    const clases = query(sql, params);
    
    // Obtener socio_id y estado del usuario si es cliente
    let userSocioId = null;
    let socioEstado = null;
    if (req.session && req.session.user) {
      const user = req.session.user;
      if (user.rol === 'cliente' && user.socio_id) {
        userSocioId = user.socio_id;
        const socio = get('SELECT estado FROM socios WHERE id = ?', [userSocioId]);
        if (socio) {
          socioEstado = socio.estado;
        }
      }
    }

    // Agregar ocupación y estado de reserva a cada clase
    const clasesConOcupacion = clases.map(clase => {
      const ocupados = getOcupacionClase(clase.id);
      
      // Verificar si el usuario tiene una reserva activa para esta clase
      let tieneReserva = false;
      let reservaId = null;
      if (userSocioId) {
        const reserva = get(
          'SELECT id FROM reservas WHERE clase_id = ? AND socio_id = ? AND estado != ?',
          [clase.id, userSocioId, 'cancelado']
        );
        if (reserva) {
          tieneReserva = true;
          reservaId = reserva.id;
        }
      }
      
      return {
        ...clase,
        ocupados,
        disponibles: clase.cupo - ocupados,
        porcentaje: clase.cupo > 0 ? Math.round((ocupados / clase.cupo) * 100) : 0,
        tiene_reserva: tieneReserva,
        reserva_id: reservaId,
        socio_activo: socioEstado === 'activo', // Indica si el socio del usuario está activo
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
    const { tipo_clase_id, fecha, hora_inicio, hora_fin, cupo, instructor } = req.body;

    if (!tipo_clase_id || !fecha || !hora_inicio || !hora_fin || !cupo) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const result = insert(
      `INSERT INTO clases (tipo_clase_id, fecha, hora_inicio, hora_fin, cupo, instructor, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'activa')`,
      [tipo_clase_id, fecha, hora_inicio, hora_fin, cupo, instructor || null]
    );

    const nuevaClase = get(
      `SELECT c.*, tc.nombre as nombre, tc.descripcion as tipo_descripcion 
       FROM clases c 
       LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id 
       WHERE c.id = ?`,
      [result.lastInsertRowid]
    );
    res.status(201).json({ data: nuevaClase });
  } catch (error) {
    console.error('Error al crear clase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/clases/:id - Editar (admin/root)
router.put('/:id', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const { tipo_clase_id, fecha, hora_inicio, hora_fin, cupo, instructor, estado } = req.body;

    const clase = get('SELECT * FROM clases WHERE id = ?', [req.params.id]);
    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    run(
      `UPDATE clases 
       SET tipo_clase_id = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, cupo = ?, instructor = ?, estado = ?
       WHERE id = ?`,
      [
        tipo_clase_id !== undefined ? tipo_clase_id : clase.tipo_clase_id,
        fecha || clase.fecha,
        hora_inicio || clase.hora_inicio,
        hora_fin || clase.hora_fin,
        cupo || clase.cupo,
        instructor !== undefined ? instructor : clase.instructor,
        estado || clase.estado,
        req.params.id
      ]
    );

    const claseActualizada = get(
      `SELECT c.*, tc.nombre as nombre, tc.descripcion as tipo_descripcion 
       FROM clases c 
       LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id 
       WHERE c.id = ?`,
      [req.params.id]
    );
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

