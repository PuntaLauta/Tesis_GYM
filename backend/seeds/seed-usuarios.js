/**
 * Crea usuarios: 1 root (root@gym.com), 3 admins, 10+ instructores, 200+ socios.
 * Nombres reales con Faker; emails con patrón @gym.com.
 * Inserta también en roots y admins.
 */
const { insert, query } = require('./db');
const { faker } = require('./utils/faker');
const { getPasswordHashes } = require('./utils/helpers');
const seedRandom = require('./utils/seedRandom');

const NUM_ADMINS = 3;
const NUM_INSTRUCTORES = 12;
const NUM_SOCIOS = 200;

async function seedUsuarios() {
  const fakerSeed = seedRandom.getSeedForFaker();
  if (fakerSeed != null) faker.seed(fakerSeed);

  const { hashRoot, hashAdmin, hashInstructor, hashSocio } = await getPasswordHashes();

  // 1 root
  insert(
    'INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)',
    ['Root', 'root@gym.com', hashRoot, 'root']
  );

  // 3 admins (nombres reales, emails admin1@gym.com, admin2@gym.com, admin3@gym.com)
  for (let i = 1; i <= NUM_ADMINS; i++) {
    const nombre = faker.person.fullName();
    insert(
      'INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, `admin${i}@gym.com`, hashAdmin, 'admin']
    );
  }

  // 12 instructores (nombres reales, instructor1@gym.com ...)
  for (let i = 1; i <= NUM_INSTRUCTORES; i++) {
    const nombre = faker.person.fullName();
    insert(
      'INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, `instructor${i}@gym.com`, hashInstructor, 'instructor']
    );
  }

  // 200 socios (nombres reales, socio1@gym.com ...)
  for (let i = 1; i <= NUM_SOCIOS; i++) {
    const nombre = faker.person.fullName();
    insert(
      'INSERT INTO usuarios (nombre, email, pass_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, `socio${i}@gym.com`, hashSocio, 'cliente']
    );
  }

  // Vincular root y admins a tablas roots y admins
  const rootRow = query("SELECT id FROM usuarios WHERE email = 'root@gym.com'");
  if (rootRow.length > 0) {
    insert('INSERT INTO roots (usuario_id, estado) VALUES (?, 1)', [rootRow[0].id]);
  }
  for (let i = 1; i <= NUM_ADMINS; i++) {
    const adminRow = query('SELECT id FROM usuarios WHERE email = ?', [`admin${i}@gym.com`]);
    if (adminRow.length > 0) {
      insert('INSERT INTO admins (usuario_id, estado) VALUES (?, 1)', [adminRow[0].id]);
    }
  }
}

module.exports = { seedUsuarios };
