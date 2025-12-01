const express = require('express');
const { query, get, insert, run } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { chatWithGPT } = require('../services/openai');
const router = express.Router();

// POST /api/asistente/chat - Enviar mensaje al asistente
router.post('/chat', requireAuth, requireRole('cliente'), async (req, res) => {
  try {
    const user = req.session.user;
    const { mensaje, tipo = 'general', contexto = {} } = req.body;

    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    // Verificar que el socio esté activo
    const socioCompleto = get('SELECT estado FROM socios WHERE id = ?', [socio.id]);
    if (socioCompleto.estado !== 'activo') {
      return res.status(403).json({ error: 'Tu cuenta debe estar activa para usar el asistente' });
    }

    // Llamar al servicio de OpenAI (mock)
    const respuestaGPT = await chatWithGPT(mensaje, tipo, contexto);
    
    // Extraer texto y rutinaData de la respuesta
    const textoRespuesta = respuestaGPT.texto || respuestaGPT;
    const rutinaData = respuestaGPT.rutinaData || null;

    // Preparar metadata con rutinaData si existe
    let metadata = null;
    if (rutinaData) {
      metadata = JSON.stringify({ rutinaData });
    } else if (contexto && Object.keys(contexto).length > 0) {
      metadata = JSON.stringify(contexto);
    }

    const result = insert(
      `INSERT INTO conversaciones_asistente (socio_id, tipo, mensaje_usuario, respuesta_asistente, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [socio.id, tipo, mensaje.trim(), textoRespuesta, metadata]
    );

    res.json({
      data: {
        id: result.lastInsertRowid,
        mensaje_usuario: mensaje.trim(),
        respuesta_asistente: textoRespuesta,
        tipo,
        rutinaData: rutinaData,
        fecha: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error en chat del asistente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/asistente/conversaciones - Obtener historial de conversaciones
router.get('/conversaciones', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { tipo, limit = 50, offset = 0 } = req.query;

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    let sql = `
      SELECT id, tipo, mensaje_usuario, respuesta_asistente, metadata, fecha
      FROM conversaciones_asistente
      WHERE socio_id = ?
    `;
    const params = [socio.id];

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }

    sql += ' ORDER BY fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const conversaciones = query(sql, params);

    // Procesar conversaciones para extraer rutinaData de metadata si existe
    const conversacionesProcesadas = conversaciones.map(conv => {
      let rutinaData = null;
      if (conv.metadata) {
        try {
          const metadata = JSON.parse(conv.metadata);
          if (metadata.rutinaData) {
            rutinaData = metadata.rutinaData;
          }
        } catch (e) {
          // Si no se puede parsear, ignorar
        }
      }
      return {
        ...conv,
        rutinaData: rutinaData
      };
    });

    res.json({ data: conversacionesProcesadas });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/asistente/conversaciones/:id - Eliminar conversación
router.delete('/conversaciones/:id', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    // Verificar que la conversación pertenezca al socio
    const conversacion = get(
      'SELECT id FROM conversaciones_asistente WHERE id = ? AND socio_id = ?',
      [id, socio.id]
    );

    if (!conversacion) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    run('DELETE FROM conversaciones_asistente WHERE id = ?', [id]);

    res.json({ message: 'Conversación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar conversación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/asistente/conversaciones - Eliminar todas las conversaciones del socio
router.delete('/conversaciones', requireAuth, requireRole('cliente'), (req, res) => {
  try {
    const user = req.session.user;

    // Obtener socio_id del usuario
    const socio = get('SELECT id FROM socios WHERE usuario_id = ?', [user.id]);
    if (!socio) {
      return res.status(404).json({ error: 'No tienes un socio asociado' });
    }

    run('DELETE FROM conversaciones_asistente WHERE socio_id = ?', [socio.id]);

    res.json({ message: 'Todas las conversaciones han sido eliminadas correctamente' });
  } catch (error) {
    console.error('Error al eliminar conversaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;


