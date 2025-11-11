const express = require('express');
const { query, get, insert } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Todas las rutas requieren autenticación y rol admin o root
router.use(requireAuth);
router.use(requireRole('admin', 'root'));

// GET /api/pagos
router.get('/', (req, res) => {
  try {
    const pagos = query(`
      SELECT p.*, s.nombre as socio_nombre 
      FROM pagos p 
      LEFT JOIN socios s ON p.socio_id = s.id
      ORDER BY p.fecha DESC
    `);
    res.json({ data: pagos });
  } catch (error) {
    console.error('Error al listar pagos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/pagos/:id
router.get('/:id', (req, res) => {
  try {
    const pago = get(`
      SELECT p.*, s.nombre as socio_nombre 
      FROM pagos p 
      LEFT JOIN socios s ON p.socio_id = s.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    res.json({ data: pago });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/pagos
router.post('/', (req, res) => {
  try {
    const { socio_id, monto } = req.body;

    if (!socio_id || !monto) {
      return res.status(400).json({ error: 'Socio ID y monto requeridos' });
    }

    // Verificar que el socio existe
    const socio = get('SELECT * FROM socios WHERE id = ?', [socio_id]);
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const result = insert(
      `INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, datetime('now'))`,
      [socio_id, monto]
    );

    const nuevoPago = get(`
      SELECT p.*, s.nombre as socio_nombre 
      FROM pagos p 
      LEFT JOIN socios s ON p.socio_id = s.id
      WHERE p.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({ data: nuevoPago });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
