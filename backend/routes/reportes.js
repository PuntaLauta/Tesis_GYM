const express = require('express');
const { query, get } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isSocioActivo, getOcupacionClase } = require('../models/helpers');
const router = express.Router();

// Todas las rutas requieren admin/root
router.use(requireAuth);
router.use(requireRole('admin', 'root'));

// GET /api/reportes/activos_inactivos
router.get('/activos_inactivos', (req, res) => {
  try {
    const socios = query('SELECT id FROM socios');
    let activos = 0;
    let inactivos = 0;

    socios.forEach(socio => {
      const validacion = isSocioActivo(socio.id);
      if (validacion.activo) {
        activos++;
      } else {
        inactivos++;
      }
    });

    res.json({ data: { activos, inactivos, total: activos + inactivos } });
  } catch (error) {
    console.error('Error al obtener activos/inactivos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/vencen_semana
router.get('/vencen_semana', (req, res) => {
  try {
    const socios = query(`
      SELECT s.*, p.duracion, p.nombre as plan_nombre
      FROM socios s
      LEFT JOIN planes p ON s.plan_id = p.id
    `);

    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);

    const vencen = [];

    socios.forEach(socio => {
      if (!socio.plan_id) return;

      const ultimoPago = get(`
        SELECT fecha 
        FROM pagos 
        WHERE socio_id = ? 
        ORDER BY fecha DESC 
        LIMIT 1
      `, [socio.id]);

      if (!ultimoPago) return;

      const fechaPago = new Date(ultimoPago.fecha);
      const fechaVencimiento = new Date(fechaPago);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + socio.duracion);

      if (fechaVencimiento >= hoy && fechaVencimiento <= en7Dias) {
        vencen.push({
          ...socio,
          fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
        });
      }
    });

    res.json({ data: vencen });
  } catch (error) {
    console.error('Error al obtener vencen semana:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/ingresos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/ingresos', (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let sql = 'SELECT * FROM pagos WHERE 1=1';
    const params = [];

    if (desde) {
      sql += ' AND fecha >= ?';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND fecha <= ?';
      params.push(hasta);
    }

    sql += ' ORDER BY fecha';

    const pagos = query(sql, params);

    // Agrupar por día
    const porDia = {};
    let total = 0;

    pagos.forEach(pago => {
      const fecha = pago.fecha.split('T')[0];
      if (!porDia[fecha]) {
        porDia[fecha] = { fecha, monto: 0, cantidad: 0 };
      }
      porDia[fecha].monto += pago.monto;
      porDia[fecha].cantidad++;
      total += pago.monto;
    });

    res.json({
      data: {
        total,
        porDia: Object.values(porDia),
        resumen: {
          totalPagos: pagos.length,
          promedio: pagos.length > 0 ? total / pagos.length : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/ocupacion_clases?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/ocupacion_clases', (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let sql = 'SELECT * FROM clases WHERE 1=1';
    const params = [];

    if (desde) {
      sql += ' AND fecha >= ?';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND fecha <= ?';
      params.push(hasta);
    }

    sql += ' ORDER BY fecha';

    const clases = query(sql, params);

    const ocupacion = clases.map(clase => {
      const ocupados = getOcupacionClase(clase.id);
      const porcentaje = clase.cupo > 0 ? Math.round((ocupados / clase.cupo) * 100) : 0;
      return {
        id: clase.id,
        nombre: clase.nombre,
        fecha: clase.fecha,
        cupo: clase.cupo,
        ocupados,
        disponibles: clase.cupo - ocupados,
        porcentaje,
      };
    });

    const promedio = ocupacion.length > 0
      ? Math.round(ocupacion.reduce((sum, c) => sum + c.porcentaje, 0) / ocupacion.length)
      : 0;

    res.json({
      data: {
        clases: ocupacion,
        promedio,
        total: ocupacion.length,
      },
    });
  } catch (error) {
    console.error('Error al obtener ocupación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;



