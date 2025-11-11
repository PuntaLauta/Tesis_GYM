const express = require('express');
const bcrypt = require('bcrypt');
const { get, run } = require('../db/database');
const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario
    const user = get('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.pass_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Si es cliente, asegurar que tenga un socio asignado
    let socioId = null;
    if (user.rol === 'cliente') {
      const socioExistente = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
      if (socioExistente) {
        socioId = socioExistente.id;
      } else {
        const socioDisponible = get('SELECT id FROM socios WHERE usuario_id IS NULL ORDER BY id LIMIT 1');
        if (socioDisponible) {
          run('UPDATE socios SET usuario_id = ? WHERE id = ?', [user.id, socioDisponible.id]);
          socioId = socioDisponible.id;
        }
      }
    }

    // Guardar en sesión
    req.session.user = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      socio_id: socioId,
    };

    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        socio_id: socioId,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesión cerrada' });
  });
});

// GET /auth/me
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

module.exports = router;
