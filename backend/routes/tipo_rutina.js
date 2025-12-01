const express = require('express');
const { query } = require('../db/database');
const router = express.Router();

// GET /api/tipo-rutina - Listar todos los tipos de rutina (público)
router.get('/', (req, res) => {
  try {
    const tipos = query('SELECT * FROM tipo_rutina ORDER BY nombre');
    res.json({ data: tipos });
  } catch (error) {
    console.error('Error al listar tipos de rutina:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

