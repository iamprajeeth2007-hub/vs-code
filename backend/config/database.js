const pg = require('pg');
const Pool = pg.Pool;
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to Supabase PostgreSQL database');
    client.query('SELECT NOW()', (err, result) => {
      release();
      if (err) {
        console.error('❌ Database query error:', err.message);
      } else {
        console.log('✅ Database is working! Current time:', result.rows[0].now);
      }
    });
  }
});

module.exports = pool;