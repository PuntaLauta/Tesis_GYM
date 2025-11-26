const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const router = express.Router();

// Todas las rutas requieren autenticación y rol root
router.use(requireAuth);
router.use(requireRole('root'));

// GET /api/usuarios - Listar todos los usuarios (solo root)
router.get('/', (req, res) => {
  try {
    const usuarios = query(`
      SELECT id, nombre, email, rol 
      FROM usuarios 
      WHERE rol IN ('admin', 'root')
      ORDER BY rol DESC, nombre ASC
    `);
    res.json({ data: usuarios });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/usuarios/:id - Obtener usuario por ID
router.get('/:id', (req, res) => {
  try {
    const usuario = get('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [req.params.id]);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Solo permitir ver usuarios admin/root
    if (usuario.rol !== 'admin' && usuario.rol !== 'root') {
      return res.status(403).json({ error: 'Solo se pueden gestionar usuarios admin y root' });
    }

    res.json({ data: usuario });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/usuarios - Crear usuario admin (solo root)
router.post('/', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Validar rol
    const rolFinal = rol === 'root' ? 'root' : 'admin';
    
    // Verificar que el email no exista
    const usuarioExistente = get('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    // Hashear contraseña
    const passHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = insert(
      `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
      [nombre, email, passHash, rolFinal]
    );

    const nuevoUsuario = get('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ data: nuevoUsuario });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/:id - Editar usuario admin (solo root)
router.put('/:id', async (req, res) => {
  try {
    const { nombre, email, rol } = req.body;
    const usuarioId = parseInt(req.params.id);
    const currentUser = req.session.user;

    // No permitir auto-edición del rol
    if (usuarioId === currentUser.id && rol && rol !== currentUser.rol) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const usuario = get('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Solo permitir editar usuarios admin/root
    if (usuario.rol !== 'admin' && usuario.rol !== 'root') {
      return res.status(403).json({ error: 'Solo se pueden gestionar usuarios admin y root' });
    }

    // Verificar email único si se está cambiando
    if (email && email !== usuario.email) {
      const emailExistente = get('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, usuarioId]);
      if (emailExistente) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    // Validar rol
    const rolFinal = rol === 'root' ? 'root' : (rol === 'admin' ? 'admin' : usuario.rol);

    // Actualizar usuario
    run(
      `UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?`,
      [nombre || usuario.nombre, email || usuario.email, rolFinal, usuarioId]
    );

    const usuarioActualizado = get('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [usuarioId]);
    res.json({ data: usuarioActualizado });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/:id/password - Cambiar contraseña de admin (solo root)
router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    const usuarioId = parseInt(req.params.id);

    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const usuario = get('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Solo permitir cambiar contraseña de usuarios admin/root
    if (usuario.rol !== 'admin' && usuario.rol !== 'root') {
      return res.status(403).json({ error: 'Solo se pueden gestionar usuarios admin y root' });
    }

    // Hashear nueva contraseña
    const passHash = await bcrypt.hash(password, 10);

    // Actualizar contraseña
    run('UPDATE usuarios SET pass_hash = ? WHERE id = ?', [passHash, usuarioId]);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/usuarios/:id - Eliminar usuario admin (solo root)
router.delete('/:id', (req, res) => {
  try {
    const usuarioId = parseInt(req.params.id);
    const currentUser = req.session.user;

    // No permitir auto-eliminación
    if (usuarioId === currentUser.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const usuario = get('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Solo permitir eliminar usuarios admin/root
    if (usuario.rol !== 'admin' && usuario.rol !== 'root') {
      return res.status(403).json({ error: 'Solo se pueden gestionar usuarios admin y root' });
    }

    // Verificar que no sea el último root
    if (usuario.rol === 'root') {
      const otrosRoots = query('SELECT id FROM usuarios WHERE rol = ? AND id != ?', ['root', usuarioId]);
      if (otrosRoots.length === 0) {
        return res.status(400).json({ error: 'No se puede eliminar el último usuario root' });
      }
    }

    // Verificar que no sea el último admin/root
    const totalAdmins = query('SELECT COUNT(*) as total FROM usuarios WHERE rol IN (?, ?)', ['admin', 'root']);
    if (totalAdmins[0].total <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar el último administrador' });
    }

    // Eliminar usuario
    run('DELETE FROM usuarios WHERE id = ?', [usuarioId]);

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

