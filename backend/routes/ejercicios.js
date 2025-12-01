const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/ejercicios/favoritos - Listar ejercicios favoritos del socio
router.get('/favoritos', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    const favoritos = query(
      `SELECT id, nombre_ejercicio, descripcion, musculos, fecha_guardado
       FROM ejercicios_favoritos
       WHERE socio_id = ?
       ORDER BY fecha_guardado DESC`,
      [socio.id]
    );

    res.json({ data: favoritos });
  } catch (error) {
    console.error('Error al listar ejercicios favoritos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/ejercicios/favoritos - Agregar ejercicio a favoritos
router.post('/favoritos', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { nombre_ejercicio, descripcion, musculos } = req.body;

    if (!nombre_ejercicio || !nombre_ejercicio.trim()) {
      return res.status(400).json({ error: 'El nombre del ejercicio es requerido' });
    }

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    // Validar que musculos sea un JSON válido si se proporciona
    let musculosJson = null;
    if (musculos) {
      try {
        musculosJson = typeof musculos === 'string' ? musculos : JSON.stringify(musculos);
        JSON.parse(musculosJson); // Validar que sea JSON válido
      } catch (e) {
        return res.status(400).json({ error: 'El formato de músculos no es válido (debe ser JSON)' });
      }
    }

    // Verificar si ya existe
    const existente = get(
      'SELECT id FROM ejercicios_favoritos WHERE socio_id = ? AND nombre_ejercicio = ?',
      [socio.id, nombre_ejercicio.trim()]
    );

    if (existente) {
      return res.status(409).json({ error: 'Este ejercicio ya está en tus favoritos' });
    }

    const result = insert(
      `INSERT INTO ejercicios_favoritos (socio_id, nombre_ejercicio, descripcion, musculos)
       VALUES (?, ?, ?, ?)`,
      [
        socio.id,
        nombre_ejercicio.trim(),
        descripcion || null,
        musculosJson,
      ]
    );

    const nuevoFavorito = get('SELECT * FROM ejercicios_favoritos WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ data: nuevoFavorito });
  } catch (error) {
    console.error('Error al agregar ejercicio favorito:', error);
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Este ejercicio ya está en tus favoritos' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/ejercicios/favoritos/:id - Eliminar ejercicio de favoritos
router.delete('/favoritos/:id', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    // Verificar que el ejercicio favorito pertenezca al socio
    const favorito = get(
      'SELECT id FROM ejercicios_favoritos WHERE id = ? AND socio_id = ?',
      [id, socio.id]
    );

    if (!favorito) {
      return res.status(404).json({ error: 'Ejercicio favorito no encontrado' });
    }

    run('DELETE FROM ejercicios_favoritos WHERE id = ?', [id]);

    res.json({ message: 'Ejercicio eliminado de favoritos correctamente' });
  } catch (error) {
    console.error('Error al eliminar ejercicio favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;


