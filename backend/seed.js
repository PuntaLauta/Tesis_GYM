const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { dbPromise, run, insert } = require('./db/database');

async function seed() {
  console.log('🌱 Iniciando seed...');

  // Esperar a que la base de datos se inicialice
  await dbPromise;

  // Hashear contraseñas
  const juanHash = await bcrypt.hash('juan123', 10);
  const mariaHash = await bcrypt.hash('maria123', 10);
  const carlosHash = await bcrypt.hash('carlos123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const rootHash = await bcrypt.hash('root123', 10);

  // Eliminar usuarios demo anteriores
  run("DELETE FROM usuarios WHERE email LIKE '%@demo.com'");

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

  insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Admin Demo', 'admin@demo.com', adminHash, 'admin']
  );

  insert(
    `INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)`,
    ['Root Demo', 'root@demo.com', rootHash, 'root']
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

  // Crear socios de ejemplo si no existen
  const socios = query('SELECT * FROM socios');
  if (socios.length === 0) {
    // Socio activo con pago reciente - Juan Pérez
    const socioJuan = insert(
      'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
      ['Juan Pérez', '123456789', 'activo', planes[0].id, juanUsuario.lastInsertRowid, crypto.randomUUID()]
    );
    insert(
      'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
      [socioJuan.lastInsertRowid, 5000, new Date().toISOString().split('T')[0]]
    );

    // Socio activo con pago hace 15 días - María González
    const socioMaria = insert(
      'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
      ['María González', '987654321', 'activo', planes[0].id, mariaUsuario.lastInsertRowid, crypto.randomUUID()]
    );
    const fecha15Dias = new Date();
    fecha15Dias.setDate(fecha15Dias.getDate() - 15);
    insert(
      'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
      [socioMaria.lastInsertRowid, 5000, fecha15Dias.toISOString().split('T')[0]]
    );

    // Socio inactivo (pago vencido) - Carlos Rodríguez
    const socioCarlos = insert(
      'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
      ['Carlos Rodríguez', '555555555', 'inactivo', planes[0].id, carlosUsuario.lastInsertRowid, crypto.randomUUID()]
    );
    const fechaVencida = new Date();
    fechaVencida.setDate(fechaVencida.getDate() - 45);
    insert(
      'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
      [socioCarlos.lastInsertRowid, 5000, fechaVencida.toISOString().split('T')[0]]
    );

    // Socio con plan trimestral activo - Ana Martínez (sin usuario)
    const socioAna = insert(
      'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
      ['Ana Martínez', '111222333', 'activo', planes[1] ? planes[1].id : planes[0].id, null, crypto.randomUUID()]
    );
    const fecha30Dias = new Date();
    fecha30Dias.setDate(fecha30Dias.getDate() - 30);
    insert(
      'INSERT INTO pagos (socio_id, monto, fecha) VALUES (?, ?, ?)',
      [socioAna.lastInsertRowid, planes[1] ? 12000 : 5000, fecha30Dias.toISOString().split('T')[0]]
    );

    // Socio sin plan (para probar denegación de acceso) - Pedro Sánchez
    insert(
      'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
      ['Pedro Sánchez', '444555666', 'activo', null, null, crypto.randomUUID()]
    );
  }

  // Crear clases de ejemplo
  const clases = query('SELECT * FROM clases');
  if (clases.length === 0) {
    insert(
      `INSERT INTO clases (nombre, fecha, hora_inicio, hora_fin, cupo, instructor, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Yoga Matutino', mañana.toISOString().split('T')[0], '08:00', '09:00', 20, 'María García', 'activa']
    );
    insert(
      `INSERT INTO clases (nombre, fecha, hora_inicio, hora_fin, cupo, instructor, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Crossfit', mañana.toISOString().split('T')[0], '18:00', '19:00', 15, 'Juan Pérez', 'activa']
    );
    insert(
      `INSERT INTO clases (nombre, fecha, hora_inicio, hora_fin, cupo, instructor, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Spinning', pasadoMañana.toISOString().split('T')[0], '19:00', '20:00', 25, 'Ana López', 'activa']
    );
  }

  // Obtener IDs de socios creados para mostrar
  const sociosFinales = query('SELECT id, nombre, estado, usuario_id FROM socios ORDER BY id');

  console.log('✅ Seed completado:');
  console.log('   - juan@clientes.com / juan123 → cliente (Juan Pérez)');
  console.log('   - maria@clientes.com / maria123 → cliente (María González)');
  console.log('   - carlos@clientes.com / carlos123 → cliente (Carlos Rodríguez)');
  console.log('   - admin@demo.com / admin123 → admin');
  console.log('   - root@demo.com / root123 → root');
  console.log('   - Clases de ejemplo creadas');
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
