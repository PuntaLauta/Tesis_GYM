const bcrypt = require('bcrypt');

const YEAR_START = 2023;
const YEAR_END = 2026;
const DATE_START = new Date(YEAR_START, 0, 1);
const DATE_END = new Date(YEAR_END, 11, 31, 23, 59, 59);

/** Contraseñas fijas por rol (texto plano para hashear una sola vez) */
const PASSWORDS = {
  socio: 'socio123',
  instructor: 'instructor123',
  admin: 'admin123',
  root: 'root123',
};

/** socio_estado: 1=activo, 2=inactivo, 3=suspendido, 4=abandono. Plan: 80% activo, 10% inactivo, 9% abandono, 1% suspendido */
const ESTADO_WEIGHTS = [
  { id: 1, weight: 80 },   // activo
  { id: 2, weight: 10 },   // inactivo
  { id: 4, weight: 9 },    // abandono
  { id: 3, weight: 1 },    // suspendido
];

let passwordHashes = null;

/**
 * Calcula y cachea los hashes de contraseña (una sola vez).
 * @returns {{ hashSocio, hashInstructor, hashAdmin, hashRoot }}
 */
async function getPasswordHashes() {
  if (passwordHashes) return passwordHashes;
  const [hashSocio, hashInstructor, hashAdmin, hashRoot] = await Promise.all([
    bcrypt.hash(PASSWORDS.socio, 10),
    bcrypt.hash(PASSWORDS.instructor, 10),
    bcrypt.hash(PASSWORDS.admin, 10),
    bcrypt.hash(PASSWORDS.root, 10),
  ]);
  passwordHashes = { hashSocio, hashInstructor, hashAdmin, hashRoot };
  return passwordHashes;
}

/**
 * Fecha aleatoria entre 2023-01-01 y 2026-12-31 (sin hora o con hora según needTime).
 * @param {{ needTime?: boolean }} opts
 * @returns {string} ISO date (YYYY-MM-DD) o datetime
 */
function randomDateInRange(opts = {}) {
  const needTime = opts.needTime === true;
  const ts = DATE_START.getTime() + Math.random() * (DATE_END.getTime() - DATE_START.getTime());
  const d = new Date(ts);
  if (needTime) return d.toISOString().replace('T', ' ').substring(0, 19);
  return d.toISOString().split('T')[0];
}

/**
 * Asigna socio_estado_id según distribución: 80% activo, 10% inactivo, 9% abandono, 1% suspendido.
 * @param {number} index - Índice del socio (0-based) para determinismo opcional
 * @param {boolean} useRandom - Si true usa Math.random(); si false deriva del index
 */
function getSocioEstadoId(index, useRandom = true) {
  const r = useRandom ? Math.random() * 100 : (index % 100);
  let acc = 0;
  for (const { id, weight } of ESTADO_WEIGHTS) {
    acc += weight;
    if (r < acc) return id;
  }
  return 1;
}

/** Generador de DNI únicos (8 dígitos, string) */
function createDniGenerator() {
  const used = new Set();
  return function nextDni() {
    let dni;
    do {
      dni = String(Math.floor(10000000 + Math.random() * 90000000));
    } while (used.has(dni));
    used.add(dni);
    return dni;
  };
}

/**
 * Genera token de 6 dígitos único (para qr_token). Debe recibir función que consulte si existe.
 * @param {function(string): boolean} existsFn - (token) => true si ya existe
 */
function generarToken6Digitos(existsFn) {
  let token;
  let intentos = 0;
  const maxIntentos = 100;
  do {
    token = String(Math.floor(100000 + Math.random() * 900000));
    if (!existsFn(token)) return token;
    intentos++;
  } while (intentos < maxIntentos);
  return String(Date.now()).slice(-6);
}

module.exports = {
  getPasswordHashes,
  randomDateInRange,
  getSocioEstadoId,
  createDniGenerator,
  generarToken6Digitos,
  PASSWORDS,
  YEAR_START,
  YEAR_END,
  DATE_START,
  DATE_END,
};
