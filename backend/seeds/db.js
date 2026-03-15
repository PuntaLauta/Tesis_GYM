const path = require('path');
const db = require(path.join(__dirname, '..', 'db', 'database'));

module.exports = {
  dbPromise: db.dbPromise,
  run: db.run,
  insert: db.insert,
  query: db.query,
  get: db.get,
  getDatabase: db.getDatabase,
};
