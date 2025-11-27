const { query, get } = require('../db/database');

// Verificar si un socio está activo según su último pago y duración del plan
function isSocioActivo(socioId) {
  // Obtener el socio con su plan
  const socio = get(`
    SELECT s.*, p.duracion 
    FROM socios s 
    LEFT JOIN planes p ON s.plan_id = p.id 
    WHERE s.id = ?
  `, [socioId]);

  if (!socio || !socio.plan_id) {
    return { activo: false, motivo: 'Socio sin plan asignado' };
  }

  // Obtener último pago del socio
  const ultimoPago = get(`
    SELECT fecha 
    FROM pagos 
    WHERE socio_id = ? 
    ORDER BY fecha DESC 
    LIMIT 1
  `, [socioId]);

  if (!ultimoPago) {
    return { activo: false, motivo: 'Socio sin pagos registrados' };
  }

  // Calcular fecha de vencimiento
  const fechaPago = new Date(ultimoPago.fecha);
  const fechaVencimiento = new Date(fechaPago);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + socio.duracion);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaVencimiento.setHours(0, 0, 0, 0);

  if (fechaVencimiento >= hoy) {
    return { activo: true, motivo: 'Membresía vigente' };
  } else {
    return { 
      activo: false, 
      motivo: `Membresía vencida el ${fechaVencimiento.toISOString().split('T')[0]}` 
    };
  }
}

// Contar ocupación de una clase (reservados + asistieron)
function getOcupacionClase(claseId) {
  const ocupados = get(`
    SELECT COUNT(*) as count
    FROM reservas
    WHERE clase_id = ? AND estado IN ('reservado', 'asistio')
  `, [claseId]);

  return ocupados ? ocupados.count : 0;
}

// Obtener detalle de clase con ocupación
function getClaseConOcupacion(claseId) {
  const clase = get(
    `SELECT c.*, tc.nombre as nombre, tc.descripcion as tipo_descripcion 
     FROM clases c 
     LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id 
     WHERE c.id = ?`,
    [claseId]
  );
  if (!clase) return null;

  const ocupados = getOcupacionClase(claseId);
  return {
    ...clase,
    ocupados,
    disponibles: clase.cupo - ocupados,
    porcentaje: clase.cupo > 0 ? Math.round((ocupados / clase.cupo) * 100) : 0,
  };
}

// Verificar si un socio está activo por token QR
function isSocioActivoByToken(qrToken) {
  // Buscar socio por token
  const socio = get('SELECT * FROM socios WHERE qr_token = ?', [qrToken]);
  
  if (!socio) {
    return { activo: false, motivo: 'Token no válido' };
  }

  return isSocioActivo(socio.id);
}

module.exports = {
  isSocioActivo,
  isSocioActivoByToken,
  getOcupacionClase,
  getClaseConOcupacion,
};

