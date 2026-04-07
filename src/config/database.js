
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'crud-with-postgres'
});

// Test the database connection
pool.on('connect', () => {
  console.log('✅ Connected to the database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database test query failed:', err);
  } else {
    console.log('✅ Database ready:', result.rows[0]);
  }
});

module.exports = pool;