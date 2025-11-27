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
    let sql = `SELECT c.*, tc.nombre as nombre 
               FROM clases c 
               LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id 
               WHERE 1=1`;
    const params = [];

    if (desde) {
      sql += ' AND c.fecha >= ?';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND c.fecha <= ?';
      params.push(hasta);
    }

    sql += ' ORDER BY c.fecha';

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

// GET /api/reportes/accesos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/accesos', (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let sql = `
      SELECT a.*, s.nombre as socio_nombre 
      FROM accesos a
      LEFT JOIN socios s ON a.socio_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (desde) {
      sql += ' AND DATE(a.fecha_hora) >= ?';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND DATE(a.fecha_hora) <= ?';
      params.push(hasta);
    }

    sql += ' ORDER BY a.fecha_hora DESC';

    const accesos = query(sql, params);

    const total = accesos.length;
    const permitidos = accesos.filter(a => a.permitido === 1).length;
    const denegados = accesos.filter(a => a.permitido === 0).length;

    // Agrupar por día
    const porDia = {};
    accesos.forEach(acceso => {
      const fecha = acceso.fecha_hora.split('T')[0];
      if (!porDia[fecha]) {
        porDia[fecha] = { fecha, total: 0, permitidos: 0, denegados: 0 };
      }
      porDia[fecha].total++;
      if (acceso.permitido === 1) {
        porDia[fecha].permitidos++;
      } else {
        porDia[fecha].denegados++;
      }
    });

    res.json({
      data: {
        total,
        permitidos,
        denegados,
        porcentajePermitidos: total > 0 ? Math.round((permitidos / total) * 100) : 0,
        porDia: Object.values(porDia),
      },
    });
  } catch (error) {
    console.error('Error al obtener accesos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/socios_activos
router.get('/socios_activos', (req, res) => {
  try {
    const socios = query(`
      SELECT 
        s.id,
        s.nombre,
        COUNT(DISTINCT r.id) as total_reservas,
        COUNT(DISTINCT a.id) as total_accesos,
        COUNT(DISTINCT CASE WHEN a.permitido = 1 THEN a.id END) as accesos_permitidos,
        COUNT(DISTINCT p.id) as total_pagos,
        SUM(p.monto) as total_pagado
      FROM socios s
      LEFT JOIN reservas r ON s.id = r.socio_id
      LEFT JOIN accesos a ON s.id = a.socio_id
      LEFT JOIN pagos p ON s.id = p.socio_id
      GROUP BY s.id, s.nombre
      ORDER BY total_reservas DESC, total_accesos DESC
      LIMIT 10
    `);

    res.json({ data: socios });
  } catch (error) {
    console.error('Error al obtener socios activos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/clases_populares
router.get('/clases_populares', (req, res) => {
  try {
    const clases = query(`
      SELECT 
        tc.nombre,
        COUNT(DISTINCT c.id) as total_clases,
        COUNT(DISTINCT r.id) as total_reservas,
        AVG(CASE WHEN r.estado = 'asistio' THEN 1 ELSE 0 END) * 100 as porcentaje_asistencia,
        SUM(c.cupo) as total_cupos,
        SUM((SELECT COUNT(*) FROM reservas r2 WHERE r2.clase_id = c.id AND r2.estado != 'cancelado')) as total_ocupados
      FROM clases c
      LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id
      LEFT JOIN reservas r ON c.id = r.clase_id
      GROUP BY c.tipo_clase_id, tc.nombre
      ORDER BY total_reservas DESC
    `);

    res.json({ data: clases });
  } catch (error) {
    console.error('Error al obtener clases populares:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/metodos_pago
router.get('/metodos_pago', (req, res) => {
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

    const pagos = query(sql, params);

    const efectivo = pagos.filter(p => p.metodo_pago === 'efectivo').length;
    const transferencia = pagos.filter(p => p.metodo_pago === 'transferencia').length;
    const totalEfectivo = pagos.filter(p => p.metodo_pago === 'efectivo').reduce((sum, p) => sum + p.monto, 0);
    const totalTransferencia = pagos.filter(p => p.metodo_pago === 'transferencia').reduce((sum, p) => sum + p.monto, 0);

    res.json({
      data: {
        efectivo: {
          cantidad: efectivo,
          total: totalEfectivo,
          porcentaje: pagos.length > 0 ? Math.round((efectivo / pagos.length) * 100) : 0,
        },
        transferencia: {
          cantidad: transferencia,
          total: totalTransferencia,
          porcentaje: pagos.length > 0 ? Math.round((transferencia / pagos.length) * 100) : 0,
        },
        total: pagos.length,
      },
    });
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;



