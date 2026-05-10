const pool = require('./config/database');
async function checkSchema() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'");
    console.log('--- ORDERS TABLE COLUMNS ---');
    console.log(JSON.stringify(res.rows, null, 2));
    
    const res2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_items'");
    console.log('--- ORDER_ITEMS TABLE COLUMNS ---');
    console.log(JSON.stringify(res2.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error fetching schema:', err);
    process.exit(1);
  }
}
checkSchema();
