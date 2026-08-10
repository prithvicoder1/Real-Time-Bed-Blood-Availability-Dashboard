const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://carebridge:carebridge@localhost:5432/carebridge',
  max: 10,
  connectionTimeoutMillis: 1500,
});

let connected = false;

async function connectDB() {
  try {
    await pool.query('SELECT 1');
    connected = true;
    console.log('PostgreSQL connected');
  } catch (error) {
    connected = false;
    console.warn(`PostgreSQL unavailable; using demo data: ${error.message}`);
  }
}

const dbStatus = () => (connected ? 'connected' : 'demo-fallback');

module.exports = connectDB;
module.exports.pool = pool;
module.exports.dbStatus = dbStatus;
