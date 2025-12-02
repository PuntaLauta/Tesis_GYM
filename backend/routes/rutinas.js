const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generarRutinaPersonalizada } = require('../services/openai');
const router = express.Router();

// GET /api/rutinas - Listar rutinas del socio actual
router.get('/', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { activa, limit = 100, offset = 0 } = req.query;

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    let sql = `
      SELECT id, nombre, descripcion, ejercicios, fecha_creacion, fecha_inicio, fecha_fin, activa
      FROM rutinas
      WHERE socio_id = ?
    `;
    const params = [socio.id];

    if (activa !== undefined) {
      sql += ' AND activa = ?';
      params.push(activa === 'true' || activa === '1' ? 1 : 0);
    }

    sql += ' ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const rutinas = query(sql, params);

    res.json({ data: rutinas });
  } catch (error) {
    console.error('Error al listar rutinas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/rutinas/generar - Generar rutina usando Claude
router.post('/generar', requireAuth, requireRole('cliente'), async (req, res) => {
  try {
    const user = req.session.user;
    const { tipo_rutina_id, sexo, edad, peso, notas } = req.body;

    // Validar campos requeridos
    if (!tipo_rutina_id) {
      return res.status(400).json({ error: 'El tipo de rutina es requerido' });
    }
    if (!sexo || (sexo !== 'hombre' && sexo !== 'mujer')) {
      return res.status(400).json({ error: 'El sexo debe ser "hombre" o "mujer"' });
    }
    if (!edad || edad < 12 || edad > 99) {
      return res.status(400).json({ error: 'La edad debe estar entre 12 y 99 años' });
    }
    if (!peso || peso < 20 || peso > 300) {
      return res.status(400).json({ error: 'El peso debe estar entre 20 y 300 kg' });
    }

    // Obtener socio_id del usuario
    const socio = get('SELECT id, estado FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    // Verificar que el socio esté activo
    if (socio.estado !== 'activo') {
      return res.status(403).json({ error: 'Tu cuenta debe estar activa para generar rutinas. Contacta a recepción para reactivar tu membresía.' });
    }

    // Obtener el nombre del tipo de rutina
    const tipoRutina = get('SELECT nombre FROM tipo_rutina WHERE id = ?', [tipo_rutina_id]);
    if (!tipoRutina) {
      return res.status(404).json({ error: 'Tipo de rutina no encontrado' });
    }

    // Generar rutina con Claude
    const rutinaData = await generarRutinaPersonalizada(
      tipoRutina.nombre,
      sexo,
      parseInt(edad),
      parseFloat(peso),
      notas || ''
    );

    // Validar que la rutina generada tenga los campos necesarios
    if (!rutinaData.nombre || !rutinaData.ejercicios || !Array.isArray(rutinaData.ejercicios)) {
      return res.status(500).json({ error: 'Error: La rutina generada no tiene el formato correcto' });
    }

    // Convertir ejercicios a JSON string
    const ejerciciosJson = JSON.stringify(rutinaData.ejercicios);

    // Crear la rutina en la base de datos
    const result = insert(
      `INSERT INTO rutinas (socio_id, tipo_rutina_id, nombre, descripcion, ejercicios, fecha_creacion, activa)
       VALUES (?, ?, ?, ?, ?, datetime('now'), 1)`,
      [
        socio.id,
        tipo_rutina_id,
        rutinaData.nombre,
        rutinaData.descripcion || null,
        ejerciciosJson,
      ]
    );

    // Obtener la rutina creada
    const nuevaRutina = get('SELECT * FROM rutinas WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ data: nuevaRutina });
  } catch (error) {
    console.error('Error al generar rutina:', error);
    
    // Manejar errores específicos
    if (error.message.includes('API key')) {
      return res.status(500).json({ error: 'Error de configuración del servidor. Por favor, contacta al administrador.' });
    }
    
    if (error.message.includes('JSON')) {
      return res.status(500).json({ error: 'Error al procesar la respuesta del asistente. Por favor, intenta nuevamente.' });
    }

    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// GET /api/rutinas/:id - Obtener rutina específica
router.get('/:id', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    const rutina = get(
      'SELECT * FROM rutinas WHERE id = ? AND socio_id = ?',
      [id, socio.id]
    );

    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    res.json({ data: rutina });
  } catch (error) {
    console.error('Error al obtener rutina:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/rutinas - Crear nueva rutina
router.post('/', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { nombre, descripcion, ejercicios, fecha_inicio, fecha_fin, tipo_rutina_id } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!ejercicios) {
      return res.status(400).json({ error: 'Los ejercicios son requeridos' });
    }

    // Validar que ejercicios sea un JSON válido
    let ejerciciosJson;
    try {
      ejerciciosJson = typeof ejercicios === 'string' ? ejercicios : JSON.stringify(ejercicios);
      JSON.parse(ejerciciosJson); // Validar que sea JSON válido
    } catch (e) {
      return res.status(400).json({ error: 'El formato de ejercicios no es válido (debe ser JSON)' });
    }

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    const result = insert(
      `INSERT INTO rutinas (socio_id, tipo_rutina_id, nombre, descripcion, ejercicios, fecha_inicio, fecha_fin, activa)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        socio.id,
        tipo_rutina_id || null,
        nombre.trim(),
        descripcion || null,
        ejerciciosJson,
        fecha_inicio || null,
        fecha_fin || null,
      ]
    );

    const nuevaRutina = get('SELECT * FROM rutinas WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ data: nuevaRutina });
  } catch (error) {
    console.error('Error al crear rutina:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/rutinas/:id - Actualizar rutina
router.put('/:id', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;
    const { nombre, descripcion, ejercicios, fecha_inicio, fecha_fin } = req.body;

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    // Verificar que la rutina pertenezca al socio
    const rutina = get('SELECT id FROM rutinas WHERE id = ? AND socio_id = ?', [id, socio.id]);
    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const params = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre.trim());
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      params.push(descripcion || null);
    }
    if (ejercicios !== undefined) {
      // Validar JSON
      try {
        const ejerciciosJson = typeof ejercicios === 'string' ? ejercicios : JSON.stringify(ejercicios);
        JSON.parse(ejerciciosJson);
        updates.push('ejercicios = ?');
        params.push(ejerciciosJson);
      } catch (e) {
        return res.status(400).json({ error: 'El formato de ejercicios no es válido (debe ser JSON)' });
      }
    }
    if (fecha_inicio !== undefined) {
      updates.push('fecha_inicio = ?');
      params.push(fecha_inicio || null);
    }
    if (fecha_fin !== undefined) {
      updates.push('fecha_fin = ?');
      params.push(fecha_fin || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);
    run(`UPDATE rutinas SET ${updates.join(', ')} WHERE id = ?`, params);

    const rutinaActualizada = get('SELECT * FROM rutinas WHERE id = ?', [id]);

    res.json({ data: rutinaActualizada });
  } catch (error) {
    console.error('Error al actualizar rutina:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/rutinas/:id - Eliminar rutina
router.delete('/:id', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    // Verificar que la rutina pertenezca al socio
    const rutina = get('SELECT id FROM rutinas WHERE id = ? AND socio_id = ?', [id, socio.id]);
    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    run('DELETE FROM rutinas WHERE id = ?', [id]);

    res.json({ message: 'Rutina eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar rutina:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/rutinas/:id/activar - Activar/desactivar rutina
router.put('/:id/activar', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;
    const { activa } = req.body;

    if (activa === undefined) {
      return res.status(400).json({ error: 'El campo activa es requerido' });
    }

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    // Verificar que la rutina pertenezca al socio
    const rutina = get('SELECT id FROM rutinas WHERE id = ? AND socio_id = ?', [id, socio.id]);
    if (!rutina) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    const activaValue = activa === true || activa === 'true' || activa === 1 || activa === '1' ? 1 : 0;

    run('UPDATE rutinas SET activa = ? WHERE id = ?', [activaValue, id]);

    const rutinaActualizada = get('SELECT * FROM rutinas WHERE id = ?', [id]);

    res.json({ data: rutinaActualizada });
  } catch (error) {
    console.error('Error al activar/desactivar rutina:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;


