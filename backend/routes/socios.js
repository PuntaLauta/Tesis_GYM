const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Middleware para rutas que requieren admin/root
const requireAdmin = [requireAuth, requireRole('admin', 'root')];

// GET /api/socios - Listar (admin/root) o obtener propio (cliente)
router.get('/', requireAuth, (req, res) => {
  try {
    const user = req.session.user;
    
    if (user.rol === 'admin' || user.rol === 'root') {
      // Admin/root ven todos los socios
      const socios = query(`
        SELECT s.*, p.nombre as plan_nombre 
        FROM socios s 
        LEFT JOIN planes p ON s.plan_id = p.id
      `);
      res.json({ data: socios });
    } else {
      // Cliente ve solo su socio
      const socio = get(`
        SELECT s.*, p.nombre as plan_nombre 
        FROM socios s 
        LEFT JOIN planes p ON s.plan_id = p.id
        WHERE s.usuario_id = ?
      `, [user.id]);
      
      if (!socio) {
        return res.status(404).json({ error: 'No tienes un socio asociado' });
      }
      
      res.json({ data: [socio] });
    }
  } catch (error) {
    console.error('Error al listar socios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/socios/:id - Obtener socio (admin/root o propio)
router.get('/:id', requireAuth, (req, res) => {
  try {
    const user = req.session.user;
    const socio = get(`
      SELECT s.*, p.nombre as plan_nombre 
      FROM socios s 
      LEFT JOIN planes p ON s.plan_id = p.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    // Verificar permisos: admin/root pueden ver cualquier socio, cliente solo el suyo
    if (user.rol !== 'admin' && user.rol !== 'root') {
      if (socio.usuario_id !== user.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver este socio' });
      }
    }

    res.json({ data: socio });
  } catch (error) {
    console.error('Error al obtener socio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/socios - Crear (solo admin/root)
router.post('/', requireAdmin, (req, res) => {
  try {
    const { nombre, telefono, estado, plan_id, qr_token } = req.body;
    const crypto = require('crypto');

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    // Generar qr_token si no viene
    const token = qr_token || crypto.randomUUID();

    const result = insert(
      `INSERT INTO socios (nombre, telefono, estado, plan_id, qr_token) VALUES (?, ?, ?, ?, ?)`,
      [nombre, telefono || null, estado || 'activo', plan_id || null, token]
    );

    const nuevoSocio = get('SELECT * FROM socios WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ data: nuevoSocio });
  } catch (error) {
    console.error('Error al crear socio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/socios/:id - Editar (solo admin/root)
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { nombre, telefono, estado, plan_id } = req.body;

    const socio = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    run(
      `UPDATE socios SET nombre = ?, telefono = ?, estado = ?, plan_id = ? WHERE id = ?`,
      [
        nombre || socio.nombre,
        telefono !== undefined ? telefono : socio.telefono,
        estado || socio.estado,
        plan_id !== undefined ? plan_id : socio.plan_id,
        req.params.id
      ]
    );

    const socioActualizado = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    res.json({ data: socioActualizado });
  } catch (error) {
    console.error('Error al actualizar socio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/socios/:id - Eliminar (solo admin/root)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const socio = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    run('DELETE FROM socios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Socio eliminado' });
  } catch (error) {
    console.error('Error al eliminar socio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/socios/:id/qr.png - Obtener QR en PNG
// Permite acceso si es admin/root o si es el propio socio (cliente)
router.get('/:id/qr.png', requireAuth, async (req, res) => {
  try {
    const socio = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    // Verificar permisos: admin/root pueden ver cualquier QR, cliente solo el suyo
    const user = req.session.user;
    if (user.rol !== 'admin' && user.rol !== 'root') {
      // Si es cliente, verificar que el socio pertenece a este usuario
      if (socio.usuario_id !== user.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver este QR' });
      }
    }

    if (!socio.qr_token) {
      return res.status(400).json({ error: 'Socio sin token QR' });
    }

    const QRCode = require('qrcode');
    // El QR contiene el token, que luego se usa en /api/access/verify
    const verifyUrl = `${process.env.API_URL || 'http://localhost:3001'}/api/access/verify?token=${socio.qr_token}`;
    
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { type: 'png', width: 300 });
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-socio-${socio.id}.png"`);
    res.send(qrBuffer);
  } catch (error) {
    console.error('Error al generar QR:', error);
    res.status(500).json({ error: 'Error al generar QR' });
  }
});

// POST /api/socios/:id/qr/rotate - Regenerar QR token (solo admin/root)
router.post('/:id/qr/rotate', requireAdmin, (req, res) => {
  try {
    const socio = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const crypto = require('crypto');
    const nuevoToken = crypto.randomUUID();

    run('UPDATE socios SET qr_token = ? WHERE id = ?', [nuevoToken, req.params.id]);

    const socioActualizado = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    res.json({ data: socioActualizado, message: 'QR regenerado' });
  } catch (error) {
    console.error('Error al rotar QR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
