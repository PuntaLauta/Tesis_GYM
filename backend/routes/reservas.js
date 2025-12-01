const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getOcupacionClase } = require('../models/helpers');
const router = express.Router();

// GET /api/reservas?clase_id=ID (admin/root/instructor)
router.get('/', requireAuth, requireRole('admin', 'root', 'instructor'), (req, res) => {
  try {
    const { clase_id } = req.query;
    const user = req.session.user;
    let sql = `
      SELECT r.*, s.nombre as socio_nombre, s.documento as socio_documento,
             s.telefono as socio_telefono, tc.nombre as clase_nombre,
             c.instructor_id, i.nombre as instructor_nombre
      FROM reservas r
      LEFT JOIN socios s ON r.socio_id = s.id
      LEFT JOIN clases c ON r.clase_id = c.id
      LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id
      LEFT JOIN instructores i ON c.instructor_id = i.id
      WHERE 1=1 AND r.estado != 'cancelado'
    `;
    const params = [];

    // Si es instructor, solo mostrar reservas de sus clases
    if (user.rol === 'instructor' && user.instructor_id) {
      sql += ' AND c.instructor_id = ?';
      params.push(user.instructor_id);
    }

    if (clase_id) {
      sql += ' AND r.clase_id = ?';
      params.push(clase_id);
      
      // Si es instructor, verificar que la clase sea suya
      if (user.rol === 'instructor' && user.instructor_id) {
        const clase = get('SELECT instructor_id FROM clases WHERE id = ?', [clase_id]);
        if (!clase || clase.instructor_id !== user.instructor_id) {
          return res.status(403).json({ error: 'No tienes permiso para ver reservas de esta clase' });
        }
      }
    }

    sql += ' ORDER BY r.ts DESC';

    const reservas = query(sql, params);
    res.json({ data: reservas });
  } catch (error) {
    console.error('Error al listar reservas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reservas/mias - Mis reservas (cliente)
router.get('/mias', requireAuth, (req, res) => {
  try {
    const user = req.session.user;
    
    // Si es cliente, usar socio_id de la sesión
    if (user.rol === 'cliente') {
      if (!user.socio_id) {
        return res.json({ data: [] });
      }
      
      const reservas = query(`
        SELECT r.*, tc.nombre as clase_nombre, c.fecha, c.hora_inicio, c.hora_fin, c.instructor, c.estado as clase_estado
        FROM reservas r
        LEFT JOIN clases c ON r.clase_id = c.id
        LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id
        WHERE r.socio_id = ? AND (r.estado != 'cancelado' OR c.estado = 'cancelada')
        ORDER BY c.fecha DESC, c.hora_inicio DESC
      `, [user.socio_id]);

      return res.json({ data: reservas });
    }
    
    // Para admin/root, devolver todas (aunque no deberían usar este endpoint)
    const reservas = query(`
      SELECT r.*, tc.nombre as clase_nombre, c.fecha, c.hora_inicio, c.hora_fin, c.instructor, c.estado as clase_estado
      FROM reservas r
      LEFT JOIN clases c ON r.clase_id = c.id
      LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id
      ORDER BY c.fecha DESC, c.hora_inicio DESC
    `);
    
    res.json({ data: reservas });
  } catch (error) {
    console.error('Error al listar mis reservas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/reservas - Crear reserva
router.post('/', requireAuth, (req, res) => {
  try {
    const { clase_id, socio_id } = req.body;
    const user = req.session.user;

    if (!clase_id) {
      return res.status(400).json({ error: 'clase_id requerido' });
    }

    // Verificar que la clase existe y está activa
    const clase = get('SELECT * FROM clases WHERE id = ?', [clase_id]);
    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    if (clase.estado !== 'activa') {
      return res.status(400).json({ error: 'La clase no está activa' });
    }

    // Determinar socio_id
    let finalSocioId = socio_id;
    if (user.rol === 'cliente') {
      // Cliente solo puede reservar para sí mismo usando socio_id de la sesión
      if (!user.socio_id) {
        return res.status(400).json({ error: 'No se encontró tu perfil de socio' });
      }
      finalSocioId = user.socio_id;
      
      // Verificar que el socio esté activo
      const socio = get('SELECT estado FROM socios WHERE id = ?', [finalSocioId]);
      if (!socio) {
        return res.status(404).json({ error: 'Socio no encontrado' });
      }
      if (socio.estado !== 'activo') {
        return res.status(403).json({ error: 'No puedes reservar clases porque tu cuenta está inactiva. Contacta a recepción para reactivar tu membresía.' });
      }
    } else if (!socio_id) {
      return res.status(400).json({ error: 'socio_id requerido' });
    } else {
      // Para admin/root, también verificar que el socio esté activo
      const socio = get('SELECT estado FROM socios WHERE id = ?', [socio_id]);
      if (socio && socio.estado !== 'activo') {
        return res.status(403).json({ error: 'El socio está inactivo y no puede reservar clases' });
      }
    }

    // Verificar cupo
    const ocupados = getOcupacionClase(clase_id);
    if (ocupados >= clase.cupo) {
      return res.status(409).json({ error: 'Cupo lleno' });
    }

    // Verificar si ya existe reserva activa (excluyendo canceladas)
    const reservaActiva = get(
      'SELECT * FROM reservas WHERE clase_id = ? AND socio_id = ? AND estado != ?',
      [clase_id, finalSocioId, 'cancelado']
    );
    if (reservaActiva) {
      return res.status(409).json({ error: 'Ya tienes una reserva para esta clase' });
    }

    // Verificar si existe una reserva cancelada para reactivar
    const reservaCancelada = get(
      'SELECT * FROM reservas WHERE clase_id = ? AND socio_id = ? AND estado = ?',
      [clase_id, finalSocioId, 'cancelado']
    );

    let reservaFinal;
    if (reservaCancelada) {
      // Reactivar la reserva cancelada
      run('UPDATE reservas SET estado = ?, ts = datetime("now") WHERE id = ?', ['reservado', reservaCancelada.id]);
      reservaFinal = get('SELECT * FROM reservas WHERE id = ?', [reservaCancelada.id]);
    } else {
      // Crear nueva reserva
      const result = insert(
        `INSERT INTO reservas (clase_id, socio_id, estado) VALUES (?, ?, 'reservado')`,
        [clase_id, finalSocioId]
      );
      reservaFinal = get('SELECT * FROM reservas WHERE id = ?', [result.lastInsertRowid]);
    }

    res.status(201).json({ data: reservaFinal });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/reservas/:id/cancelar - Cancelar reserva
router.put('/:id/cancelar', requireAuth, (req, res) => {
  try {
    const reserva = get('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const user = req.session.user;
    
    // Cliente solo puede cancelar sus propias reservas
    if (user.rol === 'cliente') {
      if (!user.socio_id || user.socio_id !== reserva.socio_id) {
        return res.status(403).json({ error: 'No puedes cancelar esta reserva' });
      }
    }

    run('UPDATE reservas SET estado = ? WHERE id = ?', ['cancelado', req.params.id]);
    res.json({ message: 'Reserva cancelada' });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/reservas/:id/asistencia - Marcar asistencia (admin/root)
router.put('/:id/asistencia', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const { estado } = req.body; // 'asistio' o 'ausente'

    if (!estado || !['asistio', 'ausente'].includes(estado)) {
      return res.status(400).json({ error: 'estado debe ser "asistio" o "ausente"' });
    }

    const reserva = get('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    run('UPDATE reservas SET estado = ? WHERE id = ?', [estado, req.params.id]);
    
    const reservaActualizada = get('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    res.json({ data: reservaActualizada });
  } catch (error) {
    console.error('Error al marcar asistencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;




