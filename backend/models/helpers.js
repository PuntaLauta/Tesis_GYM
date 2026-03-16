const { query, get } = require('../db/database');

// Calcular estado recomendado de un socio según su último pago y duración del plan
function calcularEstadoSocioConPagos(socioId) {
  const socio = get(
    `
    SELECT s.*, p.duracion 
    FROM socios s 
    LEFT JOIN planes p ON s.plan_id = p.id 
    WHERE s.id = ?
  `,
    [socioId]
  );

  if (!socio) {
    return {
      estadoRecomendado: 'inactivo',
      diasDesdeVencimiento: null,
      motivo: 'Socio no encontrado',
    };
  }

  if (!socio.plan_id || !socio.duracion) {
    return {
      estadoRecomendado: 'inactivo',
      diasDesdeVencimiento: null,
      motivo: 'Socio sin plan asignado',
    };
  }

  const ultimoPago = get(
    `
    SELECT fecha 
    FROM pagos 
    WHERE socio_id = ? 
    ORDER BY fecha DESC 
    LIMIT 1
  `,
    [socioId]
  );

  if (!ultimoPago) {
    return {
      estadoRecomendado: 'inactivo',
      diasDesdeVencimiento: null,
      motivo: 'Socio sin pagos registrados',
    };
  }

  const fechaPago = new Date(ultimoPago.fecha);
  const fechaVencimiento = new Date(fechaPago);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + socio.duracion);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaVencimiento.setHours(0, 0, 0, 0);

  // Membresía vigente
  if (fechaVencimiento >= hoy) {
    return {
      estadoRecomendado: 'activo',
      diasDesdeVencimiento: 0,
      motivo: 'Membresía vigente',
    };
  }

  // Membresía vencida: calcular días desde vencimiento
  const diffTime = hoy - fechaVencimiento;
  const diasDesdeVencimiento = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diasDesdeVencimiento > 90) {
    return {
      estadoRecomendado: 'abandono',
      diasDesdeVencimiento,
      motivo: `Membresía vencida hace ${diasDesdeVencimiento} días (abandono)`,
    };
  }

  return {
    estadoRecomendado: 'inactivo',
    diasDesdeVencimiento,
    motivo: `Membresía vencida el ${fechaVencimiento.toISOString().split('T')[0]}`,
  };
}

// Verificar si un socio está activo usando el cálculo anterior
function isSocioActivo(socioId) {
  const { estadoRecomendado, diasDesdeVencimiento, motivo } =
    calcularEstadoSocioConPagos(socioId);

  return {
    activo: estadoRecomendado === 'activo',
    motivo,
    estadoRecomendado,
    diasDesdeVencimiento,
  };
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
    `SELECT c.*, tc.nombre as nombre, tc.descripcion as tipo_descripcion,
            i.nombre as instructor_nombre, i.id as instructor_id,
            ec.nombre as estado
     FROM clases c 
     LEFT JOIN tipo_clase tc ON c.tipo_clase_id = tc.id 
     LEFT JOIN instructores i ON c.instructor_id = i.id
     LEFT JOIN estado_clase ec ON c.estado_clase_id = ec.id
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

  const resultado = calcularEstadoSocioConPagos(socio.id);

  return {
    activo: resultado.estadoRecomendado === 'activo',
    motivo: resultado.motivo,
    estadoRecomendado: resultado.estadoRecomendado,
    diasDesdeVencimiento: resultado.diasDesdeVencimiento,
  };
}

module.exports = {
  calcularEstadoSocioConPagos,
  isSocioActivo,
  isSocioActivoByToken,
  getOcupacionClase,
  getClaseConOcupacion,
};

