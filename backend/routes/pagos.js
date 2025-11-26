const express = require('express');
const { query, get, insert } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// GET /api/pagos/mios - Mis pagos (cliente)
router.get('/mios', (req, res) => {
  try {
    const user = req.session.user;
    
    if (user.rol === 'cliente') {
      if (!user.socio_id) {
        return res.json({ data: [] });
      }
      
      const pagos = query(`
        SELECT p.*, s.nombre as socio_nombre, pl.nombre as plan_nombre, pl.duracion as plan_duracion
        FROM pagos p 
        LEFT JOIN socios s ON p.socio_id = s.id
        LEFT JOIN planes pl ON s.plan_id = pl.id
        WHERE p.socio_id = ?
        ORDER BY p.fecha DESC
      `, [user.socio_id]);
      
      // Calcular período cubierto para cada pago
      const pagosConPeriodo = pagos.map(pago => {
        const fechaPago = new Date(pago.fecha);
        const fechaInicio = fechaPago.toISOString().split('T')[0];
        let fechaFin = null;
        if (pago.plan_duracion) {
          const fechaVencimiento = new Date(fechaPago);
          fechaVencimiento.setDate(fechaVencimiento.getDate() + pago.plan_duracion);
          fechaFin = fechaVencimiento.toISOString().split('T')[0];
        }
        return {
          ...pago,
          periodo_inicio: fechaInicio,
          periodo_fin: fechaFin
        };
      });
      
      return res.json({ data: pagosConPeriodo });
    }
    
    return res.status(403).json({ error: 'Solo clientes pueden ver sus pagos' });
  } catch (error) {
    console.error('Error al listar mis pagos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/pagos - Listar todos (solo admin/root)
router.get('/', requireRole('admin', 'root'), (req, res) => {
  try {
    const pagos = query(`
      SELECT p.*, s.nombre as socio_nombre 
      FROM pagos p 
      LEFT JOIN socios s ON p.socio_id = s.id
      ORDER BY p.fecha DESC
    `);
    res.json({ data: pagos });
  } catch (error) {
    console.error('Error al listar pagos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/pagos/:id - Obtener pago (admin/root o propio)
router.get('/:id', (req, res) => {
  try {
    const pago = get(`
      SELECT p.*, s.nombre as socio_nombre 
      FROM pagos p 
      LEFT JOIN socios s ON p.socio_id = s.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    res.json({ data: pago });
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/pagos - Crear pago (solo admin/root)
router.post('/', requireRole('admin', 'root'), (req, res) => {
  try {
    const { socio_id, monto, metodo_pago } = req.body;

    if (!socio_id || !monto) {
      return res.status(400).json({ error: 'Socio ID y monto requeridos' });
    }

    if (!metodo_pago || (metodo_pago !== 'transferencia' && metodo_pago !== 'efectivo')) {
      return res.status(400).json({ error: 'Método de pago requerido (transferencia o efectivo)' });
    }

    // Verificar que el socio existe y obtener su plan
    const socio = get(`
      SELECT s.*, p.duracion as plan_duracion 
      FROM socios s 
      LEFT JOIN planes p ON s.plan_id = p.id
      WHERE s.id = ?
    `, [socio_id]);
    
    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    if (!socio.plan_id) {
      return res.status(400).json({ error: 'El socio no tiene un plan asignado' });
    }

    // Crear el pago
    const result = insert(
      `INSERT INTO pagos (socio_id, monto, fecha, metodo_pago) VALUES (?, ?, datetime('now'), ?)`,
      [socio_id, monto, metodo_pago]
    );

    // Calcular nueva fecha de vencimiento basada en el plan
    const fechaPago = new Date();
    const fechaVencimiento = new Date(fechaPago);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + socio.plan_duracion);

    // Actualizar el estado del socio a 'activo' si estaba inactivo
    const { run } = require('../db/database');
    run('UPDATE socios SET estado = ? WHERE id = ?', ['activo', socio_id]);

    const nuevoPago = get(`
      SELECT p.*, s.nombre as socio_nombre 
      FROM pagos p 
      LEFT JOIN socios s ON p.socio_id = s.id
      WHERE p.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({ 
      data: {
        ...nuevoPago,
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
