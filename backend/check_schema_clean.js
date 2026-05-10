const pool = require('./config/database');
async function run() {
  const res = await pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('orders', 'order_items') ORDER BY table_name, column_name");
  res.rows.forEach(r => console.log(`${r.table_name}.${r.column_name}`));
  process.exit(0);
}
run();
