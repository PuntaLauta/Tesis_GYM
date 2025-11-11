const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getOcupacionClase } = require('../models/helpers');
const router = express.Router();

// GET /api/reservas?clase_id=ID (admin/root)
router.get('/', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const { clase_id } = req.query;
    let sql = `
      SELECT r.*, s.nombre as socio_nombre, c.nombre as clase_nombre
      FROM reservas r
      LEFT JOIN socios s ON r.socio_id = s.id
      LEFT JOIN clases c ON r.clase_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (clase_id) {
      sql += ' AND r.clase_id = ?';
      params.push(clase_id);
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
    // Por ahora, el cliente necesita estar vinculado a un socio
    // Por simplicidad, asumimos que el email del usuario coincide con algún socio
    // En producción, deberías tener una tabla usuarios_socios
    
    const user = req.session.user;
    const reservas = query(`
      SELECT r.*, c.nombre as clase_nombre, c.fecha, c.hora_inicio, c.hora_fin
      FROM reservas r
      LEFT JOIN clases c ON r.clase_id = c.id
      LEFT JOIN socios s ON r.socio_id = s.id
      WHERE s.nombre LIKE ? OR s.id IN (
        SELECT id FROM socios WHERE nombre LIKE ?
      )
      ORDER BY c.fecha DESC, c.hora_inicio DESC
    `, [`%${user.nombre}%`, `%${user.nombre}%`]);

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
      // Cliente solo puede reservar para sí mismo
      // Buscar socio por nombre (simplificado)
      const socio = get('SELECT * FROM socios WHERE nombre LIKE ? LIMIT 1', [`%${user.nombre}%`]);
      if (!socio) {
        return res.status(400).json({ error: 'No se encontró tu perfil de socio' });
      }
      finalSocioId = socio.id;
    } else if (!socio_id) {
      return res.status(400).json({ error: 'socio_id requerido' });
    }

    // Verificar cupo
    const ocupados = getOcupacionClase(clase_id);
    if (ocupados >= clase.cupo) {
      return res.status(409).json({ error: 'Cupo lleno' });
    }

    // Verificar si ya existe reserva
    const reservaExistente = get(
      'SELECT * FROM reservas WHERE clase_id = ? AND socio_id = ?',
      [clase_id, finalSocioId]
    );
    if (reservaExistente) {
      return res.status(409).json({ error: 'Ya tienes una reserva para esta clase' });
    }

    // Crear reserva
    const result = insert(
      `INSERT INTO reservas (clase_id, socio_id, estado) VALUES (?, ?, 'reservado')`,
      [clase_id, finalSocioId]
    );

    const nuevaReserva = get('SELECT * FROM reservas WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ data: nuevaReserva });
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
      const socio = get('SELECT * FROM socios WHERE nombre LIKE ? LIMIT 1', [`%${user.nombre}%`]);
      if (!socio || socio.id !== reserva.socio_id) {
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

