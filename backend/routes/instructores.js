const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/instructores - Listar instructores (admin/root)
router.get('/', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const instructores = query('SELECT * FROM instructores ORDER BY nombre');
    // Agregar usuario_id a cada instructor si existe
    const instructoresConUsuario = instructores.map(instructor => {
      const usuario = get('SELECT id FROM usuarios WHERE email = ? AND rol = ?', [instructor.email, 'instructor']);
      return {
        ...instructor,
        usuario_id: usuario ? usuario.id : null
      };
    });
    res.json({ data: instructoresConUsuario });
  } catch (error) {
    console.error('Error al listar instructores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/instructores/me - Actualizar perfil del instructor actual
router.put('/me', requireAuth, requireRole('instructor'), (req, res) => {
  try {
    const { email, telefono } = req.body;
    const instructorId = req.session.user.instructor_id;

    if (!instructorId) {
      return res.status(403).json({ error: 'No tienes un instructor asociado' });
    }

    const instructorExistente = get('SELECT * FROM instructores WHERE id = ?', [instructorId]);
    if (!instructorExistente) {
      return res.status(404).json({ error: 'Instructor no encontrado' });
    }

    // Verificar que el email no esté en uso por otro instructor
    if (email && email !== instructorExistente.email) {
      const emailExistente = get('SELECT id FROM instructores WHERE email = ? AND id != ?', [email, instructorId]);
      if (emailExistente) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    run(
      'UPDATE instructores SET email = ?, telefono = ? WHERE id = ?',
      [
        email || instructorExistente.email,
        telefono !== undefined ? telefono : instructorExistente.telefono,
        instructorId
      ]
    );

    const instructorActualizado = get('SELECT * FROM instructores WHERE id = ?', [instructorId]);
    res.json({ data: instructorActualizado });
  } catch (error) {
    console.error('Error al actualizar perfil del instructor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/instructores/:id - Obtener instructor por ID
router.get('/:id', requireAuth, requireRole('admin', 'root', 'instructor'), (req, res) => {
  try {
    const instructorId = parseInt(req.params.id);
    const instructor = get('SELECT * FROM instructores WHERE id = ?', [instructorId]);
    
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor no encontrado' });
    }

    // Si es instructor, solo puede ver su propio perfil
    if (req.session.user.rol === 'instructor' && req.session.user.instructor_id !== instructorId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este instructor' });
    }

    res.json({ data: instructor });
  } catch (error) {
    console.error('Error al obtener instructor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/instructores - Crear instructor (admin/root)
router.post('/', requireAuth, requireRole('admin', 'root'), async (req, res) => {
  try {
    const { nombre, email, telefono, activo, crear_usuario, password } = req.body;
    const bcrypt = require('bcrypt');

    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }

    // Verificar que el email no exista
    const emailExistente = get('SELECT id FROM instructores WHERE email = ?', [email]);
    if (emailExistente) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    // Crear instructor
    const result = insert(
      'INSERT INTO instructores (nombre, email, telefono, activo) VALUES (?, ?, ?, ?)',
      [nombre, email, telefono || null, activo !== undefined ? activo : 1]
    );

    const nuevoInstructor = get('SELECT * FROM instructores WHERE id = ?', [result.lastInsertRowid]);

    // Si se solicita crear usuario, crear también el usuario
    if (crear_usuario && password) {
      // Verificar que el email no exista en usuarios
      const usuarioExistente = get('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (usuarioExistente) {
        return res.status(400).json({ error: 'El email ya está en uso en usuarios' });
      }

      // Hashear contraseña
      const passHash = await bcrypt.hash(password, 10);
      
      // Crear usuario
      const usuarioResult = insert(
        'INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, passHash, 'instructor']
      );

      // Actualizar instructor con usuario_id si es necesario (aunque no lo tenemos en la tabla)
      // Por ahora, la relación se hace por email
    }

    res.status(201).json({ data: nuevoInstructor });
  } catch (error) {
    console.error('Error al crear instructor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/instructores/:id - Actualizar instructor (admin/root)
router.put('/:id', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const instructorId = parseInt(req.params.id);
    const { nombre, email, telefono, activo } = req.body;

    const instructorExistente = get('SELECT * FROM instructores WHERE id = ?', [instructorId]);
    if (!instructorExistente) {
      return res.status(404).json({ error: 'Instructor no encontrado' });
    }

    // Verificar que el email no esté en uso por otro instructor
    if (email && email !== instructorExistente.email) {
      const emailExistente = get('SELECT id FROM instructores WHERE email = ? AND id != ?', [email, instructorId]);
      if (emailExistente) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    run(
      'UPDATE instructores SET nombre = ?, email = ?, telefono = ?, activo = ? WHERE id = ?',
      [
        nombre || instructorExistente.nombre,
        email || instructorExistente.email,
        telefono !== undefined ? telefono : instructorExistente.telefono,
        activo !== undefined ? activo : instructorExistente.activo,
        instructorId
      ]
    );

    const instructorActualizado = get('SELECT * FROM instructores WHERE id = ?', [instructorId]);
    res.json({ data: instructorActualizado });
  } catch (error) {
    console.error('Error al actualizar instructor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/instructores/:id - Eliminar instructor (admin/root)
router.delete('/:id', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const instructorId = parseInt(req.params.id);
    
    const instructor = get('SELECT * FROM instructores WHERE id = ?', [instructorId]);
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor no encontrado' });
    }

    // Verificar si tiene clases asignadas
    const clasesAsignadas = query('SELECT COUNT(*) as count FROM clases WHERE instructor_id = ?', [instructorId]);
    if (clasesAsignadas && clasesAsignadas[0] && clasesAsignadas[0].count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un instructor con clases asignadas' });
    }

    run('DELETE FROM instructores WHERE id = ?', [instructorId]);
    res.json({ message: 'Instructor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar instructor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/instructores/:id/clases - Ver clases del instructor
router.get('/:id/clases', requireAuth, (req, res) => {
  try {
    const instructorId = parseInt(req.params.id);
    
    // Verificar permisos: instructor solo puede ver sus propias clases
    if (req.session.user.rol === 'instructor' && req.session.user.instructor_id !== instructorId) {
      return res.status(403).json({ error: 'No tienes permiso para ver estas clases' });
    }

    // Admin/root pueden ver cualquier instructor
    if (req.session.user.rol !== 'admin' && req.session.user.rol !== 'root' && req.session.user.rol !== 'instructor') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { desde, hasta, estado } = req.query;
    let sql = `
      SELECT c.*, tc.nombre as nombre, tc.descripcion as tipo_descripcion,
             i.nombre as instructor_nombre
      FROM clases c
      LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id
      LEFT JOIN instructores i ON c.instructor_id = i.id
      WHERE c.instructor_id = ?
    `;
    const params = [instructorId];

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

    sql += ' ORDER BY c.fecha, c.hora_inicio';

    const clases = query(sql, params);
    
    // Agregar ocupación a cada clase
    const clasesConOcupacion = clases.map(clase => {
      const ocupacion = get(`
        SELECT 
          COUNT(*) as ocupados,
          c.cupo,
          ROUND(COUNT(*) * 100.0 / c.cupo, 2) as porcentaje
        FROM reservas r
        JOIN clases c ON r.clase_id = c.id
        WHERE r.clase_id = ? AND r.estado != 'cancelado'
      `, [clase.id]);
      
      return {
        ...clase,
        ocupados: ocupacion ? ocupacion.ocupados : 0,
        porcentaje: ocupacion ? ocupacion.porcentaje : 0
      };
    });

    res.json({ data: clasesConOcupacion });
  } catch (error) {
    console.error('Error al obtener clases del instructor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/instructores/:id/clases/:clase_id/socios - Ver socios de una clase específica
router.get('/:id/clases/:clase_id/socios', requireAuth, (req, res) => {
  try {
    const instructorId = parseInt(req.params.id);
    const claseId = parseInt(req.params.clase_id);

    // Verificar que la clase pertenezca al instructor
    const clase = get('SELECT * FROM clases WHERE id = ? AND instructor_id = ?', [claseId, instructorId]);
    if (!clase) {
      return res.status(404).json({ error: 'Clase no encontrada o no pertenece a este instructor' });
    }

    // Verificar permisos: instructor solo puede ver sus propias clases
    if (req.session.user.rol === 'instructor' && req.session.user.instructor_id !== instructorId) {
      return res.status(403).json({ error: 'No tienes permiso para ver estos socios' });
    }

    // Admin/root pueden ver cualquier instructor
    if (req.session.user.rol !== 'admin' && req.session.user.rol !== 'root' && req.session.user.rol !== 'instructor') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const reservas = query(`
      SELECT 
        r.*,
        s.nombre as socio_nombre,
        s.documento as socio_documento,
        s.telefono as socio_telefono,
        s.estado as socio_estado
      FROM reservas r
      JOIN socios s ON r.socio_id = s.id
      WHERE r.clase_id = ? AND r.estado != 'cancelado'
      ORDER BY s.nombre
    `, [claseId]);

    res.json({ data: reservas });
  } catch (error) {
    console.error('Error al obtener socios de la clase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

