const pool = require('./config/database');
async function run() {
  const res = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('payment_id', 'payment_status')");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();
