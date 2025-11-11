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
  
  // Ejecutar init.sql si existe
  if (fs.existsSync(initSqlPath)) {
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    db.run(initSql);
    saveDatabase();
    console.log('✅ Base de datos inicializada');
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
  
  // Generar qr_token para socios que no lo tengan (solo si la columna existe)
  if (columnaQrExiste) {
    try {
      const crypto = require('crypto');
      const sociosSinToken = db.exec("SELECT id FROM socios WHERE qr_token IS NULL");
      if (sociosSinToken && sociosSinToken[0] && sociosSinToken[0].values && sociosSinToken[0].values.length > 0) {
        const stmt = db.prepare('UPDATE socios SET qr_token = ? WHERE id = ?');
        sociosSinToken[0].values.forEach(([id]) => {
          stmt.run([crypto.randomUUID(), id]);
        });
        stmt.free();
        saveDatabase();
      }
    } catch (e) {
      // Error al generar tokens, continuar
      console.log('Nota: No se pudieron generar tokens QR para socios existentes');
    }
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
