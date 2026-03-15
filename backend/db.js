const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH =
  process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(__dirname, 'poker.db');

let db = null;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stake TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      location TEXT NOT NULL,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Format a raw SQLite row: convert played_at to ISO 8601 UTC string.
// SQLite CURRENT_TIMESTAMP stores as "YYYY-MM-DD HH:MM:SS" in UTC.
function formatRow(row) {
  if (!row) return row;
  return {
    ...row,
    played_at: row.played_at ? row.played_at.replace(' ', 'T') + 'Z' : null,
  };
}

function insertSession({ stake, duration_minutes, amount, location }) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO sessions (stake, duration_minutes, amount, location)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(stake, duration_minutes, amount, location);
  return getSessionById(result.lastInsertRowid);
}

function getAllSessions() {
  const database = getDb();
  const rows = database
    .prepare('SELECT * FROM sessions ORDER BY id DESC')
    .all();
  return rows.map(formatRow);
}

function getSessionById(id) {
  const database = getDb();
  const row = database
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(id);
  return formatRow(row);
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, insertSession, getAllSessions, getSessionById, closeDb };
