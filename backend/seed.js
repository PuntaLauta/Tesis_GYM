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
  const anaHash = await bcrypt.hash('ana123', 10);
  const pedroHash = await bcrypt.hash('pedro123', 10);
  const lauraHash = await bcrypt.hash('laura123', 10);
  const robertoHash = await bcrypt.hash('roberto123', 10);
  const carmenHash = await bcrypt.hash('carmen123', 10);
  const miguelHash = await bcrypt.hash('miguel123', 10);
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
      [1, 'Gimnasio', '381 000000', 'soporte.am@gmail.com', 'Lunes a viernes: 7:00 a 23:00', 'Sabados: 8:00 a 20:00']
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
  
  // Crear socios asociados a usuarios (10 socios total, todos con credenciales)
  const sociosConUsuario = [
    { nombre: 'Juan Pérez', telefono: '123456789', usuario: juanUsuario.lastInsertRowid, email: 'juan@clientes.com' },
    { nombre: 'María González', telefono: '987654321', usuario: mariaUsuario.lastInsertRowid, email: 'maria@clientes.com' },
    { nombre: 'Carlos Rodríguez', telefono: '555555555', usuario: carlosUsuario.lastInsertRowid, email: 'carlos@clientes.com' },
    { nombre: 'Luis Martínez', telefono: '777888999', usuario: luisUsuario.lastInsertRowid, email: 'luis@clientes.com' },
    { nombre: 'Ana Martínez', telefono: '111222333', usuario: anaUsuario.lastInsertRowid, email: 'ana@clientes.com' },
    { nombre: 'Pedro Sánchez', telefono: '444555666', usuario: pedroUsuario.lastInsertRowid, email: 'pedro@clientes.com' },
    { nombre: 'Laura Fernández', telefono: '222333444', usuario: lauraUsuario.lastInsertRowid, email: 'laura@clientes.com' },
    { nombre: 'Roberto Díaz', telefono: '333444555', usuario: robertoUsuario.lastInsertRowid, email: 'roberto@clientes.com' },
    { nombre: 'Carmen López', telefono: '666777888', usuario: carmenUsuario.lastInsertRowid, email: 'carmen@clientes.com' },
    { nombre: 'Miguel Torres', telefono: '888999000', usuario: miguelUsuario.lastInsertRowid, email: 'miguel@clientes.com' }
  ];

  const planMensual = planes.find(p => p.nombre === 'Mensual') || planes[0];
  const planTrimestral = planes.find(p => p.nombre === 'Trimestral') || planes[1];
  const planDuracionMensual = planMensual.duracion; // 30 días
  const planDuracionTrimestral = planTrimestral ? planTrimestral.duracion : 90; // 90 días

  // Crear o actualizar socios con usuario
  sociosConUsuario.forEach((item, index) => {
    let diasAtrasPago;
    let estado;
    let planSeleccionado;
    let montoPago;
    
    if (index === 0) {
      // Juan: activo, pago reciente (hoy), plan mensual
      diasAtrasPago = 0;
      estado = 'activo';
      planSeleccionado = planMensual;
      montoPago = planMensual.precio;
    } else if (index === 1) {
      // María: activo, vence en 3 días, plan trimestral
      diasAtrasPago = planDuracionTrimestral - 3;
      estado = 'activo';
      planSeleccionado = planTrimestral;
      montoPago = planTrimestral.precio;
    } else if (index === 2) {
      // Carlos: activo, vence en 5 días, plan mensual
      diasAtrasPago = planDuracionMensual - 5;
      estado = 'activo';
      planSeleccionado = planMensual;
      montoPago = planMensual.precio;
    } else if (index === 3) {
      // Luis: inactivo, vencido, plan mensual
      diasAtrasPago = 45;
      estado = 'inactivo';
      planSeleccionado = planMensual;
      montoPago = planMensual.precio;
    } else if (index === 4) {
      // Ana: activo, vence en 2 días, plan trimestral
      diasAtrasPago = planDuracionTrimestral - 2;
      estado = 'activo';
      planSeleccionado = planTrimestral;
      montoPago = planTrimestral.precio;
    } else if (index === 5) {
      // Pedro: activo, vence en 7 días, plan mensual
      diasAtrasPago = planDuracionMensual - 7;
      estado = 'activo';
      planSeleccionado = planMensual;
      montoPago = planMensual.precio;
    } else if (index === 6) {
      // Laura: activo, vence en 1 día, plan trimestral
      diasAtrasPago = planDuracionTrimestral - 1;
      estado = 'activo';
      planSeleccionado = planTrimestral;
      montoPago = planTrimestral.precio;
    } else if (index === 7) {
      // Roberto: activo, pago reciente, plan mensual
      diasAtrasPago = 5;
      estado = 'activo';
      planSeleccionado = planMensual;
      montoPago = planMensual.precio;
    } else if (index === 8) {
      // Carmen: activo, vence en 4 días, plan mensual
      diasAtrasPago = planDuracionMensual - 4;
      estado = 'activo';
      planSeleccionado = planMensual;
      montoPago = planMensual.precio;
    } else {
      // Miguel: inactivo, vencido, plan trimestral
      diasAtrasPago = 100;
      estado = 'inactivo';
      planSeleccionado = planTrimestral;
      montoPago = planTrimestral.precio;
    }

    // Verificar si el socio ya existe (por usuario_id)
    const socioExistente = query('SELECT id FROM socios WHERE usuario_id = ?', [item.usuario]);
    
    let socioId;
    if (socioExistente.length > 0) {
      // Actualizar socio existente
      socioId = socioExistente[0].id;
      run(
        'UPDATE socios SET nombre = ?, telefono = ?, estado = ?, plan_id = ?, qr_token = ? WHERE id = ?',
        [item.nombre, item.telefono, estado, planSeleccionado.id, generarToken6Digitos(), socioId]
      );
    } else {
      // Crear nuevo socio
      const socio = insert(
        'INSERT INTO socios (nombre, telefono, estado, plan_id, usuario_id, qr_token) VALUES (?, ?, ?, ?, ?, ?)',
        [item.nombre, item.telefono, estado, planSeleccionado.id, item.usuario, generarToken6Digitos()]
      );
      socioId = socio.lastInsertRowid;
    }

    // Eliminar pagos anteriores del socio
    run('DELETE FROM pagos WHERE socio_id = ?', [socioId]);

    // Crear nuevo pago (el más reciente)
    const fechaPago = new Date();
    fechaPago.setDate(fechaPago.getDate() - diasAtrasPago);
    insert(
      'INSERT INTO pagos (socio_id, monto, fecha, metodo_pago) VALUES (?, ?, ?, ?)',
      [socioId, montoPago, fechaPago.toISOString().split('T')[0], index % 2 === 0 ? 'efectivo' : 'transferencia']
    );

    // Agregar pagos históricos adicionales (2-3 pagos más)
    const pagosAdicionales = Math.floor(Math.random() * 2) + 2; // 2 o 3 pagos
    for (let i = 1; i <= pagosAdicionales; i++) {
      const diasAtras = diasAtrasPago + (planSeleccionado.duracion * i);
      const fechaPagoHistorico = new Date();
      fechaPagoHistorico.setDate(fechaPagoHistorico.getDate() - diasAtras);
      const metodoPago = Math.random() > 0.5 ? 'efectivo' : 'transferencia';
      insert(
        'INSERT INTO pagos (socio_id, monto, fecha, metodo_pago) VALUES (?, ?, ?, ?)',
        [socioId, montoPago, fechaPagoHistorico.toISOString().split('T')[0], metodoPago]
      );
    }
  });

  // Obtener todos los IDs de socios para usar en accesos y reservas
  const todosLosSocios = query('SELECT id, estado FROM socios ORDER BY id');
  const sociosActivos = todosLosSocios.filter(s => s.estado === 'activo');
  const sociosInactivos = todosLosSocios.filter(s => s.estado !== 'activo');

  // Eliminar clases, reservas y accesos anteriores
  run('DELETE FROM reservas');
  run('DELETE FROM accesos');
  run('DELETE FROM clases');
  
  // Crear clases variadas (pasadas, hoy, futuras)
  const clasesData = [
    // Clases pasadas (últimos 15 días)
    { nombre: 'Crossfit', fecha: -10, hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Zumba', fecha: -8, hora: '18:00', fin: '19:00', cupo: 15, instructor: 'Sofía Ramírez', estado: 'activa' },
    { nombre: 'Funcional', fecha: -7, hora: '19:00', fin: '20:00', cupo: 25, instructor: 'Diego Torres', estado: 'activa' },
    { nombre: 'Crossfit', fecha: -5, hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Zumba', fecha: -4, hora: '18:00', fin: '19:00', cupo: 15, instructor: 'Sofía Ramírez', estado: 'cancelada' },
    { nombre: 'Funcional', fecha: -3, hora: '19:00', fin: '20:00', cupo: 25, instructor: 'Diego Torres', estado: 'activa' },
    { nombre: 'Crossfit', fecha: -2, hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Zumba', fecha: -1, hora: '18:00', fin: '19:00', cupo: 15, instructor: 'Sofía Ramírez', estado: 'activa' },
    
    // Clases de hoy
    { nombre: 'Crossfit', fecha: 0, hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Zumba', fecha: 0, hora: '18:00', fin: '19:00', cupo: 15, instructor: 'Sofía Ramírez', estado: 'activa' },
    
    // Clases futuras (próximos 10 días)
    { nombre: 'Funcional', fecha: 1, hora: '19:00', fin: '20:00', cupo: 25, instructor: 'Diego Torres', estado: 'activa' },
    { nombre: 'Crossfit', fecha: 2, hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Zumba', fecha: 3, hora: '18:00', fin: '19:00', cupo: 15, instructor: 'Sofía Ramírez', estado: 'activa' },
    { nombre: 'Funcional', fecha: 4, hora: '19:00', fin: '20:00', cupo: 25, instructor: 'Diego Torres', estado: 'activa' },
    { nombre: 'Crossfit', fecha: 5, hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Carlos Mendoza', estado: 'activa' },
    { nombre: 'Zumba', fecha: 7, hora: '18:00', fin: '19:00', cupo: 15, instructor: 'Sofía Ramírez', estado: 'activa' },
    { nombre: 'Funcional', fecha: 8, hora: '19:00', fin: '20:00', cupo: 25, instructor: 'Diego Torres', estado: 'activa' },
    { nombre: 'Crossfit', fecha: 9, hora: '08:00', fin: '09:00', cupo: 20, instructor: 'Carlos Mendoza', estado: 'activa' },
  ];

  const clasesCreadas = [];
  clasesData.forEach(claseData => {
    const fechaClase = new Date();
    fechaClase.setDate(fechaClase.getDate() + claseData.fecha);
    const clase = insert(
      `INSERT INTO clases (nombre, fecha, hora_inicio, hora_fin, cupo, instructor, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        claseData.nombre,
        fechaClase.toISOString().split('T')[0],
        claseData.hora,
        claseData.fin,
        claseData.cupo,
        claseData.instructor,
        claseData.estado
      ]
    );
    clasesCreadas.push({ id: clase.lastInsertRowid, ...claseData });
  });

  // Crear reservas para al menos 6 socios activos
  const sociosParaReservar = sociosActivos.slice(0, 6); // Primeros 6 socios activos
  const reservasCreadas = [];

  clasesCreadas.forEach((clase, idx) => {
    // Para cada clase, asignar reservas aleatorias
    const numReservas = Math.floor(Math.random() * (clase.cupo * 0.7)) + 1; // 1 a 70% del cupo
    const sociosAleatorios = [...sociosParaReservar].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numReservas, sociosAleatorios.length); i++) {
      const socio = sociosAleatorios[i];
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
  const sociosFinales = query('SELECT id, nombre, estado, usuario_id FROM socios ORDER BY id');

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
  console.log('   - admin@demo.com / admin123 → admin');
  console.log('   - root@demo.com / root123 → root');
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
