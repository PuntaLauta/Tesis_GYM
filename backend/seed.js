const bcrypt = require('bcrypt');
const { dbPromise, run, insert, query } = require('./db/database');

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
  const adminHash = await bcrypt.hash('admin123', 10);
  const rootHash = await bcrypt.hash('root123', 10);

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

  insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Admin Demo', 'admin@demo.com', adminHash, 'admin']
  );

  insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Root Demo', 'root@demo.com', rootHash, 'root']
  );

  // Crear preguntas de seguridad para usuarios demo
  // Hashear respuestas (sin tildes para evitar problemas de coincidencia)
  const juanRespuestaHash = await bcrypt.hash('boca', 10); // Equipo de fútbol
  const mariaRespuestaHash = await bcrypt.hash('pizza', 10); // Comida favorita
  const carlosRespuestaHash = await bcrypt.hash('cordoba', 10); // Ciudad donde naciste
  const luisRespuestaHash = await bcrypt.hash('gonzalez', 10); // Apellido de soltera de tu madre

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

  // Crear algunas clases de ejemplo
  const { query } = require('./db/database');
  const hoy = new Date();
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);
  const pasadoMañana = new Date(hoy);
  pasadoMañana.setDate(pasadoMañana.getDate() + 2);

  // Crear planes de ejemplo si no existen
  let planes = query('SELECT * FROM planes');
  if (planes.length === 0) {
    insert('INSERT INTO planes (nombre, duracion, precio) VALUES (?, ?, ?)', ['Mensual', 30, 5000]);
    insert('INSERT INTO planes (nombre, duracion, precio) VALUES (?, ?, ?)', ['Trimestral', 90, 12000]);
    planes = query('SELECT * FROM planes');
  }

  // Eliminar socios demo específicos si existen (para recrearlos con los nuevos IDs de usuario)
  // Primero eliminar pagos y reservas de estos socios
  run(`
    DELETE FROM pagos 
    WHERE socio_id IN (
      SELECT id FROM socios 
      WHERE nombre IN ('Juan Pérez', 'María González', 'Carlos Rodríguez', 'Luis Martínez')
    )
  `);
  run(`
    DELETE FROM reservas 
    WHERE socio_id IN (
      SELECT id FROM socios 
      WHERE nombre IN ('Juan Pérez', 'María González', 'Carlos Rodríguez', 'Luis Martínez')
    )
  `);
  run("DELETE FROM socios WHERE nombre IN ('Juan Pérez', 'María González', 'Carlos Rodríguez', 'Luis Martínez')");
  
  // Crear socios de ejemplo (siempre recrear los asociados a usuarios demo)
    // Socio activo con pago reciente - Juan Pérez
    const socioJuan = insert(
      'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
      ['Juan Pérez', '123456789', 'activo', planes[0].id, juanUsuario.lastInsertRowid, generarToken6Digitos()]
    );
  // Pago más reciente
  insert(
    'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
    [socioJuan.lastInsertRowid, 5000, new Date().toISOString().split('T')[0]]
  );
  // Pago anterior (hace 30 días)
  const fechaJuanAnterior = new Date();
  fechaJuanAnterior.setDate(fechaJuanAnterior.getDate() - 30);
  insert(
    'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
    [socioJuan.lastInsertRowid, 5000, fechaJuanAnterior.toISOString().split('T')[0]]
  );

    // Socio activo con pago hace 15 días - María González
    const socioMaria = insert(
      'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
      ['María González', '987654321', 'activo', planes[0].id, mariaUsuario.lastInsertRowid, generarToken6Digitos()]
    );
  const fecha15Dias = new Date();
  fecha15Dias.setDate(fecha15Dias.getDate() - 15);
  // Pago hace 15 días
  insert(
    'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
    [socioMaria.lastInsertRowid, 5000, fecha15Dias.toISOString().split('T')[0]]
  );
  // Pago anterior (hace 45 días)
  const fechaMariaAnterior = new Date();
  fechaMariaAnterior.setDate(fechaMariaAnterior.getDate() - 45);
  insert(
    'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
    [socioMaria.lastInsertRowid, 5000, fechaMariaAnterior.toISOString().split('T')[0]]
  );

    // Socio inactivo (pago vencido) - Carlos Rodríguez
    const socioCarlos = insert(
      'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
      ['Carlos Rodríguez', '555555555', 'inactivo', planes[0].id, carlosUsuario.lastInsertRowid, generarToken6Digitos()]
    );
  const fechaVencida = new Date();
  fechaVencida.setDate(fechaVencida.getDate() - 45);
  // Pago vencido (hace 45 días)
  insert(
    'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
    [socioCarlos.lastInsertRowid, 5000, fechaVencida.toISOString().split('T')[0]]
  );
  // Pago anterior (hace 75 días)
  const fechaCarlosAnterior = new Date();
  fechaCarlosAnterior.setDate(fechaCarlosAnterior.getDate() - 75);
  insert(
    'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
    [socioCarlos.lastInsertRowid, 5000, fechaCarlosAnterior.toISOString().split('T')[0]]
  );

    // Socio inactivo (pago vencido) - Luis Martínez
    const socioLuis = insert(
      'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
      ['Luis Martínez', '777888999', 'inactivo', planes[0].id, luisUsuario.lastInsertRowid, generarToken6Digitos()]
    );
  const fechaVencida2 = new Date();
  fechaVencida2.setDate(fechaVencida2.getDate() - 60);
  // Pago vencido (hace 60 días)
  insert(
    'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
    [socioLuis.lastInsertRowid, 5000, fechaVencida2.toISOString().split('T')[0]]
  );
  // Pago anterior (hace 90 días)
  const fechaLuisAnterior = new Date();
  fechaLuisAnterior.setDate(fechaLuisAnterior.getDate() - 90);
  insert(
    'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
    [socioLuis.lastInsertRowid, 5000, fechaLuisAnterior.toISOString().split('T')[0]]
  );

  // Socio con plan trimestral activo - Ana Martínez (sin usuario)
  const socioAnaExistente = query("SELECT * FROM socios WHERE nombre = 'Ana Martínez'");
  if (socioAnaExistente.length === 0) {
      const socioAna = insert(
        'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
        ['Ana Martínez', '111222333', 'activo', planes[1] ? planes[1].id : planes[0].id, null, generarToken6Digitos()]
      );
    const fecha30Dias = new Date();
    fecha30Dias.setDate(fecha30Dias.getDate() - 30);
    insert(
      'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
      [socioAna.lastInsertRowid, planes[1] ? 12000 : 5000, fecha30Dias.toISOString().split('T')[0]]
    );
  }

  // Socio sin plan (para probar denegación de acceso) - Pedro Sánchez
  const pedroExistente = query("SELECT * FROM socios WHERE nombre = 'Pedro Sánchez'");
  if (pedroExistente.length === 0) {
      insert(
        'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
        ['Pedro Sánchez', '444555666', 'activo', null, null, generarToken6Digitos()]
      );
  }

  // Eliminar clases demo anteriores y crear nuevas
  // Primero eliminar reservas asociadas
  run(`
    DELETE FROM reservas 
    WHERE clase_id IN (
      SELECT id FROM clases 
      WHERE nombre IN ('Crossfit', 'Zumba', 'Funcional', 'Yoga Matutino', 'Spinning')
    )
  `);
  // Luego eliminar las clases
  run("DELETE FROM clases WHERE nombre IN ('Crossfit', 'Zumba', 'Funcional', 'Yoga Matutino', 'Spinning')");
  
  // Crear clases de ejemplo
  insert(
    `INSERT INTO clases (nombre, fecha, hora_inicio, hora_fin, cupo, instructor, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Crossfit', mañana.toISOString().split('T')[0], '08:00', '09:00', 20, 'Carlos Mendoza', 'activa']
  );
  insert(
    `INSERT INTO clases (nombre, fecha, hora_inicio, hora_fin, cupo, instructor, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Zumba', mañana.toISOString().split('T')[0], '18:00', '19:00', 15, 'Sofía Ramírez', 'activa']
  );
  insert(
    `INSERT INTO clases (nombre, fecha, hora_inicio, hora_fin, cupo, instructor, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Funcional', pasadoMañana.toISOString().split('T')[0], '19:00', '20:00', 25, 'Diego Torres', 'activa']
  );

  // Obtener IDs de socios creados para mostrar
  const sociosFinales = query('SELECT id, nombre, estado, usuario_id FROM socios ORDER BY id');

  console.log('✅ Seed completado:');
  console.log('   - juan@clientes.com / juan123 → cliente (Juan Pérez) - ACTIVO');
  console.log('     Pregunta: ¿Equipo de fútbol que seguís? → Respuesta: boca');
  console.log('   - maria@clientes.com / maria123 → cliente (María González) - ACTIVO');
  console.log('     Pregunta: ¿Comida favorita? → Respuesta: pizza');
  console.log('   - carlos@clientes.com / carlos123 → cliente (Carlos Rodríguez) - INACTIVO');
  console.log('     Pregunta: ¿Ciudad donde naciste? → Respuesta: cordoba');
  console.log('   - luis@clientes.com / luis123 → cliente (Luis Martínez) - INACTIVO');
  console.log('     Pregunta: ¿Apellido de soltera de tu madre? → Respuesta: gonzalez');
  console.log('   - admin@demo.com / admin123 → admin');
  console.log('   - root@demo.com / root123 → root');
  console.log('   - Clases de ejemplo creadas');
  console.log('   - Preguntas de seguridad configuradas para usuarios demo');
  console.log('\n📋 IDs de Socios para probar:');
  sociosFinales.forEach(socio => {
    console.log(`   - ID ${socio.id}: ${socio.nombre} (${socio.estado})`);
  });
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error en seed:', error);
  process.exit(1);
});
