const pg = require('pg');
const Pool = pg.Pool;
require('dotenv').config();

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file!');
  console.error('💡 Create a .env file in the backend folder with your database URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected database error:', err);
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