const pool = require('./config/database');
async function run() {
  const res = await pool.query("SELECT table_name, column_name, is_nullable FROM information_schema.columns WHERE table_name IN ('orders', 'order_items') AND is_nullable = 'NO'");
  res.rows.forEach(r => console.log(`${r.table_name}.${r.column_name} is NOT NULL`));
  process.exit(0);
}
run();
