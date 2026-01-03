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

    // Para cada rutina, obtener ejercicios desde rutina_ejercicio si existen
    const rutinasConEjercicios = rutinas.map(rutina => {
      const ejerciciosRutina = query(`
        SELECT 
          re.*,
          e.nombre as ejercicio_nombre,
          e.descripcion as ejercicio_descripcion,
          e.descripcion_profesor as descripcion_profesor,
          ee.nombre as estado_nombre
        FROM rutina_ejercicio re
        LEFT JOIN ejercicios e ON re.ejercicio_id = e.id
        LEFT JOIN estado_ejercicios ee ON re.estado_id = ee.id
        WHERE re.rutina_id = ?
        ORDER BY re.orden
      `, [rutina.id]);

      if (ejerciciosRutina && ejerciciosRutina.length > 0) {
        // Parsear JSON para obtener datos adicionales
        let ejerciciosJson = [];
        try {
          ejerciciosJson = typeof rutina.ejercicios === 'string' 
            ? JSON.parse(rutina.ejercicios) 
            : rutina.ejercicios || [];
        } catch (e) {
          ejerciciosJson = [];
        }

        const ejerciciosFormateados = ejerciciosRutina.map(re => {
          const ejercicioJson = ejerciciosJson.find(ej => 
            ej.nombre === re.ejercicio_nombre || ej.id === re.ejercicio_id
          );

          return {
            id: re.ejercicio_id,
            nombre: re.ejercicio_nombre,
            series: re.series,
            repeticiones: re.repeticiones,
            descanso: ejercicioJson?.descanso || null,
            notas: ejercicioJson?.notas || re.ejercicio_descripcion || '',
            estado_id: parseInt(re.estado_id, 10) || 1, // Asegurar que sea número
            estado_nombre: re.estado_nombre,
            descripcion_profesor: re.descripcion_profesor || null
          };
        });

        return {
          ...rutina,
          ejercicios: ejerciciosFormateados
        };
      }

      // Si no hay ejercicios en rutina_ejercicio, mantener el JSON original
      return rutina;
    });

    res.json({ data: rutinasConEjercicios });
  } catch (error) {
    console.error('Error al listar rutinas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/rutinas/generar - Generar rutina usando Claude
router.post('/generar', requireAuth, requireRole('cliente'), async (req, res) => {
  try {
    const user = req.session.user;
    const { tipo_rutina_id, sexo, edad, peso, altura, notas } = req.body;

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
    if (!altura || altura < 100 || altura > 250) {
      return res.status(400).json({ error: 'La altura debe estar entre 100 y 250 cm' });
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
      parseFloat(altura),
      notas || ''
    );

    // Validar que la rutina generada tenga los campos necesarios
    if (!rutinaData.nombre || !rutinaData.ejercicios || !Array.isArray(rutinaData.ejercicios)) {
      return res.status(500).json({ error: 'Error: La rutina generada no tiene el formato correcto' });
    }

    // Convertir ejercicios a JSON string (mantener para compatibilidad)
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

    const rutinaId = result.lastInsertRowid;

    // Obtener el ID del estado PENDIENTE
    const estadoPendiente = get("SELECT id FROM estado_ejercicios WHERE nombre = 'PENDIENTE'");
    const estadoPendienteId = estadoPendiente ? estadoPendiente.id : 1;

    // Crear ejercicios en la tabla ejercicios y asociarlos en rutina_ejercicio
    rutinaData.ejercicios.forEach((ejercicioData, index) => {
      // Buscar si el ejercicio ya existe en el catálogo
      let ejercicio = get('SELECT id FROM ejercicios WHERE nombre = ?', [ejercicioData.nombre]);
      
      if (!ejercicio) {
        // Crear nuevo ejercicio en el catálogo
        const ejercicioResult = insert(
          `INSERT INTO ejercicios (nombre, series, repeticiones, descripcion, estado_id)
           VALUES (?, ?, ?, ?, ?)`,
          [
            ejercicioData.nombre,
            ejercicioData.series || null,
            ejercicioData.repeticiones || null,
            ejercicioData.notas || null,
            estadoPendienteId
          ]
        );
        ejercicio = { id: ejercicioResult.lastInsertRowid };
      }

      // Obtener estado_id del ejercicio (si viene en el JSON, usarlo; sino PENDIENTE)
      const ejercicioEstadoId = ejercicioData.estado_id || estadoPendienteId;

      // Crear registro en rutina_ejercicio
      insert(
        `INSERT INTO rutina_ejercicio (rutina_id, ejercicio_id, series, repeticiones, orden, estado_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          rutinaId,
          ejercicio.id,
          ejercicioData.series || null,
          ejercicioData.repeticiones || null,
          index + 1,
          ejercicioEstadoId
        ]
      );
    });

    // Obtener la rutina creada con ejercicios desde rutina_ejercicio
    const nuevaRutina = get('SELECT * FROM rutinas WHERE id = ?', [rutinaId]);
    
    // Obtener ejercicios desde rutina_ejercicio
    const ejerciciosRutina = query(`
      SELECT 
        re.*,
        e.nombre as ejercicio_nombre,
        e.descripcion as ejercicio_descripcion,
        e.descripcion_profesor as descripcion_profesor,
        ee.nombre as estado_nombre
      FROM rutina_ejercicio re
      LEFT JOIN ejercicios e ON re.ejercicio_id = e.id
      LEFT JOIN estado_ejercicios ee ON re.estado_id = ee.id
      WHERE re.rutina_id = ?
      ORDER BY re.orden
    `, [rutinaId]);

    // Formatear ejercicios para la respuesta
    const ejerciciosFormateados = ejerciciosRutina.map((re, idx) => {
      // Buscar el ejercicio original en rutinaData para obtener datos adicionales
      const ejercicioOriginal = rutinaData.ejercicios[idx] || {};
      
      return {
        id: re.ejercicio_id,
        nombre: re.ejercicio_nombre || ejercicioOriginal.nombre,
        series: re.series,
        repeticiones: re.repeticiones,
        descanso: ejercicioOriginal.descanso || null,
        notas: re.ejercicio_descripcion || ejercicioOriginal.notas || '',
        estado_id: parseInt(re.estado_id, 10) || 1, // Asegurar que sea número
        estado_nombre: re.estado_nombre,
        descripcion_profesor: re.descripcion_profesor || null
      };
    });

    // Actualizar el JSON de ejercicios en la rutina para mantener compatibilidad
    const ejerciciosJsonActualizado = JSON.stringify(ejerciciosFormateados);
    run('UPDATE rutinas SET ejercicios = ? WHERE id = ?', [ejerciciosJsonActualizado, rutinaId]);

    res.status(201).json({ 
      data: {
        ...nuevaRutina,
        ejercicios: ejerciciosFormateados
      }
    });
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

// GET /api/rutinas/instructor - Listar todas las rutinas para instructores
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para que no se interprete "instructor" como un ID
router.get('/instructor', requireAuth, requireRole('instructor'), (req, res) => {
  try {
    // Obtener todas las rutinas
    let sql = `
      SELECT id, nombre, descripcion, ejercicios, fecha_creacion, fecha_inicio, fecha_fin, activa, socio_id
      FROM rutinas
      ORDER BY fecha_creacion DESC
    `;
    
    const rutinas = query(sql);

    // Para cada rutina, obtener ejercicios desde rutina_ejercicio si existen
    const rutinasConEjercicios = rutinas.map(rutina => {
      const ejerciciosRutina = query(`
        SELECT 
          re.*,
          e.nombre as ejercicio_nombre,
          e.descripcion as ejercicio_descripcion,
          e.descripcion_profesor as descripcion_profesor,
          ee.nombre as estado_nombre
        FROM rutina_ejercicio re
        LEFT JOIN ejercicios e ON re.ejercicio_id = e.id
        LEFT JOIN estado_ejercicios ee ON re.estado_id = ee.id
        WHERE re.rutina_id = ?
        ORDER BY re.orden
      `, [rutina.id]);

      if (ejerciciosRutina && ejerciciosRutina.length > 0) {
        // Parsear JSON para obtener datos adicionales
        let ejerciciosJson = [];
        try {
          ejerciciosJson = typeof rutina.ejercicios === 'string' 
            ? JSON.parse(rutina.ejercicios) 
            : rutina.ejercicios || [];
        } catch (e) {
          ejerciciosJson = [];
        }

        const ejerciciosFormateados = ejerciciosRutina.map((re, idx) => {
          const ejercicioJson = ejerciciosJson[idx] || 
            ejerciciosJson.find(ej => ej.nombre === re.ejercicio_nombre || ej.id === re.ejercicio_id) ||
            {};

          return {
            id: re.id, // ID de rutina_ejercicio para poder actualizarlo
            ejercicio_id: re.ejercicio_id,
            nombre: re.ejercicio_nombre,
            series: re.series,
            repeticiones: re.repeticiones,
            descanso: ejercicioJson.descanso || null,
            notas: ejercicioJson.notas || re.ejercicio_descripcion || '',
            estado_id: parseInt(re.estado_id, 10) || 1,
            estado_nombre: re.estado_nombre,
            descripcion_profesor: re.descripcion_profesor || null
          };
        });

        return {
          ...rutina,
          ejercicios: ejerciciosFormateados
        };
      }

      // Si no hay ejercicios en rutina_ejercicio, mantener el JSON original
      return rutina;
    });

    res.json({ data: rutinasConEjercicios });
  } catch (error) {
    console.error('Error al listar rutinas para instructor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/rutinas/ejercicios/:id/revisar - Revisar ejercicio (aprobar/rechazar)
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para que no se interprete "ejercicios" como un ID
router.put('/ejercicios/:id/revisar', requireAuth, requireRole('instructor'), (req, res) => {
  try {
    const { id } = req.params; // ID de rutina_ejercicio
    const { estado, notas } = req.body; // estado: 'aprobado' o 'rechazado', notas: texto
    
    if (!estado || (estado !== 'aprobado' && estado !== 'rechazado')) {
      return res.status(400).json({ error: 'El estado debe ser "aprobado" o "rechazado"' });
    }

    if (notas && notas.length > 500) {
      return res.status(400).json({ error: 'Las notas no pueden exceder 500 caracteres' });
    }

    // Obtener el registro de rutina_ejercicio
    const rutinaEjercicio = get('SELECT * FROM rutina_ejercicio WHERE id = ?', [id]);
    if (!rutinaEjercicio) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    // Obtener el ID del estado correspondiente
    const estadoEjercicio = get('SELECT id FROM estado_ejercicios WHERE nombre = ?', [estado.toUpperCase()]);
    if (!estadoEjercicio) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // Obtener el instructor_id del usuario actual
    const user = req.session.user;
    const instructor = get('SELECT id FROM instructores WHERE email = ?', [user.email]);
    if (!instructor) {
      return res.status(404).json({ error: 'Instructor no encontrado' });
    }

    // Actualizar el estado en rutina_ejercicio
    run('UPDATE rutina_ejercicio SET estado_id = ? WHERE id = ?', [estadoEjercicio.id, id]);

    // Actualizar descripcion_profesor e instructor_id en la tabla ejercicios
    run(
      'UPDATE ejercicios SET descripcion_profesor = ?, instructor_id = ? WHERE id = ?',
      [notas || null, instructor.id, rutinaEjercicio.ejercicio_id]
    );

    res.json({ 
      message: `Ejercicio ${estado === 'aprobado' ? 'aprobado' : 'rechazado'} correctamente`,
      data: {
        estado_id: estadoEjercicio.id,
        estado_nombre: estado.toUpperCase(),
        descripcion_profesor: notas || null
      }
    });
  } catch (error) {
    console.error('Error al revisar ejercicio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

    // Obtener ejercicios desde rutina_ejercicio si existen
    const ejerciciosRutina = query(`
      SELECT 
        re.*,
        e.nombre as ejercicio_nombre,
        e.descripcion as ejercicio_descripcion,
        e.descripcion_profesor as descripcion_profesor,
        ee.nombre as estado_nombre
      FROM rutina_ejercicio re
      LEFT JOIN ejercicios e ON re.ejercicio_id = e.id
      LEFT JOIN estado_ejercicios ee ON re.estado_id = ee.id
      WHERE re.rutina_id = ?
      ORDER BY re.orden
    `, [id]);

    // Si hay ejercicios en rutina_ejercicio, usarlos; sino usar el JSON
    if (ejerciciosRutina && ejerciciosRutina.length > 0) {
      // Parsear el JSON de ejercicios para obtener datos adicionales como descanso y notas_instructor
      let ejerciciosJson = [];
      try {
        ejerciciosJson = typeof rutina.ejercicios === 'string' 
          ? JSON.parse(rutina.ejercicios) 
          : rutina.ejercicios || [];
      } catch (e) {
        ejerciciosJson = [];
      }

      const ejerciciosFormateados = ejerciciosRutina.map((re, idx) => {
        // Buscar ejercicio correspondiente en el JSON por índice o nombre
        const ejercicioJson = ejerciciosJson[idx] || 
          ejerciciosJson.find(ej => ej.nombre === re.ejercicio_nombre || ej.id === re.ejercicio_id) ||
          {};

        return {
          id: re.ejercicio_id,
          nombre: re.ejercicio_nombre,
          series: re.series,
          repeticiones: re.repeticiones,
          descanso: ejercicioJson.descanso || null,
          notas: ejercicioJson.notas || re.ejercicio_descripcion || '',
          estado_id: parseInt(re.estado_id, 10) || 1, // Asegurar que sea número
          estado_nombre: re.estado_nombre,
          descripcion_profesor: re.descripcion_profesor || null
        };
      });

      res.json({ 
        data: {
          ...rutina,
          ejercicios: ejerciciosFormateados
        }
      });
    } else {
      // Fallback: usar JSON si no hay registros en rutina_ejercicio
      res.json({ data: rutina });
    }
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


