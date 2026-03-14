const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const router = express.Router();

// Todas las rutas requieren autenticación y rol root
router.use(requireAuth);
router.use(requireRole('root'));

// GET /api/usuarios - Listar todos los usuarios (solo root); nombre/email desde usuarios, estado desde admins/roots
router.get('/', (req, res) => {
  try {
    const usuarios = query(`
      SELECT u.id, u.nombre, u.email, u.rol,
             a.estado AS estado_admin, r.estado AS estado_root
      FROM usuarios u
      LEFT JOIN admins a ON a.usuario_id = u.id
      LEFT JOIN roots r ON r.usuario_id = u.id
      WHERE u.rol IN ('admin', 'root', 'instructor')
      ORDER BY u.rol DESC, u.nombre ASC
    `);
    const data = usuarios.map(u => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      estado: u.estado_admin != null ? u.estado_admin : u.estado_root,
    }));
    res.json({ data });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/usuarios/:id - Obtener usuario por ID (con estado si es admin/root)
router.get('/:id', (req, res) => {
  try {
    const usuario = get(`
      SELECT u.id, u.nombre, u.email, u.rol, a.estado AS estado_admin, r.estado AS estado_root
      FROM usuarios u
      LEFT JOIN admins a ON a.usuario_id = u.id
      LEFT JOIN roots r ON r.usuario_id = u.id
      WHERE u.id = ?
    `, [req.params.id]);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.rol !== 'admin' && usuario.rol !== 'root' && usuario.rol !== 'instructor') {
      return res.status(403).json({ error: 'Solo se pueden gestionar usuarios admin, root e instructor' });
    }

    const data = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado_admin != null ? usuario.estado_admin : usuario.estado_root,
    };
    res.json({ data });
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
    const rolFinal = rol === 'root' ? 'root' : (rol === 'instructor' ? 'instructor' : 'admin');
    
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
    const newId = result.lastInsertRowid;

    // Insertar en admins o roots según rol (solo usuario_id y estado = 1)
    if (rolFinal === 'admin') {
      insert('INSERT INTO admins (usuario_id, estado) VALUES (?, 1)', [newId]);
    } else if (rolFinal === 'root') {
      insert('INSERT INTO roots (usuario_id, estado) VALUES (?, 1)', [newId]);
    }

    const nuevoUsuario = get('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [newId]);
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

    // Solo permitir editar usuarios admin/root/instructor
    if (usuario.rol !== 'admin' && usuario.rol !== 'root' && usuario.rol !== 'instructor') {
      return res.status(403).json({ error: 'Solo se pueden gestionar usuarios admin, root e instructor' });
    }

    // Verificar email único si se está cambiando
    if (email && email !== usuario.email) {
      const emailExistente = get('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, usuarioId]);
      if (emailExistente) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
    }

    // Validar rol
    const rolFinal = rol === 'root' ? 'root' : (rol === 'instructor' ? 'instructor' : (rol === 'admin' ? 'admin' : usuario.rol));

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

    // Solo permitir cambiar contraseña de usuarios admin/root/instructor
    if (usuario.rol !== 'admin' && usuario.rol !== 'root' && usuario.rol !== 'instructor') {
      return res.status(403).json({ error: 'Solo se pueden gestionar usuarios admin, root e instructor' });
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

    // Solo permitir eliminar usuarios admin/root/instructor
    if (usuario.rol !== 'admin' && usuario.rol !== 'root' && usuario.rol !== 'instructor') {
      return res.status(403).json({ error: 'Solo se pueden gestionar usuarios admin, root e instructor' });
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

    // Eliminar filas en admins/roots antes del usuario (integridad referencial)
    run('DELETE FROM admins WHERE usuario_id = ?', [usuarioId]);
    run('DELETE FROM roots WHERE usuario_id = ?', [usuarioId]);
    run('DELETE FROM usuarios WHERE id = ?', [usuarioId]);

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/:id/estado - Actualizar estado activo/inactivo de admin o root (solo root)
router.put('/:id/estado', (req, res) => {
  try {
    const usuarioId = parseInt(req.params.id, 10);
    const { estado } = req.body;
    const currentUser = req.session.user;

    if (estado !== 0 && estado !== 1) {
      return res.status(400).json({ error: 'El estado debe ser 0 (inactivo) o 1 (activo)' });
    }

    const usuario = get('SELECT id, rol FROM usuarios WHERE id = ?', [usuarioId]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.rol !== 'admin' && usuario.rol !== 'root') {
      return res.status(400).json({ error: 'Solo se puede cambiar el estado de administradores o root' });
    }

    if (usuarioId === currentUser.id && usuario.rol === 'root') {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta root' });
    }

    if (usuario.rol === 'admin') {
      run('UPDATE admins SET estado = ? WHERE usuario_id = ?', [estado, usuarioId]);
    } else {
      run('UPDATE roots SET estado = ? WHERE usuario_id = ?', [estado, usuarioId]);
    }

    const actualizado = get(`
      SELECT u.id, u.nombre, u.email, u.rol, a.estado AS estado_admin, r.estado AS estado_root
      FROM usuarios u
      LEFT JOIN admins a ON a.usuario_id = u.id
      LEFT JOIN roots r ON r.usuario_id = u.id
      WHERE u.id = ?
    `, [usuarioId]);

    res.json({
      data: {
        id: actualizado.id,
        nombre: actualizado.nombre,
        email: actualizado.email,
        rol: actualizado.rol,
        estado: actualizado.estado_admin != null ? actualizado.estado_admin : actualizado.estado_root,
      },
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

