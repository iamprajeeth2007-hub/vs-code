const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// CREATE NEW ORDER
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { vendorId, storeName, totalAmount, items, paymentStatus, paymentId, studentSrn } = req.body;

    let studentId;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        studentId = decoded.id;
      } catch (err) {
        console.log('⚠️ Token invalid, will use SRN fallback');
      }
    }

    if (!studentId && studentSrn) {
      const studentResult = await client.query('SELECT id FROM students WHERE srn = $1', [studentSrn]);
      if (studentResult.rows.length > 0) {
        studentId = studentResult.rows[0].id;
      }
    }

    if (!studentId) throw new Error('Student not found');

    const orderNumber = 'ORD' + Date.now();
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    const orderResult = await client.query(`
      INSERT INTO orders (student_id, vendor_id, store_name, order_number, pickup_code, total_amount, status, payment_status, payment_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *
    `, [studentId, vendorId, storeName, orderNumber, pickupCode, totalAmount, 'pending', paymentStatus || 'paid', paymentId || 'cash_' + Date.now()]);

    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, item_id, item_name, quantity, price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, item.menuItemId || item.item_id || item.id, item.name, item.quantity, item.price, item.price * item.quantity]);
    }

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      order: { id: order.id, order_number: order.order_number, pickup_code: order.pickup_code, total_amount: order.total_amount, status: order.status, created_at: order.created_at }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  } finally {
    client.release();
  }
});

// GET ALL ORDERS (admin dashboard) - must be before /:orderId
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, s.name as student_name, s.srn
      FROM orders o
      LEFT JOIN students s ON o.student_id = s.id
      ORDER BY o.created_at DESC
    `);
    console.log(`✅ Found ${result.rows.length} total orders`);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('❌ Get all orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// GET ORDER HISTORY FOR STUDENT
router.get('/history', async (req, res) => {
  try {
    const srn = req.query.srn;
    if (!srn) return res.status(400).json({ error: 'SRN required' });

    const studentResult = await pool.query('SELECT id FROM students WHERE srn = $1', [srn]);
    if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    const studentId = studentResult.rows[0].id;
    const result = await pool.query(`
      SELECT o.id, o.order_number, o.store_name, o.pickup_code, o.total_amount, o.status, o.created_at, COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.student_id = $1
      GROUP BY o.id ORDER BY o.created_at DESC
    `, [studentId]);

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('❌ Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// GET ORDERS FOR VENDOR
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const status = req.query.status;

    let query = `
      SELECT o.id, o.order_number, o.pickup_code, o.total_amount, o.status, o.created_at,
        s.name as student_name, s.srn, COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN students s ON o.student_id = s.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.vendor_id = $1
    `;
    const params = [vendorId];
    if (status) { query += ` AND o.status = $2`; params.push(status); }
    query += ` GROUP BY o.id, s.name, s.srn ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('❌ Get vendor orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// GET ORDER DETAILS WITH ITEMS
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderResult = await pool.query(`
      SELECT o.*, s.name as student_name, s.srn
      FROM orders o LEFT JOIN students s ON o.student_id = s.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    console.error('❌ Get order details error:', error);
    res.status(500).json({ error: 'Failed to get order details' });
  }
});

// UPDATE ORDER STATUS
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(`
      UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
    `, [status, orderId]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;