const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
const dbPath = path.join(__dirname, 'gym.db');
const initSqlPath = path.join(__dirname, 'init.sql');

// Inicializar base de datos
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Cargar base de datos existente o crear nueva
  let data = null;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    data = new Uint8Array(buffer);
  }
  
  db = new SQL.Database(data);
  
  // Verificar si existe la columna documento ANTES de ejecutar init.sql
  let columnaDocumentoExiste = false;
  try {
    const tableInfo = db.exec("PRAGMA table_info(socios)");
    if (tableInfo && tableInfo[0] && tableInfo[0].values) {
      columnaDocumentoExiste = tableInfo[0].values.some(row => row[1] === 'documento');
    }
  } catch (e) {
    // Tabla no existe aún, está bien
  }
  
  // Agregar columna documento si no existe (ANTES de init.sql para que el índice funcione)
  if (!columnaDocumentoExiste) {
    try {
      db.run('ALTER TABLE socios ADD COLUMN documento TEXT');
      saveDatabase();
      console.log('✅ Columna documento agregada a la tabla socios');
    } catch (e) {
      // Si la tabla no existe, init.sql la creará con la columna
      if (!e.message.includes('no such table')) {
        console.log('Advertencia: No se pudo agregar columna documento:', e.message);
      }
    }
  }
  
  // Ejecutar init.sql si existe
  if (fs.existsSync(initSqlPath)) {
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    try {
      db.run(initSql);
      saveDatabase();
      console.log('✅ Base de datos inicializada');
    } catch (e) {
      // Si falla por el índice, intentar crearlo después
      if (e.message.includes('documento')) {
        console.log('Advertencia al ejecutar init.sql:', e.message);
        // Intentar crear el índice después
        try {
          db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_socios_documento ON socios(documento)');
          saveDatabase();
          console.log('✅ Índice único creado para documento');
        } catch (idxError) {
          console.log('Advertencia: No se pudo crear índice único:', idxError.message);
        }
      } else {
        throw e;
      }
    }
  }
  
  // Verificar columnas usando PRAGMA
  let columnaQrExiste = false;
  let columnaUsuarioExiste = false;
  try {
    const tableInfo = db.exec("PRAGMA table_info(socios)");
    if (tableInfo && tableInfo[0] && tableInfo[0].values) {
      columnaQrExiste = tableInfo[0].values.some(row => row[1] === 'qr_token');
      columnaUsuarioExiste = tableInfo[0].values.some(row => row[1] === 'usuario_id');
    }
  } catch (e) {
    // Error al verificar, asumir que no existen
  }
  
  // Agregar columna qr_token si no existe (migración)
  if (!columnaQrExiste) {
    try {
      db.run('ALTER TABLE socios ADD COLUMN qr_token TEXT UNIQUE');
      saveDatabase();
      columnaQrExiste = true;
    } catch (e) {
      console.log('Advertencia: No se pudo agregar columna qr_token:', e.message);
    }
  }
  
  // Agregar columna usuario_id si no existe (migración)
  if (!columnaUsuarioExiste) {
    try {
      db.run('ALTER TABLE socios ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id)');
      saveDatabase();
      columnaUsuarioExiste = true;
    } catch (e) {
      console.log('Advertencia: No se pudo agregar columna usuario_id:', e.message);
    }
  }
  
  // Función para generar token de 6 dígitos único
  function generarToken6Digitos() {
    let token;
    let intentos = 0;
    const maxIntentos = 100;
    
    do {
      // Generar número aleatorio de 6 dígitos (100000 a 999999)
      token = String(Math.floor(100000 + Math.random() * 900000));
      const stmtCheck = db.prepare('SELECT id FROM socios WHERE qr_token = ?');
      stmtCheck.bind([token]);
      const existe = stmtCheck.step();
      stmtCheck.free();
      if (!existe) {
        return token;
      }
      intentos++;
    } while (intentos < maxIntentos);
    
    // Si después de 100 intentos no hay token único, usar timestamp
    return String(Date.now()).slice(-6);
  }

  // Generar/actualizar qr_token para socios (solo si la columna existe)
  if (columnaQrExiste) {
    try {
      // Actualizar tokens UUID existentes a tokens de 6 dígitos
      const sociosConUUID = db.exec("SELECT id, qr_token FROM socios WHERE qr_token IS NOT NULL AND LENGTH(qr_token) > 10");
      if (sociosConUUID && sociosConUUID[0] && sociosConUUID[0].values && sociosConUUID[0].values.length > 0) {
        const stmt = db.prepare('UPDATE socios SET qr_token = ? WHERE id = ?');
        sociosConUUID[0].values.forEach(([id]) => {
          stmt.run([generarToken6Digitos(), id]);
        });
        stmt.free();
        saveDatabase();
        console.log('✅ Tokens QR actualizados a formato de 6 dígitos');
      }
      
      // Generar tokens para socios que no lo tengan
      const sociosSinToken = db.exec("SELECT id FROM socios WHERE qr_token IS NULL");
      if (sociosSinToken && sociosSinToken[0] && sociosSinToken[0].values && sociosSinToken[0].values.length > 0) {
        const stmt = db.prepare('UPDATE socios SET qr_token = ? WHERE id = ?');
        sociosSinToken[0].values.forEach(([id]) => {
          stmt.run([generarToken6Digitos(), id]);
        });
        stmt.free();
        saveDatabase();
      }
    } catch (e) {
      // Error al generar tokens, continuar
      console.log('Nota: No se pudieron generar tokens QR para socios existentes');
    }
  }

  // Verificar si existe la columna metodo_pago en la tabla pagos
  let columnaMetodoPagoExiste = false;
  try {
    const tableInfo = db.exec("PRAGMA table_info(pagos)");
    if (tableInfo && tableInfo[0] && tableInfo[0].values) {
      columnaMetodoPagoExiste = tableInfo[0].values.some(row => row[1] === 'metodo_pago');
    }
  } catch (e) {
    // Error al verificar, asumir que no existe
  }
  
  // Agregar columna metodo_pago si no existe (migración)
  if (!columnaMetodoPagoExiste) {
    try {
      db.run('ALTER TABLE pagos ADD COLUMN metodo_pago TEXT CHECK(metodo_pago IN ("transferencia", "efectivo"))');
      saveDatabase();
      console.log('✅ Columna metodo_pago agregada a la tabla pagos');
    } catch (e) {
      console.log('Advertencia: No se pudo agregar columna metodo_pago:', e.message);
    }
  }

  // Verificar si existe la tabla de preguntas de seguridad
  let tablaPreguntasExiste = false;
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='preguntas_seguridad'");
    tablaPreguntasExiste = tables && tables[0] && tables[0].values && tables[0].values.length > 0;
  } catch (e) {
    // Error al verificar, asumir que no existe
  }

  // Crear tabla de preguntas de seguridad si no existe (migración)
  if (!tablaPreguntasExiste) {
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS preguntas_seguridad (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id INTEGER NOT NULL UNIQUE,
          pregunta TEXT NOT NULL,
          respuesta_hash TEXT NOT NULL,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
      `);
      saveDatabase();
      console.log('✅ Tabla de preguntas de seguridad creada');
    } catch (e) {
      console.log('Advertencia: No se pudo crear tabla de preguntas de seguridad:', e.message);
    }
  }

  // Verificar si existe la tabla de configuracion del gimnasio
  let tablaConfigExiste = false;
  try {
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='configuracion_gym'");
    tablaConfigExiste = tables && tables[0] && tables[0].values && tables[0].values.length > 0;
  } catch (e) {
    // Error al verificar, asumir que no existe
  }

  // Crear tabla de configuracion del gimnasio si no existe (migración)
  if (!tablaConfigExiste) {
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS configuracion_gym (
          id INTEGER PRIMARY KEY CHECK(id = 1),
          nombre TEXT NOT NULL DEFAULT 'Gimnasio',
          telefono TEXT,
          email TEXT,
          horarios_lunes_viernes TEXT,
          horarios_sabado TEXT
        )
      `);
      // Insertar registro inicial si no existe
      const configExistente = db.exec("SELECT id FROM configuracion_gym WHERE id = 1");
      if (!configExistente || !configExistente[0] || !configExistente[0].values || configExistente[0].values.length === 0) {
        db.run(`
          INSERT INTO configuracion_gym (id, nombre, telefono, email, horarios_lunes_viernes, horarios_sabado)
          VALUES (1, 'Gimnasio', '381 000000', 'soporte.am@gmail.com', 'Lunes a viernes: 7:00 a 23:00', 'Sabados: 8:00 a 20:00')
        `);
      }
      saveDatabase();
      console.log('✅ Tabla configuracion_gym creada');
    } catch (e) {
      console.log('Advertencia: No se pudo crear tabla configuracion_gym:', e.message);
    }
  }

  // Ejecutar migración de tipo_clase
  try {
    const { migrateTipoClase } = require('./migrate_tipo_clase');
    migrateTipoClase();
  } catch (e) {
    console.log('Advertencia: No se pudo ejecutar migración tipo_clase:', e.message);
  }

  
  return db;
}

// Guardar base de datos a disco
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Obtener base de datos (inicializa si es necesario)
function getDatabase() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return db;
}

// Wrapper para ejecutar queries de forma síncrona
function query(sql, params = []) {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  saveDatabase();
  return result;
}

// Wrapper para ejecutar una sola fila
function get(sql, params = []) {
  const results = query(sql, params);
  return results[0] || null;
}

// Wrapper para ejecutar sin retorno
function run(sql, params = []) {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  saveDatabase();
}

// Wrapper para insert y obtener lastInsertRowid
function insert(sql, params = []) {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  
  // Obtener last_insert_rowid
  const result = database.exec("SELECT last_insert_rowid() as id");
  const lastId = result && result[0] && result[0].values && result[0].values[0] 
    ? result[0].values[0][0] 
    : null;
  
  saveDatabase();
  return { lastInsertRowid: lastId };
}

// Inicializar y exportar
const dbPromise = initDatabase();

module.exports = {
  dbPromise,
  getDatabase,
  query,
  get,
  run,
  insert,
  saveDatabase,
};
