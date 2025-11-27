const express = require('express');
const { query } = require('../db/database');
const router = express.Router();

// GET /api/tipo-clase - Listar todos los tipos de clase (público)
router.get('/', (req, res) => {
  try {
    const tipos = query('SELECT * FROM tipo_clase ORDER BY nombre');
    res.json({ data: tipos });
  } catch (error) {
    console.error('Error al listar tipos de clase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

