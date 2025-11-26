const express = require('express');
const bcrypt = require('bcrypt');
const { get, run, insert } = require('../db/database');
const router = express.Router();

// Función para normalizar respuestas: minúsculas, sin espacios, sin tildes
function normalizarRespuesta(respuesta) {
  return respuesta
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Eliminar tildes y diacríticos
}

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

    // Si es cliente, obtener su socio asignado
    let socioId = null;
    if (user.rol === 'cliente') {
      const socioExistente = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
      if (socioExistente) {
        socioId = socioExistente.id;
      }
      // No asignar automáticamente socios sin usuario - deben estar correctamente asociados desde el seed
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

// PUT /auth/me/password - Cambiar contraseña (cliente o admin)
router.put('/me/password', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = get('SELECT * FROM usuarios WHERE id = ?', [req.session.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validar si es admin o root (o email termina en @demo.com)
    if (user.rol === 'admin' || user.rol === 'root' || user.email.endsWith('@demo.com') || user.email.endsWith('@admin.com')) {
      return res.status(403).json({ 
        error: 'Para cambiar tu contraseña, contactate con los desarrolladores' 
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva contraseña requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(currentPassword, user.pass_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hashear nueva contraseña
    const newHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    run('UPDATE usuarios SET pass_hash = ? WHERE id = ?', [newHash, user.id]);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/security-question - Configurar pregunta de seguridad (requiere autenticación)
router.post('/security-question', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { pregunta, respuesta } = req.body;

    if (!pregunta || !respuesta) {
      return res.status(400).json({ error: 'Pregunta y respuesta requeridas' });
    }

    if (respuesta.trim().length < 2) {
      return res.status(400).json({ error: 'La respuesta debe tener al menos 2 caracteres' });
    }

    // Hashear respuesta (normalizar: minúsculas, sin espacios, sin tildes)
    const respuestaNormalizada = normalizarRespuesta(respuesta);
    const respuestaHash = await bcrypt.hash(respuestaNormalizada, 10);

    // Verificar si ya existe una pregunta de seguridad
    const preguntaExistente = get('SELECT id FROM preguntas_seguridad WHERE usuario_id = ?', [req.session.user.id]);

    if (preguntaExistente) {
      // Actualizar pregunta existente
      run('UPDATE preguntas_seguridad SET pregunta = ?, respuesta_hash = ? WHERE usuario_id = ?', 
        [pregunta, respuestaHash, req.session.user.id]);
      res.json({ message: 'Pregunta de seguridad actualizada correctamente' });
    } else {
      // Crear nueva pregunta
      insert('INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)', 
        [req.session.user.id, pregunta, respuestaHash]);
      res.json({ message: 'Pregunta de seguridad configurada correctamente' });
    }
  } catch (error) {
    console.error('Error al configurar pregunta de seguridad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /auth/security-question/:email - Obtener pregunta de seguridad por email (público, para recuperación)
router.get('/security-question/:email', (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Buscar usuario por email
    const user = get('SELECT id, rol FROM usuarios WHERE email = ?', [email]);
    if (!user) {
      // No revelar si el email existe o no por seguridad
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validar si es admin o root (o email termina en @demo.com o @admin.com)
    if (user.rol === 'admin' || user.rol === 'root' || email.endsWith('@demo.com') || email.endsWith('@admin.com')) {
      return res.status(403).json({ 
        error: 'Para cambiar tu contraseña, contactate con los desarrolladores' 
      });
    }

    // Buscar pregunta de seguridad
    const preguntaSeguridad = get('SELECT pregunta FROM preguntas_seguridad WHERE usuario_id = ?', [user.id]);
    if (!preguntaSeguridad) {
      return res.status(404).json({ error: 'No se ha configurado una pregunta de seguridad para este usuario' });
    }

    res.json({ pregunta: preguntaSeguridad.pregunta });
  } catch (error) {
    console.error('Error al obtener pregunta de seguridad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/verify-security-answer - Verificar respuesta de pregunta de seguridad (sin cambiar contraseña)
router.post('/verify-security-answer', async (req, res) => {
  try {
    const { email, respuesta } = req.body;

    if (!email || !respuesta) {
      return res.status(400).json({ error: 'Email y respuesta requeridos' });
    }

    // Buscar usuario por email
    const user = get('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (!user) {
      // No revelar si el email existe o no por seguridad
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Buscar pregunta de seguridad
    const preguntaSeguridad = get('SELECT respuesta_hash FROM preguntas_seguridad WHERE usuario_id = ?', [user.id]);
    if (!preguntaSeguridad) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar respuesta (normalizar: minúsculas, sin espacios, sin tildes)
    const respuestaNormalizada = normalizarRespuesta(respuesta);
    const isValid = await bcrypt.compare(respuestaNormalizada, preguntaSeguridad.respuesta_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Respuesta incorrecta' });
    }

    res.json({ message: 'Respuesta correcta' });
  } catch (error) {
    console.error('Error al verificar respuesta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /auth/recover-password - Recuperar contraseña usando pregunta de seguridad
router.post('/recover-password', async (req, res) => {
  try {
    const { email, respuesta, newPassword } = req.body;

    if (!email || !respuesta || !newPassword) {
      return res.status(400).json({ error: 'Email, respuesta y nueva contraseña requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Buscar usuario por email
    const user = get('SELECT id, rol FROM usuarios WHERE email = ?', [email]);
    if (!user) {
      // No revelar si el email existe o no por seguridad
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Validar si es admin o root (o email termina en @demo.com o @admin.com)
    if (user.rol === 'admin' || user.rol === 'root' || email.endsWith('@demo.com') || email.endsWith('@admin.com')) {
      return res.status(403).json({ 
        error: 'Para cambiar tu contraseña, contactate con los desarrolladores' 
      });
    }

    // Buscar pregunta de seguridad
    const preguntaSeguridad = get('SELECT respuesta_hash FROM preguntas_seguridad WHERE usuario_id = ?', [user.id]);
    if (!preguntaSeguridad) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar respuesta (normalizar: minúsculas, sin espacios, sin tildes)
    const respuestaNormalizada = normalizarRespuesta(respuesta);
    const isValid = await bcrypt.compare(respuestaNormalizada, preguntaSeguridad.respuesta_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Respuesta incorrecta' });
    }

    // Hashear nueva contraseña
    const newHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    run('UPDATE usuarios SET pass_hash = ? WHERE id = ?', [newHash, user.id]);

    res.json({ message: 'Contraseña recuperada correctamente' });
  } catch (error) {
    console.error('Error al recuperar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /auth/me/security-question - Obtener pregunta de seguridad del usuario autenticado
router.get('/me/security-question', (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const preguntaSeguridad = get('SELECT pregunta FROM preguntas_seguridad WHERE usuario_id = ?', [req.session.user.id]);
    
    if (!preguntaSeguridad) {
      return res.json({ pregunta: null });
    }

    res.json({ pregunta: preguntaSeguridad.pregunta });
  } catch (error) {
    console.error('Error al obtener pregunta de seguridad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
