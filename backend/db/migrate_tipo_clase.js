const { getDatabase, query, get, run, insert } = require('./database');

// Función para ejecutar la migración de tipo_clase
function migrateTipoClase() {
  const db = getDatabase();
  
  try {
    // Verificar si la tabla tipo_clase existe
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='tipo_clase'");
    const tipoClaseExiste = tables && tables[0] && tables[0].values && tables[0].values.length > 0;
    
    // Verificar si la columna tipo_clase_id ya existe en clases
    let columnaTipoClaseIdExiste = false;
    try {
      const tableInfo = db.exec("PRAGMA table_info(clases)");
      if (tableInfo && tableInfo[0] && tableInfo[0].values) {
        columnaTipoClaseIdExiste = tableInfo[0].values.some(row => row[1] === 'tipo_clase_id');
      }
    } catch (e) {
      // Tabla no existe aún, está bien
    }

    // Si ya existe tipo_clase_id, la migración ya se ejecutó
    if (columnaTipoClaseIdExiste) {
      console.log('✅ Migración tipo_clase ya ejecutada');
      return;
    }

    // Crear tabla tipo_clase si no existe
    if (!tipoClaseExiste) {
      run(`
        CREATE TABLE IF NOT EXISTS tipo_clase (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          descripcion TEXT
        )
      `);
      console.log('✅ Tabla tipo_clase creada');
    }

    // Verificar si hay datos en clases
    const clasesExistentes = query('SELECT DISTINCT nombre FROM clases WHERE nombre IS NOT NULL');
    
    if (clasesExistentes.length === 0) {
      // No hay clases, solo agregar la columna
      run('ALTER TABLE clases ADD COLUMN tipo_clase_id INTEGER');
      console.log('✅ Columna tipo_clase_id agregada a clases (sin datos para migrar)');
      return;
    }

    // Extraer nombres únicos y crear registros en tipo_clase
    const nombresUnicos = [...new Set(clasesExistentes.map(c => c.nombre))];
    const nombreToId = {};

    for (const nombre of nombresUnicos) {
      // Verificar si ya existe
      const existente = get('SELECT id FROM tipo_clase WHERE nombre = ?', [nombre]);
      
      if (existente) {
        nombreToId[nombre] = existente.id;
      } else {
        // Crear nuevo tipo_clase
        const result = insert(
          'INSERT INTO tipo_clase (nombre, descripcion) VALUES (?, ?)',
          [nombre, null]
        );
        nombreToId[nombre] = result.lastInsertRowid;
      }
    }

    console.log(`✅ ${nombresUnicos.length} tipos de clase creados/verificados`);

    // Agregar columna tipo_clase_id a clases
    run('ALTER TABLE clases ADD COLUMN tipo_clase_id INTEGER');
    console.log('✅ Columna tipo_clase_id agregada a clases');

    // Migrar datos: asignar tipo_clase_id según el nombre
    const stmt = db.prepare('UPDATE clases SET tipo_clase_id = ? WHERE nombre = ?');
    for (const nombre of nombresUnicos) {
      stmt.run([nombreToId[nombre], nombre]);
    }
    stmt.free();
    // Guardar cambios manualmente ya que usamos db.prepare directamente
    const data = db.export();
    const buffer = Buffer.from(data);
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, 'gym.db');
    fs.writeFileSync(dbPath, buffer);
    console.log('✅ Datos migrados: tipo_clase_id asignado según nombre');

    // Nota: No podemos eliminar la columna nombre directamente en SQLite
    // Se mantendrá para compatibilidad, pero no se usará en el código nuevo
    // La columna se eliminará cuando se recree la tabla desde init.sql en instalaciones nuevas
    
    console.log('✅ Migración tipo_clase completada');
  } catch (error) {
    console.error('❌ Error en migración tipo_clase:', error);
    throw error;
  }
}

module.exports = { migrateTipoClase };

