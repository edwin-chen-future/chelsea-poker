const { Pool } = require('pg');

const databaseUrl =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    `DATABASE_URL${process.env.NODE_ENV === 'test' ? ' or TEST_DATABASE_URL' : ''} environment variable is required`
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id               SERIAL PRIMARY KEY,
      stake            TEXT    NOT NULL,
      duration_minutes INTEGER NOT NULL,
      result_amount    NUMERIC NOT NULL,
      location         TEXT    NOT NULL,
      session_date     TEXT    NOT NULL,
      notes            TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

module.exports = { pool, initDb };
