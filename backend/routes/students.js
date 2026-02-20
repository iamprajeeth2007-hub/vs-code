const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM students');
    const count = parseInt(result.rows[0].count);
    res.json({ count });
  } catch (error) {
    console.error('❌ Get student count error:', error);
    res.status(500).json({ error: 'Failed to get student count' });
  }
});

module.exports = router;