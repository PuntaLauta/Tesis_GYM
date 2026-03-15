/**
 * Limpia todos los datos de la base de datos excepto tablas de cuantificación/catálogo.
 * No modifica: configuracion_gym, planes, socio_estado, tipo_clase, tipo_rutina, estado_ejercicios.
 */

const path = require('path');
const { dbPromise, run } = require(path.join(__dirname, '..', 'db', 'database'));

async function clearData() {
  console.log('Limpiando datos de la base (respetando tablas de cuantificación)...');

  await dbPromise;

  // Orden: tablas dependientes primero (respetando FKs)
  run('DELETE FROM reservas');
  run('DELETE FROM accesos');
  run('DELETE FROM pagos');
  run('DELETE FROM rutina_ejercicio');
  run('DELETE FROM rutinas');
  run('DELETE FROM conversaciones_asistente');
  run('DELETE FROM ejercicios_favoritos');
  run('DELETE FROM preguntas_seguridad');
  run('DELETE FROM admins');
  run('DELETE FROM roots');
  run('DELETE FROM instructores');
  run('DELETE FROM clases');
  run('DELETE FROM socios');
  run('DELETE FROM usuarios');
  run('DELETE FROM ejercicios');
  run('DELETE FROM backup_config');
  // No borrar: configuracion_gym, planes, socio_estado, tipo_clase, tipo_rutina, estado_ejercicios

  console.log('Datos limpiados correctamente.');
  process.exit(0);
}

clearData().catch((err) => {
  console.error(err);
  process.exit(1);
});
