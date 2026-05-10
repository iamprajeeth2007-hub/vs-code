const pool = require('./config/database');
async function run() {
  const res = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'order_items' AND column_name IN ('item_id', 'item_name')");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();
