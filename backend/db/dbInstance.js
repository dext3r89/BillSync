let dbInstance = null;

function setDB(db) {
  dbInstance = db;
}

function getDB() {
  if (!dbInstance) {
    throw new Error("DB not initialized");
  }
  return dbInstance;
}

module.exports = { setDB, getDB };
