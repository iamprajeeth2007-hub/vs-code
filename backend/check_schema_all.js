const pool = require('./config/database');
async function checkSchema() {
  try {
    const res = await pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('students', 'vendors', 'menu_items', 'orders')");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching schema:', err);
    process.exit(1);
  }
}
checkSchema();
