const fs = require('fs');
const path = require('path');
const { getDatabase, saveDatabase } = require('./database');

const dbPath = path.join(__dirname, 'gym.db');
const backupsDir = path.join(__dirname, 'backups');

// Asegurar que la carpeta de backups existe
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

/**
 * Crear un backup de la base de datos
 * @param {string} tipo - 'manual' o 'automatic'
 * @returns {string} Nombre del archivo de backup creado
 */
function crearBackup(tipo = 'manual') {
  if (!fs.existsSync(dbPath)) {
    throw new Error('La base de datos no existe');
  }

  const fecha = new Date();
  const fechaStr = fecha.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const nombreArchivo = `gym_backup_${fechaStr}.db`;
  
  const subcarpeta = tipo === 'automatic' ? 'automatic' : 'manual';
  const carpetaDestino = path.join(backupsDir, subcarpeta);
  
  if (!fs.existsSync(carpetaDestino)) {
    fs.mkdirSync(carpetaDestino, { recursive: true });
  }

  const rutaDestino = path.join(carpetaDestino, nombreArchivo);
  
  // Copiar el archivo de la base de datos
  fs.copyFileSync(dbPath, rutaDestino);
  
  return nombreArchivo;
}

/**
 * Listar todos los backups disponibles
 * @returns {Array} Lista de backups con información
 */
function listarBackups() {
  const backups = [];
  
  const subcarpetas = ['manual', 'automatic'];
  
  subcarpetas.forEach(subcarpeta => {
    const carpeta = path.join(backupsDir, subcarpeta);
    if (fs.existsSync(carpeta)) {
      const archivos = fs.readdirSync(carpeta);
      archivos.forEach(archivo => {
        if (archivo.endsWith('.db')) {
          const rutaCompleta = path.join(carpeta, archivo);
          const stats = fs.statSync(rutaCompleta);
          backups.push({
            nombre: archivo,
            tipo: subcarpeta,
            ruta: rutaCompleta,
            fecha: stats.mtime,
            tamaño: stats.size,
            tamañoFormateado: formatearTamaño(stats.size)
          });
        }
      });
    }
  });
  
  // Ordenar por fecha (más recientes primero)
  backups.sort((a, b) => b.fecha - a.fecha);
  
  return backups;
}

/**
 * Restaurar la base de datos desde un backup
 * @param {string} nombreArchivo - Nombre del archivo de backup
 * @param {string} tipo - 'manual' o 'automatic'
 */
function restaurarBackup(nombreArchivo, tipo = 'manual') {
  const subcarpeta = tipo === 'automatic' ? 'automatic' : 'manual';
  const rutaBackup = path.join(backupsDir, subcarpeta, nombreArchivo);
  
  if (!fs.existsSync(rutaBackup)) {
    throw new Error('El archivo de backup no existe');
  }

  // Crear backup de seguridad antes de restaurar
  const backupSeguridad = crearBackup('manual');
  console.log(`Backup de seguridad creado: ${backupSeguridad}`);

  // Copiar el backup sobre la base de datos actual
  fs.copyFileSync(rutaBackup, dbPath);
  
  // Reinicializar la base de datos en memoria
  const { initDatabase } = require('./database');
  initDatabase();
}

/**
 * Eliminar un backup
 * @param {string} nombreArchivo - Nombre del archivo de backup
 * @param {string} tipo - 'manual' o 'automatic'
 */
function eliminarBackup(nombreArchivo, tipo = 'manual') {
  const subcarpeta = tipo === 'automatic' ? 'automatic' : 'manual';
  const rutaBackup = path.join(backupsDir, subcarpeta, nombreArchivo);
  
  if (!fs.existsSync(rutaBackup)) {
    throw new Error('El archivo de backup no existe');
  }

  fs.unlinkSync(rutaBackup);
}

/**
 * Limpiar backups antiguos
 * @param {number} diasMantener - Cantidad de días de backups a mantener
 */
function limpiarBackupsAntiguos(diasMantener = 30) {
  const backups = listarBackups();
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - diasMantener);
  
  let eliminados = 0;
  
  backups.forEach(backup => {
    if (backup.fecha < fechaLimite) {
      try {
        eliminarBackup(backup.nombre, backup.tipo);
        eliminados++;
      } catch (error) {
        console.error(`Error al eliminar backup ${backup.nombre}:`, error.message);
      }
    }
  });
  
  return eliminados;
}

/**
 * Formatear tamaño de archivo
 */
function formatearTamaño(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

module.exports = {
  crearBackup,
  listarBackups,
  restaurarBackup,
  eliminarBackup,
  limpiarBackupsAntiguos
};

