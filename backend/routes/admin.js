const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET OVERALL STATS
router.get('/stats', async (req, res) => {
  try {
    const studentsCount = await pool.query('SELECT COUNT(*) FROM students');
    const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');
    const revenueCount = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'");
    const activeVendors = await pool.query('SELECT COUNT(*) FROM vendors WHERE is_active = true');

    res.json({
      total_students: parseInt(studentsCount.rows[0].count),
      total_orders: parseInt(ordersCount.rows[0].count),
      total_revenue: parseFloat(revenueCount.rows[0].total),
      active_vendors: parseInt(activeVendors.rows[0].count)
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

// GET ALL ORDERS (Across all vendors)
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT o.*, s.name as student_name
      FROM orders o
      LEFT JOIN students s ON o.srn = s.srn
    `;
    const params = [];
    if (status) {
      query += ' WHERE o.status = $1';
      params.push(status);
    }
    query += ' ORDER BY o.created_at DESC LIMIT 500';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Admin get all orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// GET VENDOR-WISE BREAKDOWN
router.get('/vendor-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.vendor_id, 
        v.name, 
        COUNT(o.id) as total_orders, 
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM vendors v
      LEFT JOIN orders o ON v.vendor_id = o.vendor_id
      GROUP BY v.vendor_id, v.name
      ORDER BY total_revenue DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Vendor stats error:', error);
    res.status(500).json({ error: 'Failed to get vendor stats' });
  }
});

// GET RECENT STUDENTS
router.get('/recent-students', async (req, res) => {
  try {
    const result = await pool.query('SELECT srn, name, created_at FROM students ORDER BY created_at DESC LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Recent students error:', error);
    res.status(500).json({ error: 'Failed to get recent students' });
  }
});

module.exports = router;
