/**
 * Orquestador de seeds. Ejecutar con: npm run seed (desde backend).
 * Orden: config → usuarios → instructores → socios → clases → pagos → reservas → accesos → preguntas seguridad.
 */
require('dotenv').config();

const seedRandom = require('./utils/seedRandom');
seedRandom.init(process.env.DATA_SEED);

const { dbPromise } = require('./db');
const { seedConfig } = require('./seed-config');
const { seedTipoRutina } = require('./seed-tipo-rutina');
const { seedUsuarios } = require('./seed-usuarios');
const { seedInstructores } = require('./seed-instructores');
const { seedSocios } = require('./seed-socios');
const { seedClases } = require('./seed-clases');
const { seedPagos } = require('./seed-pagos');
const { seedReservas } = require('./seed-reservas');
const { seedAccesos } = require('./seed-accesos');
const { seedPreguntasSeguridad } = require('./seed-preguntas-seguridad');

async function run() {
  const seedVal = seedRandom.getCurrentSeed();
  console.log('Iniciando seeds...');
  console.log(seedVal != null ? `Seed actual: ${seedVal}` : 'Seed: no definida (datos no deterministas)');
  await dbPromise;

  await seedConfig();
  await seedTipoRutina();
  await seedUsuarios();
  await seedInstructores();
  await seedSocios();
  await seedClases();
  await seedPagos();
  await seedReservas();
  await seedAccesos();
  await seedPreguntasSeguridad();

  console.log('Seeds completados.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Error en seeds:', err);
  process.exit(1);
});
