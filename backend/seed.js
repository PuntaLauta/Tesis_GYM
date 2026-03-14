const bcrypt = require('bcrypt');
const { dbPromise, run, insert, query, getDatabase } = require('./db/database');

// Función para generar token de 6 dígitos único
function generarToken6Digitos() {
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

async function seed() {
  console.log('🌱 Iniciando seed...');

  // Esperar a que la base de datos se inicialice
  await dbPromise;

  // Hashear contraseñas
  const juanHash = await bcrypt.hash('juan123', 10);
  const mariaHash = await bcrypt.hash('maria123', 10);
  const carlosHash = await bcrypt.hash('carlos123', 10);
  const luisHash = await bcrypt.hash('luis123', 10);
  const anaHash = await bcrypt.hash('ana123', 10);
  const pedroHash = await bcrypt.hash('pedro123', 10);
  const lauraHash = await bcrypt.hash('laura123', 10);
  const robertoHash = await bcrypt.hash('roberto123', 10);
  const carmenHash = await bcrypt.hash('carmen123', 10);
  const miguelHash = await bcrypt.hash('miguel123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const rootHash = await bcrypt.hash('root123', 10);

  // Hashear contraseñas para socios demo extra
  const demoActivo1Hash = await bcrypt.hash('demoactivo1123', 10);
  const demoSuspendido1Hash = await bcrypt.hash('demosuspendido1123', 10);
  const demoSuspendido2Hash = await bcrypt.hash('demosuspendido2123', 10);
  const demoSuspendido3Hash = await bcrypt.hash('demosuspendido3123', 10);
  const demoInactivo1Hash = await bcrypt.hash('demoinactivo1123', 10);
  const demoInactivo2Hash = await bcrypt.hash('demoinactivo2123', 10);
  const demoInactivo3Hash = await bcrypt.hash('demoinactivo3123', 10);
  const demoAbandono1Hash = await bcrypt.hash('demoabandono1123', 10);
  const demoAbandono2Hash = await bcrypt.hash('demoabandono2123', 10);
  const demoAbandono3Hash = await bcrypt.hash('demoabandono3123', 10);

  // Eliminar datos demo anteriores
  // Primero eliminar reservas y pagos asociados a socios de usuarios demo
  run(`
    DELETE FROM reservas 
    WHERE socio_id IN (
      SELECT id FROM socios 
      WHERE usuario_id IN (
        SELECT id FROM usuarios 
        WHERE email LIKE '%@demo.com' OR email LIKE '%@clientes.com'
      )
    )
  `);
  run(`
    DELETE FROM pagos 
    WHERE socio_id IN (
      SELECT id FROM socios 
      WHERE usuario_id IN (
        SELECT id FROM usuarios 
        WHERE email LIKE '%@demo.com' OR email LIKE '%@clientes.com'
      )
    )
  `);
  // Eliminar socios asociados a usuarios demo
  run(`
    DELETE FROM socios 
    WHERE usuario_id IN (
      SELECT id FROM usuarios 
      WHERE email LIKE '%@demo.com' OR email LIKE '%@clientes.com'
    )
  `);
  // Luego eliminar usuarios demo
  run("DELETE FROM usuarios WHERE email LIKE '%@demo.com' OR email LIKE '%@clientes.com'");

  // Asegurar que los usuarios especiales (admin/root) no se dupliquen si el seed se ejecuta varias veces
  run("DELETE FROM usuarios WHERE email IN ('admin@gym.com', 'root@gym.com')");

  // Insertar usuarios demo y obtener sus IDs
  const juanUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Juan Pérez', 'juan@clientes.com', juanHash, 'cliente']
  );

  const mariaUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['María González', 'maria@clientes.com', mariaHash, 'cliente']
  );

  const carlosUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Carlos Rodríguez', 'carlos@clientes.com', carlosHash, 'cliente']
  );

  const luisUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Luis Martínez', 'luis@clientes.com', luisHash, 'cliente']
  );

  // Nuevos usuarios con credenciales
  const anaUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Ana Martínez', 'ana@clientes.com', anaHash, 'cliente']
  );

  const pedroUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Pedro Sánchez', 'pedro@clientes.com', pedroHash, 'cliente']
  );

  const lauraUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Laura Fernández', 'laura@clientes.com', lauraHash, 'cliente']
  );

  const robertoUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Roberto Díaz', 'roberto@clientes.com', robertoHash, 'cliente']
  );

  const carmenUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Carmen López', 'carmen@clientes.com', carmenHash, 'cliente']
  );

  const miguelUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Miguel Torres', 'miguel@clientes.com', miguelHash, 'cliente']
  );

  // Usuarios para socios demo extra (correo @clientes.com y contraseña nombrecliente123)
  const demoActivo1Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Activo 1', 'demoactivo1@clientes.com', demoActivo1Hash, 'cliente']
  );

  const demoSuspendido1Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Suspendido 1', 'demosuspendido1@clientes.com', demoSuspendido1Hash, 'cliente']
  );

  const demoSuspendido2Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Suspendido 2', 'demosuspendido2@clientes.com', demoSuspendido2Hash, 'cliente']
  );

  const demoSuspendido3Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Suspendido 3', 'demosuspendido3@clientes.com', demoSuspendido3Hash, 'cliente']
  );

  const demoInactivo1Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Inactivo 1', 'demoinactivo1@clientes.com', demoInactivo1Hash, 'cliente']
  );

  const demoInactivo2Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Inactivo 2', 'demoinactivo2@clientes.com', demoInactivo2Hash, 'cliente']
  );

  const demoInactivo3Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Inactivo 3', 'demoinactivo3@clientes.com', demoInactivo3Hash, 'cliente']
  );

  const demoAbandono1Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Abandono 1', 'demoabandono1@clientes.com', demoAbandono1Hash, 'cliente']
  );

  const demoAbandono2Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Abandono 2', 'demoabandono2@clientes.com', demoAbandono2Hash, 'cliente']
  );

  const demoAbandono3Usuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Demo Abandono 3', 'demoabandono3@clientes.com', demoAbandono3Hash, 'cliente']
  );

  const adminUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Admin Demo', 'admin@gym.com', adminHash, 'admin']
  );
  insert('INSERT INTO admins (usuario_id, estado) VALUES (?, 1)', [adminUsuario.lastInsertRowid]);

  const rootUsuario = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Root Demo', 'root@gym.com', rootHash, 'root']
  );
  insert('INSERT INTO roots (usuario_id, estado) VALUES (?, 1)', [rootUsuario.lastInsertRowid]);

  // Eliminar instructores demo anteriores
  // Primero eliminar clases asociadas a instructores demo
  run(`
    UPDATE clases 
    SET instructor_id = NULL 
    WHERE instructor_id IN (
      SELECT id FROM instructores 
      WHERE email LIKE '%@instructores.com' OR email = 'carlos' OR email = 'sofia' OR email = 'diego'
    )
  `);
  
  // Eliminar usuarios instructores demo
  run("DELETE FROM usuarios WHERE email LIKE '%@instructores.com' OR (rol = 'instructor' AND email IN ('carlos', 'sofia', 'diego'))");
  
  // Eliminar instructores demo
  run("DELETE FROM instructores WHERE email LIKE '%@instructores.com' OR email IN ('carlos', 'sofia', 'diego')");

  // Crear instructores: primero usuario, luego instructor con usuario_id
  const carlosMendozaHash = await bcrypt.hash('carlos123', 10);
  const sofiaRamirezHash = await bcrypt.hash('sofia123', 10);
  const diegoTorresHash = await bcrypt.hash('diego123', 10);

  const carlosUsuarioInstructor = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Carlos Mendoza', 'carlos@instructores.com', carlosMendozaHash, 'instructor']
  );
  insert(
    'INSERT INTO instructores (usuario_id, nombre, email, telefono, activo) VALUES (?, ?, ?, ?, ?)',
    [carlosUsuarioInstructor.lastInsertRowid, 'Carlos Mendoza', 'carlos@instructores.com', '3811234567', 1]
  );

  const sofiaUsuarioInstructor = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Sofía Ramírez', 'sofia@instructores.com', sofiaRamirezHash, 'instructor']
  );
  insert(
    'INSERT INTO instructores (usuario_id, nombre, email, telefono, activo) VALUES (?, ?, ?, ?, ?)',
    [sofiaUsuarioInstructor.lastInsertRowid, 'Sofía Ramírez', 'sofia@instructores.com', '3812345678', 1]
  );

  const diegoUsuarioInstructor = insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Diego Torres', 'diego@instructores.com', diegoTorresHash, 'instructor']
  );
  insert(
    'INSERT INTO instructores (usuario_id, nombre, email, telefono, activo) VALUES (?, ?, ?, ?, ?)',
    [diegoUsuarioInstructor.lastInsertRowid, 'Diego Torres', 'diego@instructores.com', '3813456789', 1]
  );

  // Crear preguntas de seguridad para usuarios demo
  // Hashear respuestas (sin tildes para evitar problemas de coincidencia)
  const juanRespuestaHash = await bcrypt.hash('boca', 10);
  const mariaRespuestaHash = await bcrypt.hash('pizza', 10);
  const carlosRespuestaHash = await bcrypt.hash('cordoba', 10);
  const luisRespuestaHash = await bcrypt.hash('gonzalez', 10);
  const anaRespuestaHash = await bcrypt.hash('max', 10);
  const pedroRespuestaHash = await bcrypt.hash('asado', 10);
  const lauraRespuestaHash = await bcrypt.hash('buenosaires', 10);
  const robertoRespuestaHash = await bcrypt.hash('perez', 10);
  const carmenRespuestaHash = await bcrypt.hash('sanmartin', 10);
  const miguelRespuestaHash = await bcrypt.hash('toby', 10);

  // Hashear respuestas para instructores
  const carlosInstructorRespuestaHash = await bcrypt.hash('river', 10);
  const sofiaInstructorRespuestaHash = await bcrypt.hash('milanesa', 10);
  const diegoInstructorRespuestaHash = await bcrypt.hash('tucuman', 10);

  // Insertar preguntas de seguridad
  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [juanUsuario.lastInsertRowid, '¿Equipo de fútbol que seguís?', juanRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [mariaUsuario.lastInsertRowid, '¿Comida favorita?', mariaRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [carlosUsuario.lastInsertRowid, '¿Ciudad donde naciste?', carlosRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [luisUsuario.lastInsertRowid, '¿Apellido de soltera de tu madre?', luisRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [anaUsuario.lastInsertRowid, '¿Nombre de tu mascota?', anaRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [pedroUsuario.lastInsertRowid, '¿Comida favorita?', pedroRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [lauraUsuario.lastInsertRowid, '¿Ciudad donde naciste?', lauraRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [robertoUsuario.lastInsertRowid, '¿Apellido de soltera de tu madre?', robertoRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [carmenUsuario.lastInsertRowid, '¿Nombre de tu colegio primario?', carmenRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [miguelUsuario.lastInsertRowid, '¿Nombre de tu mascota?', miguelRespuestaHash]
  );

  // Insertar preguntas de seguridad para instructores
  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [carlosUsuarioInstructor.lastInsertRowid, '¿Equipo de fútbol que seguís?', carlosInstructorRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [sofiaUsuarioInstructor.lastInsertRowid, '¿Comida favorita?', sofiaInstructorRespuestaHash]
  );

  insert(
    `INSERT INTO preguntas_seguridad (usuario_id, pregunta, respuesta_hash) VALUES (?, ?, ?)`,
    [diegoUsuarioInstructor.lastInsertRowid, '¿Ciudad donde naciste?', diegoInstructorRespuestaHash]
  );

  // Crear algunas clases de ejemplo
  const { query } = require('./db/database');
  const hoy = new Date();
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);
  const pasadoMañana = new Date(hoy);
  pasadoMañana.setDate(pasadoMañana.getDate() + 2);

  // Crear o actualizar configuracion del gimnasio
  const configExistente = query('SELECT id FROM configuracion_gym WHERE id = 1');
  if (configExistente.length === 0) {
    insert(
      'INSERT INTO configuracion_gym (id, nombre, telefono, email, horarios_lunes_viernes, horarios_sabado) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 'Gimnasio', '381 000000', 'fitsense@gmail.com', 'Lunes a viernes: 7:00 a 23:00', 'Sabados: 8:00 a 20:00']
    );
  }

  // Crear o actualizar planes de ejemplo
  let planes = query('SELECT * FROM planes');
  if (planes.length === 0) {
    insert('INSERT INTO planes (nombre, duracion, precio) VALUES (?, ?, ?)', ['Mensual', 30, 5000]);
    insert('INSERT INTO planes (nombre, duracion, precio) VALUES (?, ?, ?)', ['Trimestral', 90, 13000]);
    planes = query('SELECT * FROM planes');
  } else {
    // Actualizar precio del plan trimestral si existe
    const planTrimestral = planes.find(p => p.nombre === 'Trimestral');
    if (planTrimestral && planTrimestral.precio !== 13000) {
      run('UPDATE planes SET precio = ? WHERE id = ?', [13000, planTrimestral.id]);
    }
    planes = query('SELECT * FROM planes');
  }

  // Eliminar solo reservas, pagos y accesos de socios existentes
  // NO eliminar socios, solo limpiar datos relacionados
  run('DELETE FROM reservas');
  run('DELETE FROM pagos');
  run('DELETE FROM accesos');
  
  // Eliminar socios que NO tienen usuario_id (socios sin credenciales)
  run('DELETE FROM socios WHERE usuario_id IS NULL');
  
  // Crear socios asociados a usuarios (10 socios con credenciales)
  const sociosConUsuario = [
    { nombre: 'Juan Pérez', documento: '40123456', telefono: '123456789', usuario: juanUsuario.lastInsertRowid, email: 'juan@clientes.com' },
    { nombre: 'María González', documento: '40987654', telefono: '987654321', usuario: mariaUsuario.lastInsertRowid, email: 'maria@clientes.com' },
    { nombre: 'Carlos Rodríguez', documento: '40555555', telefono: '555555555', usuario: carlosUsuario.lastInsertRowid, email: 'carlos@clientes.com' },
    { nombre: 'Luis Martínez', documento: '40778899', telefono: '777888999', usuario: luisUsuario.lastInsertRowid, email: 'luis@clientes.com' },
    { nombre: 'Ana Martínez', documento: '40111222', telefono: '111222333', usuario: anaUsuario.lastInsertRowid, email: 'ana@clientes.com' },
    { nombre: 'Pedro Sánchez', documento: '40444555', telefono: '444555666', usuario: pedroUsuario.lastInsertRowid, email: 'pedro@clientes.com' },
    { nombre: 'Laura Fernández', documento: '40222333', telefono: '222333444', usuario: lauraUsuario.lastInsertRowid, email: 'laura@clientes.com' },
    { nombre: 'Roberto Díaz', documento: '40333444', telefono: '333444555', usuario: robertoUsuario.lastInsertRowid, email: 'roberto@clientes.com' },
    { nombre: 'Carmen López', documento: '40666777', telefono: '666777888', usuario: carmenUsuario.lastInsertRowid, email: 'carmen@clientes.com' },
    { nombre: 'Miguel Torres', documento: '40888999', telefono: '888999000', usuario: miguelUsuario.lastInsertRowid, email: 'miguel@clientes.com' }
  ];

  const planMensual = planes.find(p => p.nombre === 'Mensual') || planes[0];
  const planTrimestral = planes.find(p => p.nombre === 'Trimestral') || planes[1];
  const planDuracionMensual = planMensual.duracion; // 30 días
  const planDuracionTrimestral = planTrimestral ? planTrimestral.duracion : 90; // 90 días

  // Configuración de estados y pagos para 20 socios demo:
  // 5 activos, 5 suspendidos, 5 inactivos, 5 en abandono
  const sociosConfig = [];

  // Primero, los 10 socios con usuario
  sociosConUsuario.forEach((item) => {
    let configBase = {
      nombre: item.nombre,
      documento: item.documento,
      telefono: item.telefono,
      usuarioId: item.usuario,
      estado: 'activo',
      canceladoPorAdmin: 0,
      plan: planMensual,
      diasAtrasPago: 1,
      notas: null,
    };

    switch (item.email) {
      case 'juan@clientes.com':
        // Activo, pago muy reciente
        configBase.estado = 'activo';
        configBase.canceladoPorAdmin = 0;
        configBase.plan = planMensual;
        configBase.diasAtrasPago = 1;
        configBase.notas = 'Socio con discapacidad - requiere asistencia en el acceso';
        break;
      case 'maria@clientes.com':
        // Activo, vence en ~3 días (trimestral)
        configBase.estado = 'activo';
        configBase.canceladoPorAdmin = 0;
        configBase.plan = planTrimestral;
        configBase.diasAtrasPago = planDuracionTrimestral - 3;
        configBase.notas = 'Alergia a productos de limpieza - usar productos hipoalergenicos';
        break;
      case 'carlos@clientes.com':
        // Activo, vence en ~5 días (mensual)
        configBase.estado = 'activo';
        configBase.canceladoPorAdmin = 0;
        configBase.plan = planMensual;
        configBase.diasAtrasPago = planDuracionMensual - 5;
        break;
      case 'luis@clientes.com':
        // Inactivo: cuota vencida hace menos de 90 días
        configBase.estado = 'inactivo';
        configBase.canceladoPorAdmin = 0;
        configBase.plan = planMensual;
        configBase.diasAtrasPago = planDuracionMensual + 45;
        break;
      case 'ana@clientes.com':
        // Activo, vence en ~2 días (trimestral)
        configBase.estado = 'activo';
        configBase.canceladoPorAdmin = 0;
        configBase.plan = planTrimestral;
        configBase.diasAtrasPago = planDuracionTrimestral - 2;
        break;
      case 'pedro@clientes.com':
        // Suspendido por admin
        configBase.estado = 'suspendido';
        configBase.canceladoPorAdmin = 1;
        configBase.plan = planMensual;
        configBase.diasAtrasPago = planDuracionMensual - 7;
        break;
      case 'laura@clientes.com':
        // Suspendido por admin
        configBase.estado = 'suspendido';
        configBase.canceladoPorAdmin = 1;
        configBase.plan = planTrimestral;
        configBase.diasAtrasPago = planDuracionTrimestral - 1;
        break;
      case 'roberto@clientes.com':
        // Abandono: vencido hace más de 90 días (mensual)
        configBase.estado = 'abandono';
        configBase.canceladoPorAdmin = 0;
        configBase.plan = planMensual;
        configBase.diasAtrasPago = planDuracionMensual + 120;
        break;
      case 'carmen@clientes.com':
        // Abandono: vencido hace más de 90 días (mensual)
        configBase.estado = 'abandono';
        configBase.canceladoPorAdmin = 0;
        configBase.plan = planMensual;
        configBase.diasAtrasPago = planDuracionMensual + 100;
        break;
      case 'miguel@clientes.com':
        // Inactivo: vencido hace menos de 90 días (trimestral)
        configBase.estado = 'inactivo';
        configBase.canceladoPorAdmin = 0;
        configBase.plan = planTrimestral;
        configBase.diasAtrasPago = planDuracionTrimestral + 30;
        break;
      default:
        break;
    }

    sociosConfig.push(configBase);
  });

  // Ahora, 10 socios adicionales con credenciales para completar 5 por estado
  const sociosExtras = [
    // Activos (faltan 1 para llegar a 5)
    {
      nombre: 'Demo Activo 1',
      documento: '50000001',
      telefono: '3810000001',
      usuarioId: demoActivo1Usuario.lastInsertRowid,
      estado: 'activo',
      canceladoPorAdmin: 0,
      plan: planMensual,
      diasAtrasPago: 2,
      notas: null,
    },
    // Suspendidos (faltan 3 para llegar a 5)
    {
      nombre: 'Demo Suspendido 1',
      documento: '50000002',
      telefono: '3810000002',
      usuarioId: demoSuspendido1Usuario.lastInsertRowid,
      estado: 'suspendido',
      canceladoPorAdmin: 1,
      plan: planMensual,
      diasAtrasPago: planDuracionMensual - 10,
      notas: null,
    },
    {
      nombre: 'Demo Suspendido 2',
      documento: '50000003',
      telefono: '3810000003',
      usuarioId: demoSuspendido2Usuario.lastInsertRowid,
      estado: 'suspendido',
      canceladoPorAdmin: 1,
      plan: planMensual,
      diasAtrasPago: planDuracionMensual - 15,
      notas: null,
    },
    {
      nombre: 'Demo Suspendido 3',
      documento: '50000004',
      telefono: '3810000004',
      usuarioId: demoSuspendido3Usuario.lastInsertRowid,
      estado: 'suspendido',
      canceladoPorAdmin: 1,
      plan: planTrimestral,
      diasAtrasPago: planDuracionTrimestral - 20,
      notas: null,
    },
    // Inactivos (faltan 3 para llegar a 5)
    {
      nombre: 'Demo Inactivo 1',
      documento: '50000005',
      telefono: '3810000005',
      usuarioId: demoInactivo1Usuario.lastInsertRowid,
      estado: 'inactivo',
      canceladoPorAdmin: 0,
      plan: planMensual,
      diasAtrasPago: planDuracionMensual + 20,
      notas: null,
    },
    {
      nombre: 'Demo Inactivo 2',
      documento: '50000006',
      telefono: '3810000006',
      usuarioId: demoInactivo2Usuario.lastInsertRowid,
      estado: 'inactivo',
      canceladoPorAdmin: 0,
      plan: planMensual,
      diasAtrasPago: planDuracionMensual + 60,
      notas: null,
    },
    {
      nombre: 'Demo Inactivo 3',
      documento: '50000007',
      telefono: '3810000007',
      usuarioId: demoInactivo3Usuario.lastInsertRowid,
      estado: 'inactivo',
      canceladoPorAdmin: 0,
      plan: planTrimestral,
      diasAtrasPago: planDuracionTrimestral + 45,
      notas: null,
    },
    // Abandono (faltan 3 para llegar a 5)
    {
      nombre: 'Demo Abandono 1',
      documento: '50000008',
      telefono: '3810000008',
      usuarioId: demoAbandono1Usuario.lastInsertRowid,
      estado: 'abandono',
      canceladoPorAdmin: 0,
      plan: planMensual,
      diasAtrasPago: planDuracionMensual + 120,
      notas: null,
    },
    {
      nombre: 'Demo Abandono 2',
      documento: '50000009',
      telefono: '3810000009',
      usuarioId: demoAbandono2Usuario.lastInsertRowid,
      estado: 'abandono',
      canceladoPorAdmin: 0,
      plan: planMensual,
      diasAtrasPago: planDuracionMensual + 150,
      notas: null,
    },
    {
      nombre: 'Demo Abandono 3',
      documento: '50000010',
      telefono: '3810000010',
      usuarioId: demoAbandono3Usuario.lastInsertRowid,
      estado: 'abandono',
      canceladoPorAdmin: 0,
      plan: planTrimestral,
      diasAtrasPago: planDuracionTrimestral + 130,
      notas: null,
    },
  ];

  sociosExtras.forEach((extra) => sociosConfig.push(extra));

  // Mapeo nombre estado -> id en socio_estado (activo=1, inactivo=2, suspendido=3, abandono=4)
  const estadoIds = { activo: 1, inactivo: 2, suspendido: 3, abandono: 4 };

  // 20 fechas de fecha_cambio repartidas: Dec 2024, Jan 2026, Feb 2026, Mar 2026
  const fechasCambio = [
    '2024-12-01 09:00:00', '2024-12-05 10:15:00', '2024-12-10 11:30:00', '2024-12-15 14:00:00', '2024-12-20 16:45:00',
    '2026-01-02 08:00:00', '2026-01-08 09:30:00', '2026-01-12 10:00:00', '2026-01-18 13:15:00', '2026-01-25 15:30:00',
    '2026-02-01 09:00:00', '2026-02-07 11:00:00', '2026-02-14 14:30:00', '2026-02-20 10:00:00', '2026-02-25 16:00:00',
    '2026-03-01 08:30:00', '2026-03-05 12:00:00', '2026-03-10 09:45:00', '2026-03-15 11:15:00', '2026-03-20 14:00:00',
  ];

  // Crear o actualizar los 20 socios según configuración
  sociosConfig.forEach((cfg, index) => {
    let socioId;
    const socioEstadoId = estadoIds[cfg.estado] || 1;
    const fechaCambio = fechasCambio[index % fechasCambio.length];

    if (cfg.usuarioId) {
      const socioExistente = query('SELECT id FROM socios WHERE usuario_id = ?', [cfg.usuarioId]);

      if (socioExistente.length > 0) {
        socioId = socioExistente[0].id;
        run(
          'UPDATE socios SET nombre = ?, documento = ?, telefono = ?, socio_estado_id = ?, fecha_cambio = ?, cancelado_por_admin = ?, plan_id = ?, qr_token = ?, notas = ? WHERE id = ?',
          [
            cfg.nombre,
            cfg.documento,
            cfg.telefono,
            socioEstadoId,
            fechaCambio,
            cfg.canceladoPorAdmin,
            cfg.plan ? cfg.plan.id : null,
            generarToken6Digitos(),
            cfg.notas,
            socioId,
          ]
        );
      } else {
        const socio = insert(
          'INSERT INTO socios (nombre, documento, telefono, socio_estado_id, fecha_cambio, cancelado_por_admin, plan_id, usuario_id, qr_token, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            cfg.nombre,
            cfg.documento,
            cfg.telefono,
            socioEstadoId,
            fechaCambio,
            cfg.canceladoPorAdmin,
            cfg.plan ? cfg.plan.id : null,
            cfg.usuarioId,
            generarToken6Digitos(),
            cfg.notas,
          ]
        );
        socioId = socio.lastInsertRowid;
      }
    } else {
      const socio = insert(
        'INSERT INTO socios (nombre, documento, telefono, socio_estado_id, fecha_cambio, cancelado_por_admin, plan_id, usuario_id, qr_token, notas) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)',
        [
          cfg.nombre,
          cfg.documento,
          cfg.telefono,
          socioEstadoId,
          fechaCambio,
          cfg.canceladoPorAdmin,
          cfg.plan ? cfg.plan.id : null,
          generarToken6Digitos(),
          cfg.notas,
        ]
      );
      socioId = socio.lastInsertRowid;
    }

    // Eliminar pagos anteriores del socio
    run('DELETE FROM pagos WHERE socio_id = ?', [socioId]);

    // Crear pagos solo si hay plan y configuración de días
    if (cfg.plan && typeof cfg.diasAtrasPago === 'number') {
      const montoPago = cfg.plan.precio;
      const fechaPago = new Date();
      fechaPago.setDate(fechaPago.getDate() - cfg.diasAtrasPago);
      insert(
        'INSERT INTO pagos (socio_id, monto, fecha, metodo_pago) VALUES (?, ?, ?, ?)',
        [
          socioId,
          montoPago,
          fechaPago.toISOString().split('T')[0],
          index % 2 === 0 ? 'efectivo' : 'transferencia',
        ]
      );

      // Agregar pagos históricos adicionales (2-3 pagos más)
      const pagosAdicionales = Math.floor(Math.random() * 2) + 2; // 2 o 3 pagos
      for (let i = 1; i <= pagosAdicionales; i++) {
        const diasAtras = cfg.diasAtrasPago + cfg.plan.duracion * i;
        const fechaPagoHistorico = new Date();
        fechaPagoHistorico.setDate(fechaPagoHistorico.getDate() - diasAtras);
        const metodoPago = Math.random() > 0.5 ? 'efectivo' : 'transferencia';
        insert(
          'INSERT INTO pagos (socio_id, monto, fecha, metodo_pago) VALUES (?, ?, ?, ?)',
          [socioId, montoPago, fechaPagoHistorico.toISOString().split('T')[0], metodoPago]
        );
      }
    }
  });

  // Crear 40 pagos de prueba adicionales distribuidos entre los socios
  const sociosParaPagosExtra = query('SELECT id FROM socios');
  if (sociosParaPagosExtra.length > 0) {
    const hoyParaPagosExtra = new Date();
    for (let i = 0; i < 40; i++) {
      const socioRandom = sociosParaPagosExtra[Math.floor(Math.random() * sociosParaPagosExtra.length)];
      const diasAtrasRandom = Math.floor(Math.random() * 90); // últimos 90 días
      const fechaExtra = new Date(hoyParaPagosExtra);
      fechaExtra.setDate(fechaExtra.getDate() - diasAtrasRandom);
      const montoRandom = 4000 + Math.floor(Math.random() * 5000); // entre 4000 y 9000 aprox.
      const metodoRandom = Math.random() > 0.5 ? 'efectivo' : 'transferencia';

      insert(
        'INSERT INTO pagos (socio_id, monto, fecha, metodo_pago) VALUES (?, ?, ?, ?)',
        [
          socioRandom.id,
          montoRandom,
          fechaExtra.toISOString().split('T')[0],
          metodoRandom
        ]
      );
    }
  }

  // Obtener todos los IDs de socios para usar en accesos, reservas y rutinas
  const todosLosSocios = query(`
    SELECT s.id, se.nombre as estado
    FROM socios s
    LEFT JOIN socio_estado se ON s.socio_estado_id = se.id
    ORDER BY s.id
  `);
  const sociosActivos = todosLosSocios.filter(s => s.estado === 'activo');
  const sociosInactivos = todosLosSocios.filter(s => s.estado !== 'activo');

  // Limpiar datos dependientes antes de recrear clases, reservas, accesos y rutinas
  run('DELETE FROM reservas');
  run('DELETE FROM accesos');
  run('DELETE FROM clases');
  run('DELETE FROM rutina_ejercicio');
  run('DELETE FROM rutinas');
  
  // Obtener o crear tipos de clase (al menos 10 tipos para pruebas de reportes)
  let tipoCrossfit = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['Crossfit']);
  if (tipoCrossfit.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['Crossfit', 'Entrenamiento funcional de alta intensidad']);
    tipoCrossfit = [{ id: result.lastInsertRowid }];
  }
  
  let tipoZumba = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['Zumba']);
  if (tipoZumba.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['Zumba', 'Clase aeróbica grupal con música']);
    tipoZumba = [{ id: result.lastInsertRowid }];
  }
  
  let tipoFuncional = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['Funcional']);
  if (tipoFuncional.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['Funcional', 'Entrenamiento funcional general']);
    tipoFuncional = [{ id: result.lastInsertRowid }];
  }
  
  let tipoBoxeo = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['Boxeo']);
  if (tipoBoxeo.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['Boxeo', 'Clase de boxeo y cardio']);
    tipoBoxeo = [{ id: result.lastInsertRowid }];
  }

  let tipoYoga = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['Yoga']);
  if (tipoYoga.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['Yoga', 'Clase de movilidad y relajación']);
    tipoYoga = [{ id: result.lastInsertRowid }];
  }

  let tipoPilates = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['Pilates']);
  if (tipoPilates.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['Pilates', 'Trabajo de core y control postural']);
    tipoPilates = [{ id: result.lastInsertRowid }];
  }

  let tipoSpinning = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['Spinning']);
  if (tipoSpinning.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['Spinning', 'Ciclismo indoor']);
    tipoSpinning = [{ id: result.lastInsertRowid }];
  }

  let tipoHIIT = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['HIIT']);
  if (tipoHIIT.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['HIIT', 'Entrenamiento interválico de alta intensidad']);
    tipoHIIT = [{ id: result.lastInsertRowid }];
  }

  let tipoStretching = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['Stretching']);
  if (tipoStretching.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['Stretching', 'Clase de estiramientos y recuperación']);
    tipoStretching = [{ id: result.lastInsertRowid }];
  }

  let tipoCardio = query('SELECT id FROM tipo_clase WHERE nombre = ?', ['Cardio']);
  if (tipoCardio.length === 0) {
    const result = insert('INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)', ['Cardio', 'Entrenamiento aeróbico general']);
    tipoCardio = [{ id: result.lastInsertRowid }];
  }

  // Mapear instructores por nombre a ID (ya insertados con usuario_id)
  const carlosRow = query('SELECT id FROM instructores WHERE email = ?', ['carlos@instructores.com']);
  const sofiaRow = query('SELECT id FROM instructores WHERE email = ?', ['sofia@instructores.com']);
  const diegoRow = query('SELECT id FROM instructores WHERE email = ?', ['diego@instructores.com']);
  const instructorMap = {
    'Carlos Mendoza': carlosRow[0]?.id,
    'Sofía Ramírez': sofiaRow[0]?.id,
    'Diego Torres': diegoRow[0]?.id
  };

  const tipoClaseMap = {
    Crossfit: tipoCrossfit[0].id,
    Zumba: tipoZumba[0].id,
    Funcional: tipoFuncional[0].id,
    Boxeo: tipoBoxeo[0].id,
    Yoga: tipoYoga[0].id,
    Pilates: tipoPilates[0].id,
    Spinning: tipoSpinning[0].id,
    HIIT: tipoHIIT[0].id,
    Stretching: tipoStretching[0].id,
    Cardio: tipoCardio[0].id,
  };
  
  // Crear clases variadas distribuidas en varios meses y tipos
  // Redistribución: Carlos → Funcional / Boxeo / HIIT / Spinning, Diego → Crossfit / Cardio, Sofía → Zumba / Yoga / Pilates / Stretching
  const clasesData = [
    // Hace ~3 meses
    { nombre: 'Crossfit',   fecha: -90, hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Diego Torres',  estado: 'activa' },
    { nombre: 'Zumba',      fecha: -88, hora: '18:00', fin: '19:00', cupo: 18, instructor: 'Sofía Ramírez', estado: 'activa' },
    { nombre: 'Yoga',       fecha: -87, hora: '09:00', fin: '10:00', cupo: 16, instructor: 'Sofía Ramírez', estado: 'activa' },
    { nombre: 'Spinning',   fecha: -85, hora: '19:00', fin: '20:00', cupo: 22, instructor: 'Carlos Mendoza', estado: 'activa' },

    // Hace ~2 meses
    { nombre: 'Funcional',  fecha: -60, hora: '19:00', fin: '20:00', cupo: 25, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Boxeo',      fecha: -58, hora: '20:00', fin: '21:00', cupo: 15, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Pilates',    fecha: -56, hora: '17:00', fin: '18:00', cupo: 14, instructor: 'Sofía Ramírez',  estado: 'activa' },
    { nombre: 'Cardio',     fecha: -55, hora: '07:00', fin: '08:00', cupo: 20, instructor: 'Diego Torres',   estado: 'activa' },

    // Hace ~1 mes
    { nombre: 'HIIT',       fecha: -30, hora: '19:30', fin: '20:15', cupo: 18, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Stretching', fecha: -28, hora: '10:00', fin: '11:00', cupo: 16, instructor: 'Sofía Ramírez',  estado: 'activa' },
    { nombre: 'Crossfit',   fecha: -25, hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Diego Torres',   estado: 'activa' },
    { nombre: 'Zumba',      fecha: -24, hora: '18:00', fin: '19:00', cupo: 18, instructor: 'Sofía Ramírez',  estado: 'activa' },

    // Semana actual
    { nombre: 'Funcional',  fecha: -3,  hora: '19:00', fin: '20:00', cupo: 25, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Boxeo',      fecha: -2,  hora: '20:00', fin: '21:00', cupo: 15, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Crossfit',   fecha: 0,   hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Diego Torres',   estado: 'activa' },
    { nombre: 'Zumba',      fecha: 0,   hora: '18:00', fin: '19:00', cupo: 18, instructor: 'Sofía Ramírez',  estado: 'activa' },
    { nombre: 'Yoga',       fecha: 1,   hora: '09:00', fin: '10:00', cupo: 16, instructor: 'Sofía Ramírez',  estado: 'activa' },

    // Pr&oacute;ximas semanas
    { nombre: 'Spinning',   fecha: 3,   hora: '19:00', fin: '20:00', cupo: 22, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'HIIT',       fecha: 5,   hora: '19:30', fin: '20:15', cupo: 18, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Pilates',    fecha: 7,   hora: '17:00', fin: '18:00', cupo: 14, instructor: 'Sofía Ramírez',  estado: 'activa' },
    { nombre: 'Stretching', fecha: 10,  hora: '10:00', fin: '11:00', cupo: 16, instructor: 'Sofía Ramírez',  estado: 'activa' },
    { nombre: 'Cardio',     fecha: 14,  hora: '07:00', fin: '08:00', cupo: 20, instructor: 'Diego Torres',   estado: 'activa' },
  ];

  // Verificar si la columna nombre existe en clases (para compatibilidad con migraciones anteriores)
  let tieneColumnaNombre = false;
  try {
    const db = getDatabase();
    const tableInfo = db.exec("PRAGMA table_info(clases)");
    if (tableInfo && tableInfo[0] && tableInfo[0].values) {
      tieneColumnaNombre = tableInfo[0].values.some(row => row[1] === 'nombre');
    }
  } catch (e) {
    // Error al verificar, asumir que no existe
  }

  const clasesCreadas = [];
  clasesData.forEach(claseData => {
    const fechaClase = new Date();
    fechaClase.setDate(fechaClase.getDate() + claseData.fecha);
    const tipoClaseId = tipoClaseMap[claseData.nombre];
    const instructorId = instructorMap[claseData.instructor];
    
    // Construir query según si existe la columna nombre
    let sql, params;
    if (tieneColumnaNombre) {
      sql = `INSERT INTO clases (nombre, tipo_clase_id, fecha, hora_inicio, hora_fin, cupo, instructor_id, instructor, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        claseData.nombre,
        tipoClaseId,
        fechaClase.toISOString().split('T')[0],
        claseData.hora,
        claseData.fin,
        claseData.cupo,
        instructorId,
        claseData.instructor,
        claseData.estado
      ];
    } else {
      sql = `INSERT INTO clases (tipo_clase_id, fecha, hora_inicio, hora_fin, cupo, instructor_id, instructor, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        tipoClaseId,
        fechaClase.toISOString().split('T')[0],
        claseData.hora,
        claseData.fin,
        claseData.cupo,
        instructorId,
        claseData.instructor,
        claseData.estado
      ];
    }
    
    const clase = insert(sql, params);
    clasesCreadas.push({ id: clase.lastInsertRowid, ...claseData });
  });

  // --------------------------------------------------------
  // Crear tipos de rutina, ejercicios base y rutinas de ejemplo
  // --------------------------------------------------------

  // Crear tipos de rutina si no existen
  let tiposRutina = query('SELECT * FROM tipo_rutina');
  if (tiposRutina.length === 0) {
    insert(
      'INSERT INTO tipo_rutina (nombre, descripcion) VALUES (?, ?)',
      ['Fuerza', 'Rutinas enfocadas en el aumento de fuerza máxima']
    );
    insert(
      'INSERT INTO tipo_rutina (nombre, descripcion) VALUES (?, ?)',
      ['Hipertrofia', 'Rutinas orientadas a aumento de masa muscular']
    );
    insert(
      'INSERT INTO tipo_rutina (nombre, descripcion) VALUES (?, ?)',
      ['Full Body', 'Rutinas que trabajan todo el cuerpo en una misma sesión']
    );
    tiposRutina = query('SELECT * FROM tipo_rutina');
  }

  // Crear ejercicios base si no existen
  let ejerciciosBase = query('SELECT * FROM ejercicios');
  if (ejerciciosBase.length === 0) {
    insert(
      'INSERT INTO ejercicios (nombre, series, repeticiones, descripcion) VALUES (?, ?, ?, ?)',
      ['Sentadilla con barra', 4, '6-8', 'Ejercicio básico de fuerza para tren inferior (cuádriceps, glúteos, core).']
    );
    insert(
      'INSERT INTO ejercicios (nombre, series, repeticiones, descripcion) VALUES (?, ?, ?, ?)',
      ['Press banca', 4, '6-8', 'Trabajo de pecho, hombros y tríceps con barra en banco plano.']
    );
    insert(
      'INSERT INTO ejercicios (nombre, series, repeticiones, descripcion) VALUES (?, ?, ?, ?)',
      ['Peso muerto', 3, '5-6', 'Ejercicio de fuerza para cadena posterior (espalda baja, glúteos, isquiosurales).']
    );
    insert(
      'INSERT INTO ejercicios (nombre, series, repeticiones, descripcion) VALUES (?, ?, ?, ?)',
      ['Remo con barra', 3, '8-10', 'Ejercicio para espalda media y bíceps.']
    );
    insert(
      'INSERT INTO ejercicios (nombre, series, repeticiones, descripcion) VALUES (?, ?, ?, ?)',
      ['Press militar', 3, '8-10', 'Trabajo de hombros y tríceps de pie con barra o mancuernas.']
    );
    ejerciciosBase = query('SELECT * FROM ejercicios');
  }

  // Crear algunas rutinas de ejemplo para los primeros socios activos
  const tiposRutinaMap = {};
  tiposRutina.forEach(tr => { tiposRutinaMap[tr.nombre] = tr.id; });

  const ejerciciosPorNombre = {};
  ejerciciosBase.forEach(ej => { ejerciciosPorNombre[ej.nombre] = ej; });

  // Solo si hay socios activos, crear rutinas
  if (sociosActivos.length > 0) {
    const socioPrincipal = sociosActivos[0];
    const socioSecundario = sociosActivos[1] || sociosActivos[0];

    // Rutina de Fuerza para el primer socio
    const rutinaFuerza = insert(
      `INSERT INTO rutinas (socio_id, tipo_rutina_id, nombre, descripcion, ejercicios, fecha_inicio, activa)
       VALUES (?, ?, ?, ?, ?, date('now'), 1)`,
      [
        socioPrincipal.id,
        tiposRutinaMap['Fuerza'] || null,
        'Fuerza básica 3 días',
        'Rutina de fuerza para todo el cuerpo, 3 días por semana.',
        JSON.stringify(['Sentadilla con barra', 'Press banca', 'Peso muerto', 'Remo con barra', 'Press militar'])
      ]
    );

    const rutinaFuerzaId = rutinaFuerza.lastInsertRowid;

    // Asociar ejercicios a la rutina de fuerza
    const ordenEjerciciosFuerza = [
      'Sentadilla con barra',
      'Press banca',
      'Peso muerto',
      'Remo con barra',
      'Press militar'
    ];

    ordenEjerciciosFuerza.forEach((nombreEjercicio, index) => {
      const ejercicio = ejerciciosPorNombre[nombreEjercicio];
      if (ejercicio) {
        insert(
          `INSERT INTO rutina_ejercicio (rutina_id, ejercicio_id, series, repeticiones, orden)
           VALUES (?, ?, ?, ?, ?)`,
          [
            rutinaFuerzaId,
            ejercicio.id,
            ejercicio.series,
            ejercicio.repeticiones,
            index + 1
          ]
        );
      }
    });

    // Rutina Full Body para segundo socio
    const rutinaFullBody = insert(
      `INSERT INTO rutinas (socio_id, tipo_rutina_id, nombre, descripcion, ejercicios, fecha_inicio, activa)
       VALUES (?, ?, ?, ?, ?, date('now'), 1)`,
      [
        socioSecundario.id,
        tiposRutinaMap['Full Body'] || null,
        'Full Body iniciación',
        'Rutina full body pensada para 2-3 veces por semana.',
        JSON.stringify(['Sentadilla con barra', 'Press banca', 'Remo con barra'])
      ]
    );

    const rutinaFullBodyId = rutinaFullBody.lastInsertRowid;

    const ordenEjerciciosFullBody = [
      'Sentadilla con barra',
      'Press banca',
      'Remo con barra'
    ];

    ordenEjerciciosFullBody.forEach((nombreEjercicio, index) => {
      const ejercicio = ejerciciosPorNombre[nombreEjercicio];
      if (ejercicio) {
        insert(
          `INSERT INTO rutina_ejercicio (rutina_id, ejercicio_id, series, repeticiones, orden)
           VALUES (?, ?, ?, ?, ?)`,
          [
            rutinaFullBodyId,
            ejercicio.id,
            ejercicio.series,
            ejercicio.repeticiones,
            index + 1
          ]
        );
      }
    });
  }

  // Crear reservas para al menos 6 socios activos
  // Limitar a 1 reserva por día por socio
  const sociosParaReservar = sociosActivos.slice(0, 6); // Primeros 6 socios activos
  const reservasCreadas = [];
  const reservasPorSocioPorDia = {}; // { 'socio_id-fecha': true }

  clasesCreadas.forEach((clase, idx) => {
    // Para cada clase, asignar reservas aleatorias
    const numReservas = Math.floor(Math.random() * (clase.cupo * 0.7)) + 1; // 1 a 70% del cupo
    const sociosAleatorios = [...sociosParaReservar].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numReservas, sociosAleatorios.length); i++) {
      const socio = sociosAleatorios[i];
      
      // Verificar que el socio no tenga ya una reserva en este día
      const fechaClase = new Date();
      fechaClase.setDate(fechaClase.getDate() + clase.fecha);
      const fechaClaseStr = fechaClase.toISOString().split('T')[0];
      const keyReserva = `${socio.id}-${fechaClaseStr}`;
      
      if (reservasPorSocioPorDia[keyReserva]) {
        // Este socio ya tiene una reserva en este día, saltar
        continue;
      }
      
      const estadoReserva = Math.random() > 0.1 ? 'reservado' : (Math.random() > 0.5 ? 'asistio' : 'cancelado');
      
      try {
        // Calcular fecha de reserva (antes de la clase)
        const fechaReserva = new Date();
        fechaReserva.setDate(fechaReserva.getDate() + clase.fecha - Math.floor(Math.random() * 3)); // 0-2 días antes
        const fechaReservaStr = fechaReserva.toISOString().replace('T', ' ').substring(0, 19);
        
        const reserva = insert(
          `INSERT INTO reservas (clase_id, socio_id, estado, ts) VALUES (?, ?, ?, ?)`,
          [clase.id, socio.id, estadoReserva, fechaReservaStr]
        );
        reservasCreadas.push({ id: reserva.lastInsertRowid, clase_id: clase.id, socio_id: socio.id });
        reservasPorSocioPorDia[keyReserva] = true; // Marcar que este socio ya tiene reserva en este día
      } catch (e) {
        // Ignorar errores de duplicados (ya reservado)
      }
    }
  });

  // Crear accesos registrados
  // Accesos para socios activos (mayormente permitidos)
  sociosActivos.forEach(socio => {
    const numAccesos = Math.floor(Math.random() * 8) + 5; // 5 a 12 accesos
    for (let i = 0; i < numAccesos; i++) {
      const diasAtras = Math.floor(Math.random() * 30); // Últimos 30 días
      const fechaAcceso = new Date();
      fechaAcceso.setDate(fechaAcceso.getDate() - diasAtras);
      fechaAcceso.setHours(Math.floor(Math.random() * 12) + 7, Math.floor(Math.random() * 60), 0); // Entre 7:00 y 19:00
      
      const permitido = Math.random() > 0.05 ? 1 : 0; // 95% permitidos
      const motivo = permitido ? 'Socio activo' : 'Verificación pendiente';
      
      insert(
        `INSERT INTO accesos (socio_id, fecha_hora, permitido, motivo) VALUES (?, ?, ?, ?)`,
        [socio.id, fechaAcceso.toISOString(), permitido, motivo]
      );
    }
  });

  // Accesos para socios inactivos (mayormente denegados)
  sociosInactivos.forEach(socio => {
    const numAccesos = Math.floor(Math.random() * 5) + 2; // 2 a 6 accesos
    for (let i = 0; i < numAccesos; i++) {
      const diasAtras = Math.floor(Math.random() * 60); // Últimos 60 días
      const fechaAcceso = new Date();
      fechaAcceso.setDate(fechaAcceso.getDate() - diasAtras);
      fechaAcceso.setHours(Math.floor(Math.random() * 12) + 7, Math.floor(Math.random() * 60), 0);
      
      const permitido = Math.random() > 0.8 ? 1 : 0; // 20% permitidos
      const motivo = permitido ? 'Acceso especial' : 'Membresía vencida';
      
      insert(
        `INSERT INTO accesos (socio_id, fecha_hora, permitido, motivo) VALUES (?, ?, ?, ?)`,
        [socio.id, fechaAcceso.toISOString(), permitido, motivo]
      );
    }
  });

  // Obtener IDs de socios creados para mostrar
  const sociosFinales = query(`
    SELECT s.id, s.nombre, se.nombre as estado, s.usuario_id
    FROM socios s
    LEFT JOIN socio_estado se ON s.socio_estado_id = se.id
    ORDER BY s.id
  `);

  console.log('✅ Seed completado:');
  console.log('\n👤 Usuarios con credenciales:');
  console.log('   - juan@clientes.com / juan123 → cliente (Juan Pérez) - ACTIVO');
  console.log('     Pregunta: ¿Equipo de fútbol que seguís? → Respuesta: boca');
  console.log('   - maria@clientes.com / maria123 → cliente (María González) - ACTIVO (Vence en 3 días)');
  console.log('     Pregunta: ¿Comida favorita? → Respuesta: pizza');
  console.log('   - carlos@clientes.com / carlos123 → cliente (Carlos Rodríguez) - ACTIVO (Vence en 5 días)');
  console.log('     Pregunta: ¿Ciudad donde naciste? → Respuesta: cordoba');
  console.log('   - luis@clientes.com / luis123 → cliente (Luis Martínez) - INACTIVO');
  console.log('     Pregunta: ¿Apellido de soltera de tu madre? → Respuesta: gonzalez');
  console.log('   - ana@clientes.com / ana123 → cliente (Ana Martínez) - ACTIVO (Vence en 2 días)');
  console.log('     Pregunta: ¿Nombre de tu mascota? → Respuesta: max');
  console.log('   - pedro@clientes.com / pedro123 → cliente (Pedro Sánchez) - ACTIVO (Vence en 7 días)');
  console.log('     Pregunta: ¿Comida favorita? → Respuesta: asado');
  console.log('   - laura@clientes.com / laura123 → cliente (Laura Fernández) - ACTIVO (Vence en 1 día)');
  console.log('     Pregunta: ¿Ciudad donde naciste? → Respuesta: buenosaires');
  console.log('   - roberto@clientes.com / roberto123 → cliente (Roberto Díaz) - ACTIVO');
  console.log('     Pregunta: ¿Apellido de soltera de tu madre? → Respuesta: perez');
  console.log('   - carmen@clientes.com / carmen123 → cliente (Carmen López) - ACTIVO (Vence en 4 días)');
  console.log('     Pregunta: ¿Nombre de tu colegio primario? → Respuesta: sanmartin');
  console.log('   - miguel@clientes.com / miguel123 → cliente (Miguel Torres) - INACTIVO');
  console.log('     Pregunta: ¿Nombre de tu mascota? → Respuesta: toby');
  console.log('   - admin@gym.com / admin123 → admin');
  console.log('   - root@gym.com / root123 → root');
  console.log('   - carlos@instructores.com / carlos123 → instructor (Carlos Mendoza)');
  console.log('     Pregunta: ¿Equipo de fútbol que seguís? → Respuesta: river');
  console.log('   - sofia@instructores.com / sofia123 → instructor (Sofía Ramírez)');
  console.log('     Pregunta: ¿Comida favorita? → Respuesta: milanesa');
  console.log('   - diego@instructores.com / diego123 → instructor (Diego Torres)');
  console.log('     Pregunta: ¿Ciudad donde naciste? → Respuesta: tucuman');
  console.log('\n📋 Socios creados (todos con credenciales):');
  sociosFinales.forEach(socio => {
    const tieneUsuario = socio.usuario_id ? '✅ Con credenciales' : '❌ Sin credenciales';
    console.log(`   - ID ${socio.id}: ${socio.nombre} (${socio.estado}) - ${tieneUsuario}`);
  });
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error en seed:', error);
  process.exit(1);
});
