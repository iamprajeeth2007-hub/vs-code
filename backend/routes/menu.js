const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get menu by vendor
router.get('/:vendorId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM menu_items
      WHERE vendor_id = $1 AND is_available = true
      ORDER BY category, name
    `, [req.params.vendorId]);
    
    // Group by category
    const menu = {};
    result.rows.forEach(item => {
      const category = item.category || 'Other';
      if (!menu[category]) menu[category] = [];
      menu[category].push(item);
    });
    
    res.json(menu);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: 'Failed to get menu' });
  }
});

module.exports = router;