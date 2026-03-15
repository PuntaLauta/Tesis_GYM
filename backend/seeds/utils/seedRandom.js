/**
 * RNG determinista para seeds. Si DATA_SEED está definido en .env, mismo valor genera los mismos datos.
 */
let rng = Math.random;
let currentSeed = null;

function hashSeedToNumber(seed) {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function init(seed) {
  if (seed != null && String(seed).trim() !== '') {
    currentSeed = String(seed).trim();
    const seedrandom = require('seedrandom');
    rng = seedrandom(currentSeed);
  } else {
    currentSeed = null;
    rng = Math.random;
  }
}

function random() {
  return rng();
}

function getSeedForFaker() {
  if (currentSeed == null) return null;
  return hashSeedToNumber(currentSeed);
}

function getCurrentSeed() {
  return currentSeed;
}

module.exports = {
  init,
  random,
  getSeedForFaker,
  getCurrentSeed,
};
