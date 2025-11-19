const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Middleware para rutas que requieren admin/root
const requireAdmin = [requireAuth, requireRole('admin', 'root')];

// GET /api/socios - Listar (admin/root) o obtener propio (cliente)
router.get('/', requireAuth, (req, res) => {
  try {
    const user = req.session.user;
    
    if (user.rol === 'admin' || user.rol === 'root') {
      // Admin/root ven todos los socios
      const socios = query(`
        SELECT s.*, p.nombre as plan_nombre 
        FROM socios s 
        LEFT JOIN planes p ON s.plan_id = p.id
      `);
      res.json({ data: socios });
    } else {
      // Cliente ve solo su socio
      const socio = get(`
        SELECT s.*, p.nombre as plan_nombre, p.duracion as plan_duracion, p.precio as plan_precio
        FROM socios s 
        LEFT JOIN planes p ON s.plan_id = p.id
        WHERE s.usuario_id = ?
      `, [user.id]);
      
      if (!socio) {
        return res.status(404).json({ error: 'No tienes un socio asociado' });
      }
      
      // Obtener último pago para calcular vencimiento
      const ultimoPago = get(`
        SELECT fecha 
        FROM pagos 
        WHERE socio_id = ? 
        ORDER BY fecha DESC 
        LIMIT 1
      `, [socio.id]);
      
      if (ultimoPago && socio.plan_duracion) {
        const fechaPago = new Date(ultimoPago.fecha);
        const fechaVencimiento = new Date(fechaPago);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + socio.plan_duracion);
        socio.fecha_vencimiento = fechaVencimiento.toISOString().split('T')[0];
      }
      
      res.json({ data: [socio] });
    }
  } catch (error) {
    console.error('Error al listar socios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/socios/:id - Obtener socio (admin/root o propio)
router.get('/:id', requireAuth, (req, res) => {
  try {
    const user = req.session.user;
    const socio = get(`
      SELECT s.*, p.nombre as plan_nombre 
      FROM socios s 
      LEFT JOIN planes p ON s.plan_id = p.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    // Verificar permisos: admin/root pueden ver cualquier socio, cliente solo el suyo
    if (user.rol !== 'admin' && user.rol !== 'root') {
      if (socio.usuario_id !== user.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver este socio' });
      }
    }

    res.json({ data: socio });
  } catch (error) {
    console.error('Error al obtener socio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/socios - Crear (solo admin/root)
router.post('/', requireAdmin, (req, res) => {
  try {
    const { nombre, telefono, estado, plan_id, qr_token } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    // Generar qr_token de 6 dígitos si no viene
    const token = qr_token || generarToken6Digitos();

    const result = insert(
      `INSERT INTO socios (nombre, telefono, estado, plan_id, qr_token) VALUES (?, ?, ?, ?, ?)`,
      [nombre, telefono || null, estado || 'activo', plan_id || null, token]
    );

    const nuevoSocio = get('SELECT * FROM socios WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ data: nuevoSocio });
  } catch (error) {
    console.error('Error al crear socio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/socios/:id - Editar (admin/root pueden editar todo, cliente solo su perfil)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const user = req.session.user;
    const { nombre, telefono, estado, plan_id, email } = req.body;

    const socio = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    // Verificar permisos: cliente solo puede editar su propio perfil (telefono)
    if (user.rol === 'cliente') {
      if (socio.usuario_id !== user.id) {
        return res.status(403).json({ error: 'No tienes permiso para editar este socio' });
      }
      // Cliente solo puede editar teléfono
      run('UPDATE socios SET telefono = ? WHERE id = ?', [telefono !== undefined ? telefono : socio.telefono, req.params.id]);
      
      // Si también viene email, actualizar en usuarios
      if (email) {
        run('UPDATE usuarios SET email = ? WHERE id = ?', [email, user.id]);
      }
    } else {
      // Admin/root pueden editar todo
      run(
        `UPDATE socios SET nombre = ?, telefono = ?, estado = ?, plan_id = ? WHERE id = ?`,
        [
          nombre || socio.nombre,
          telefono !== undefined ? telefono : socio.telefono,
          estado || socio.estado,
          plan_id !== undefined ? plan_id : socio.plan_id,
          req.params.id
        ]
      );
    }

    const socioActualizado = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    res.json({ data: socioActualizado });
  } catch (error) {
    console.error('Error al actualizar socio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/socios/:id - Eliminar (solo admin/root)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const socio = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    run('DELETE FROM socios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Socio eliminado' });
  } catch (error) {
    console.error('Error al eliminar socio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función helper para generar token de 6 dígitos único
function generarToken6Digitos() {
  const { query } = require('../db/database');
  let token;
  let intentos = 0;
  const maxIntentos = 100;
  
  do {
    // Generar número aleatorio de 6 dígitos (100000 a 999999)
    token = String(Math.floor(100000 + Math.random() * 900000));
    const existente = query('SELECT id FROM socios WHERE qr_token = ?', [token]);
    if (existente.length === 0) {
      return token;
    }
    intentos++;
  } while (intentos < maxIntentos);
  
  // Si después de 100 intentos no hay token único, usar timestamp
  return String(Date.now()).slice(-6);
}

// Función para eliminar tildes de un texto
function eliminarTildes(texto) {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// GET /api/socios/:id/qr.png - Obtener QR en PNG
// Permite acceso si es admin/root o si es el propio socio (cliente)
router.get('/:id/qr.png', requireAuth, async (req, res) => {
  try {
    const socio = get(`
      SELECT s.*, p.nombre as plan_nombre 
      FROM socios s 
      LEFT JOIN planes p ON s.plan_id = p.id 
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    // Verificar permisos: admin/root pueden ver cualquier QR, cliente solo el suyo
    const user = req.session.user;
    if (user.rol !== 'admin' && user.rol !== 'root') {
      // Si es cliente, verificar que el socio pertenece a este usuario
      if (socio.usuario_id !== user.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver este QR' });
      }
    }

    if (!socio.qr_token) {
      return res.status(400).json({ error: 'Socio sin token QR' });
    }

    const QRCode = require('qrcode');
    
    // Formatear ID del socio (4 dígitos)
    const socioIdFormateado = String(socio.id).padStart(4, '0');
    
    // Eliminar tildes del nombre del socio
    const nombreSinTildes = eliminarTildes(socio.nombre);
    
    // Crear contenido del QR con información visible (sin tildes para evitar problemas de caracteres)
    const qrContent = `SOCIO: ${nombreSinTildes}
ID: ${socioIdFormateado}
Estado: ${socio.estado.toUpperCase()}
Codigo Token: ${socio.qr_token}
URL: Esperando despliegue online`;
    
    const qrBuffer = await QRCode.toBuffer(qrContent, { 
      type: 'png', 
      width: 300,
      errorCorrectionLevel: 'M'
    });
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-socio-${socio.id}.png"`);
    res.send(qrBuffer);
  } catch (error) {
    console.error('Error al generar QR:', error);
    res.status(500).json({ error: 'Error al generar QR' });
  }
});

// POST /api/socios/:id/qr/rotate - Regenerar QR token (solo admin/root)
router.post('/:id/qr/rotate', requireAdmin, (req, res) => {
  try {
    const socio = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const nuevoToken = generarToken6Digitos();

    run('UPDATE socios SET qr_token = ? WHERE id = ?', [nuevoToken, req.params.id]);

    const socioActualizado = get('SELECT * FROM socios WHERE id = ?', [req.params.id]);
    res.json({ data: socioActualizado, message: 'QR regenerado' });
  } catch (error) {
    console.error('Error al rotar QR:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
