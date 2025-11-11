const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Todas las rutas requieren autenticación y rol admin o root
router.use(requireAuth);
router.use(requireRole('admin', 'root'));

// GET /api/planes
router.get('/', (req, res) => {
  try {
    const planes = query('SELECT * FROM planes');
    res.json({ data: planes });
  } catch (error) {
    console.error('Error al listar planes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/planes/:id
router.get('/:id', (req, res) => {
  try {
    const plan = get('SELECT * FROM planes WHERE id = ?', [req.params.id]);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }
    res.json({ data: plan });
  } catch (error) {
    console.error('Error al obtener plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/planes
router.post('/', (req, res) => {
  try {
    const { nombre, duracion, precio } = req.body;

    if (!nombre || !duracion || !precio) {
      return res.status(400).json({ error: 'Nombre, duración y precio requeridos' });
    }

    const result = insert(
      `INSERT INTO planes (nombre, duracion, precio) VALUES (?, ?, ?)`,
      [nombre, duracion, precio]
    );

    const nuevoPlan = get('SELECT * FROM planes WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ data: nuevoPlan });
  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/planes/:id
router.put('/:id', (req, res) => {
  try {
    const { nombre, duracion, precio } = req.body;

    const plan = get('SELECT * FROM planes WHERE id = ?', [req.params.id]);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    run(
      `UPDATE planes SET nombre = ?, duracion = ?, precio = ? WHERE id = ?`,
      [nombre || plan.nombre, duracion || plan.duracion, precio || plan.precio, req.params.id]
    );

    const planActualizado = get('SELECT * FROM planes WHERE id = ?', [req.params.id]);
    res.json({ data: planActualizado });
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/planes/:id
router.delete('/:id', (req, res) => {
  try {
    const plan = get('SELECT * FROM planes WHERE id = ?', [req.params.id]);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    run('DELETE FROM planes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Plan eliminado' });
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
