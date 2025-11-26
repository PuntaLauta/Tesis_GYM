const express = require('express');
const { insert, get } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isSocioActivo, isSocioActivoByToken } = require('../models/helpers');
const router = express.Router();

// POST /api/accesos - Registrar acceso (admin/root)
router.post('/', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const { socio_id, documento } = req.body;

    if (!socio_id && !documento) {
      return res.status(400).json({ error: 'socio_id o documento requerido' });
    }

    // Si se proporciona documento, buscar el socio por documento
    let socioIdFinal = socio_id;
    if (documento && !socio_id) {
      const socio = get('SELECT id FROM socios WHERE documento = ?', [documento]);
      if (!socio) {
        return res.status(404).json({ error: 'Socio no encontrado con ese documento' });
      }
      socioIdFinal = socio.id;
    }

    // Verificar si el socio está activo
    const validacion = isSocioActivo(socioIdFinal);

    // Registrar acceso
    const result = insert(
      `INSERT INTO accesos (socio_id, permitido, motivo) VALUES (?, ?, ?)`,
      [socioIdFinal, validacion.activo ? 1 : 0, validacion.motivo]
    );

    res.json({
      data: {
        id: result.lastInsertRowid,
        permitido: validacion.activo,
        motivo: validacion.motivo,
      },
    });
  } catch (error) {
    console.error('Error al registrar acceso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/access/verify?token=... - Verificar por token (admin/root)
router.get('/verify', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'token requerido' });
    }

    // Buscar socio por token
    const socio = get('SELECT id, nombre, documento FROM socios WHERE qr_token = ?', [token]);
    
    if (!socio) {
      return res.status(404).json({ error: 'Token no válido' });
    }

    // Verificar estado
    const validacion = isSocioActivoByToken(token);

    res.json({
      data: {
        socio: {
          id: socio.id,
          nombre: socio.nombre,
          documento: socio.documento || String(socio.id).padStart(4, '0'),
        },
        activo: validacion.activo,
        motivo: validacion.motivo,
      },
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/access/enter - Registrar acceso por token (admin/root)
router.post('/enter', requireAuth, requireRole('admin', 'root'), (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'token requerido' });
    }

    // Buscar socio por token
    const socio = get('SELECT id FROM socios WHERE qr_token = ?', [token]);
    
    if (!socio) {
      return res.status(404).json({ error: 'Token no válido' });
    }

    // Verificar estado
    const validacion = isSocioActivoByToken(token);

    // Registrar acceso
    const result = insert(
      `INSERT INTO accesos (socio_id, permitido, motivo) VALUES (?, ?, ?)`,
      [socio.id, validacion.activo ? 1 : 0, validacion.motivo]
    );

    res.json({
      data: {
        id: result.lastInsertRowid,
        permitido: validacion.activo,
        motivo: validacion.motivo,
      },
    });
  } catch (error) {
    console.error('Error al registrar acceso por token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

