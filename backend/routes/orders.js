const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// CREATE ORDER
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { vendorId, storeName, totalAmount, items, studentSrn: rawSrn } = req.body;
    const studentSrn = rawSrn ? rawSrn.toUpperCase() : null;
    
    console.log('📥 Received order:', { vendorId, storeName, totalAmount, itemsCount: items?.length, studentSrn });
    
    // Validate
    if (!vendorId || !storeName || !totalAmount || !items || items.length === 0 || !studentSrn) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find student by SRN (case-insensitive for safety)
    const studentResult = await client.query('SELECT id, srn, name FROM students WHERE UPPER(srn) = UPPER($1)', [studentSrn]);
    
    if (studentResult.rows.length === 0) {
      console.warn('⚠️ Student lookup failed for SRN:', studentSrn);
      return res.status( studentSrn ? 404 : 400 ).json({ 
        error: studentSrn ? 'Student not found. Please re-login.' : 'SRN required' 
      });
    }
    
    console.log(`👤 Found student: ${studentResult.rows[0].name} (${studentResult.rows[0].srn})`);
    
    const studentId = studentResult.rows[0].id;
    const srn = studentResult.rows[0].srn;
    
    // Generate order number and pickup code
    const orderNumber = 'CE' + Date.now().toString().slice(-8);
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Insert order
    const orderResult = await client.query(`
      INSERT INTO orders (srn, vendor_id, store_name, order_number, pickup_code, total_amount, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [srn, vendorId, storeName, orderNumber, pickupCode, totalAmount, 'pending']);
    
    const order = orderResult.rows[0];
    
    // Insert order items
    for (const item of items) {
      const subtotal = item.price * item.quantity;
      await client.query(`
        INSERT INTO order_items (order_id, item_id, item_name, quantity, price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, item.item_id, item.name, item.quantity, item.price, subtotal]);
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Order created:', orderNumber);
    
    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        pickup_code: order.pickup_code,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at
      }
    });
    
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ ORDER CREATION FAILED:', error);
    res.status(500).json({ 
      error: 'Failed to create order', 
      details: error.message,
      errorCode: error.code // PostgreSQL error code like '23505'
    });
  } finally {
    if (client) client.release();
  }
});

// GET ORDER HISTORY
router.get('/history', async (req, res) => {
  try {
    const rawSrn = req.query.srn;
    if (!rawSrn) return res.status(400).json({ error: 'SRN required' });
    const srn = rawSrn.toUpperCase();
    
    const result = await pool.query(`
      SELECT o.*, COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.srn = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [srn]);
    
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('❌ Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});


// GET VENDOR ORDERS
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status } = req.query;
    
    console.log(`📋 Fetching orders for vendor: ${vendorId}, status: ${status || 'all'}`);
    
    let query = `
      SELECT o.*, s.name as student_name, COUNT(oi.id) as items_count
      FROM orders o
      JOIN students s ON o.srn = s.srn
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.vendor_id = $1
    `;
    
    const params = [vendorId];
    if (status) {
      query += ` AND o.status = $2`;
      params.push(status);
    }
    
    query += ` GROUP BY o.id, s.id ORDER BY o.created_at DESC LIMIT 100`;
    
    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('❌ Get vendor orders error:', error);
    res.status(500).json({ error: 'Failed to get vendor orders' });
  }
});

// GET ALL ORDERS (Across all vendors)
router.get('/all', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT o.*, s.name as student_name, COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN students s ON o.srn = s.srn
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const params = [];
    if (status) {
      query += ' WHERE o.status = $1';
      params.push(status);
    }
    query += ' GROUP BY o.id, s.id ORDER BY o.created_at DESC LIMIT 500';

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('❌ Admin get all orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// GET SINGLE ORDER DETAILS
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const orderResult = await pool.query(`
      SELECT o.*, s.name as student_name
      FROM orders o
      JOIN students s ON o.srn = s.srn
      WHERE o.id = $1
    `, [orderId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const itemsResult = await pool.query(`
      SELECT * FROM order_items WHERE order_id = $1
    `, [orderId]);
    
    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('❌ Get order details error:', error);
    res.status(500).json({ error: 'Failed to get order details' });
  }
});

// UPDATE ORDER STATUS (Supports PUT and PATCH)
const updateStatusHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(`
      UPDATE orders SET status = $1 WHERE id = $2 RETURNING *
    `, [status, orderId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

router.put('/:orderId/status', updateStatusHandler);
router.patch('/:orderId/status', updateStatusHandler);

// GET VENDOR STATS
router.get('/vendor/:vendorId/stats', async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'preparing') as preparing_count,
        COUNT(*) FILTER (WHERE status = 'ready') as ready_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE), 0) as today_revenue
      FROM orders
      WHERE vendor_id = $1 AND DATE(created_at) = CURRENT_DATE
    `, [vendorId]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Get vendor stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;