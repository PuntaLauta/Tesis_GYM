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

// Función helper para convertir datos a CSV
function convertirACSV(datos, headers) {
  const filas = [];
  
  // Agregar encabezados
  filas.push(headers.join(','));
  
  // Agregar datos
  datos.forEach(fila => {
    const valores = headers.map(header => {
      const valor = fila[header] || '';
      // Escapar comillas y envolver en comillas si contiene comas
      const valorStr = String(valor).replace(/"/g, '""');
      return valorStr.includes(',') || valorStr.includes('"') || valorStr.includes('\n')
        ? `"${valorStr}"`
        : valorStr;
    });
    filas.push(valores.join(','));
  });
  
  return filas.join('\n');
}

// GET /api/reportes/export/:tipo - Exportar reporte a CSV
router.get('/export/:tipo', (req, res) => {
  try {
    const { tipo } = req.params;
    const { desde, hasta } = req.query;
    
    let csv = '';
    let nombreArchivo = '';
    
    switch (tipo) {
      case 'ingresos': {
        const { desde, hasta } = req.query;
        let sql = 'SELECT p.*, s.nombre as socio_nombre FROM pagos p LEFT JOIN socios s ON p.socio_id = s.id WHERE 1=1';
        const params = [];
        
        if (desde) {
          sql += ' AND p.fecha >= ?';
          params.push(desde);
        }
        if (hasta) {
          sql += ' AND p.fecha <= ?';
          params.push(hasta);
        }
        sql += ' ORDER BY p.fecha';
        
        const pagos = query(sql, params);
        csv = convertirACSV(pagos, ['id', 'socio_nombre', 'monto', 'fecha', 'metodo_pago']);
        nombreArchivo = `ingresos_${desde || 'all'}_${hasta || 'all'}.csv`;
        break;
      }
      
      case 'ocupacion': {
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
          return {
            id: clase.id,
            nombre: clase.nombre,
            fecha: clase.fecha,
            hora_inicio: clase.hora_inicio,
            hora_fin: clase.hora_fin,
            cupo: clase.cupo,
            ocupados: ocupados,
            disponibles: clase.cupo - ocupados,
            porcentaje: clase.cupo > 0 ? Math.round((ocupados / clase.cupo) * 100) : 0,
            instructor: clase.instructor,
            estado: clase.estado
          };
        });
        csv = convertirACSV(ocupacion, ['id', 'nombre', 'fecha', 'hora_inicio', 'hora_fin', 'cupo', 'ocupados', 'disponibles', 'porcentaje', 'instructor', 'estado']);
        nombreArchivo = `ocupacion_clases_${desde || 'all'}_${hasta || 'all'}.csv`;
        break;
      }
      
      case 'accesos': {
        const { desde, hasta } = req.query;
        let sql = `
          SELECT a.*, s.nombre as socio_nombre, s.documento
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
        const accesosFormateados = accesos.map(a => ({
          id: a.id,
          socio_nombre: a.socio_nombre,
          documento: a.documento,
          fecha_hora: a.fecha_hora,
          permitido: a.permitido === 1 ? 'Si' : 'No',
          motivo: a.motivo
        }));
        csv = convertirACSV(accesosFormateados, ['id', 'socio_nombre', 'documento', 'fecha_hora', 'permitido', 'motivo']);
        nombreArchivo = `accesos_${desde || 'all'}_${hasta || 'all'}.csv`;
        break;
      }
      
      case 'socios_activos': {
        const socios = query(`
          SELECT 
            s.id,
            s.nombre,
            s.documento,
            s.estado,
            COUNT(DISTINCT r.id) as total_reservas,
            COUNT(DISTINCT a.id) as total_accesos,
            COUNT(DISTINCT CASE WHEN a.permitido = 1 THEN a.id END) as accesos_permitidos,
            COUNT(DISTINCT p.id) as total_pagos,
            COALESCE(SUM(p.monto), 0) as total_pagado
          FROM socios s
          LEFT JOIN reservas r ON s.id = r.socio_id
          LEFT JOIN accesos a ON s.id = a.socio_id
          LEFT JOIN pagos p ON s.id = p.socio_id
          GROUP BY s.id, s.nombre, s.documento, s.estado
          ORDER BY total_reservas DESC, total_accesos DESC
        `);
        csv = convertirACSV(socios, ['id', 'nombre', 'documento', 'estado', 'total_reservas', 'total_accesos', 'accesos_permitidos', 'total_pagos', 'total_pagado']);
        nombreArchivo = 'socios_activos.csv';
        break;
      }
      
      case 'clases_populares': {
        const clases = query(`
          SELECT 
            c.nombre,
            COUNT(DISTINCT c.id) as total_clases,
            COUNT(DISTINCT r.id) as total_reservas
          FROM clases c
          LEFT JOIN reservas r ON c.id = r.clase_id
          GROUP BY c.nombre
          ORDER BY total_reservas DESC
        `);
        csv = convertirACSV(clases, ['nombre', 'total_clases', 'total_reservas']);
        nombreArchivo = 'clases_populares.csv';
        break;
      }
      
      case 'metodos_pago': {
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
        const resumen = pagos.map(p => ({
          id: p.id,
          socio_id: p.socio_id,
          monto: p.monto,
          fecha: p.fecha,
          metodo_pago: p.metodo_pago
        }));
        csv = convertirACSV(resumen, ['id', 'socio_id', 'monto', 'fecha', 'metodo_pago']);
        nombreArchivo = `metodos_pago_${desde || 'all'}_${hasta || 'all'}.csv`;
        break;
      }
      
      default:
        return res.status(400).json({ error: 'Tipo de reporte no válido' });
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send('\ufeff' + csv); // BOM para UTF-8 en Excel
  } catch (error) {
    console.error('Error al exportar reporte:', error);
    res.status(500).json({ error: 'Error al exportar reporte' });
  }
});

module.exports = router;



