const pool = require('./config/database');
async function run() {
  const res = await pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('orders', 'order_items') AND is_nullable = 'NO'");
  console.log('NOT NULL COLUMNS:');
  console.log(res.rows.map(r => `${r.table_name}.${r.column_name}`).join(', '));
  process.exit(0);
}
run();
