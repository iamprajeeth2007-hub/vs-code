const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ==========================================
// GET ALL VENDORS
// ==========================================
router.get('/', async (req, res) => {
  console.log('🔍 GET /api/vendors called');
  
  try {
    const result = await pool.query(`
      SELECT 
        vendor_id,
        store_name,
        location,
        rating,
        prep_time,
        is_active,
        email,
        phone
      FROM vendors
      WHERE is_active = true
      ORDER BY rating DESC
    `);

    console.log(`✅ Found ${result.rows.length} vendors`);
    
    // Make sure we return the correct format
    const response = { vendors: result.rows };
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    
    res.json(response);
  } catch (error) {
    console.error('❌ Get vendors error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to get vendors',
      details: error.message 
    });
  }
});

// ==========================================
// GET VENDOR BY ID
// ==========================================
router.get('/:vendorId', async (req, res) => {
  console.log('🔍 GET /api/vendors/:vendorId called');
  
  try {
    const { vendorId } = req.params;
    
    console.log('Looking for vendor:', vendorId);
    
    const result = await pool.query(
      'SELECT * FROM vendors WHERE vendor_id = $1',
      [vendorId]
    );

    if (result.rows.length === 0) {
      console.log('❌ Vendor not found:', vendorId);
      return res.status(404).json({ error: 'Vendor not found' });
    }

    console.log(`✅ Found vendor: ${result.rows[0].store_name}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Get vendor error:', error);
    res.status(500).json({ 
      error: 'Failed to get vendor',
      details: error.message 
    });
  }
});

// ==========================================
// GET VENDOR MENU (GROUPED BY CATEGORY)
// ==========================================
router.get('/:vendorId/menu', async (req, res) => {
  console.log('🔍 GET /api/vendors/:vendorId/menu called');
  
  try {
    const { vendorId } = req.params;
    
    console.log(`📋 Fetching menu for vendor: ${vendorId}`);

    // First check if vendor exists
    const vendorCheck = await pool.query(
      'SELECT store_name FROM vendors WHERE vendor_id = $1',
      [vendorId]
    );

    if (vendorCheck.rows.length === 0) {
      console.log(`❌ Vendor not found: ${vendorId}`);
      return res.status(404).json({ error: 'Vendor not found' });
    }

    console.log(`✅ Vendor found: ${vendorCheck.rows[0].store_name}`);

    // Get all menu items for this vendor - USING menu_items TABLE
    const result = await pool.query(`
      SELECT 
        id,
        item_id,
        name,
        category,
        price,
        veg_non_veg,
        is_available
      FROM menu_items
      WHERE vendor_id = $1 AND is_available = true
      ORDER BY category, name
    `, [vendorId]);

    console.log(`✅ Found ${result.rows.length} menu items`);

    if (result.rows.length === 0) {
      console.log('⚠️ No menu items found for this vendor');
      return res.json({});
    }

    // Group items by category
    const menuByCategory = {};
    
    result.rows.forEach(item => {
      const category = item.category || 'Other';
      
      if (!menuByCategory[category]) {
        menuByCategory[category] = [];
      }
      
      menuByCategory[category].push({
        id: item.id,
        item_id: item.item_id,
        name: item.name,
        description: '', // menu_items doesn't have description
        price: parseFloat(item.price),
        category: item.category,
        veg_non_veg: item.veg_non_veg,
        is_available: item.is_available
      });
    });

    // Log categories found
    const categories = Object.keys(menuByCategory);
    console.log(`📂 Categories found: ${categories.join(', ')}`);
    console.log(`📊 Items per category:`, Object.entries(menuByCategory).map(([cat, items]) => `${cat}: ${items.length}`).join(', '));

    res.json(menuByCategory);
  } catch (error) {
    console.error('❌ Get menu error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to get menu',
      details: error.message 
    });
  }
});

module.exports = router;