const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET ALL VENDORS
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vendor_id, name, location, rating, prep_time, is_active
      FROM vendors
      WHERE is_active = true
      ORDER BY rating DESC
    `);

    console.log(`✅ Found ${result.rows.length} vendors`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Get vendors error:', error);
    res.status(500).json({ error: 'Failed to get vendors' });
  }
});

// SEARCH VENDORS AND DISHES
router.get('/search', async (req, res) => {
  try {
    const { q, filter } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const searchTerm = `%${q.toLowerCase()}%`;
    
    let filterClause = '';
    if (filter === 'veg') {
      filterClause = "AND m.veg_non_veg = 'VEG'";
    } else if (filter === 'nonveg') {
      filterClause = "AND m.veg_non_veg = 'NON-VEG'";
    }
    
    const result = await pool.query(`
      SELECT DISTINCT
        v.vendor_id,
        v.name as vendor_name,
        v.location,
        v.rating,
        v.prep_time,
        COUNT(DISTINCT m.item_id) as matching_dishes
      FROM vendors v
      LEFT JOIN menu_items m ON v.vendor_id = m.vendor_id
      WHERE v.is_active = true
      AND m.is_available = true
      AND (
        LOWER(v.name) LIKE $1
        OR LOWER(m.name) LIKE $1
      )
      ${filterClause}
      GROUP BY v.vendor_id, v.name, v.location, v.rating, v.prep_time
      ORDER BY matching_dishes DESC, v.rating DESC
    `, [searchTerm]);
    
    console.log(`🔍 Search "${q}" found ${result.rows.length} vendors`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// FILTER MENU ITEMS ACROSS ALL VENDORS
router.get('/menu/filter', async (req, res) => {
  try {
    const { food_type, minPrice, maxPrice, popular } = req.query;
    
    console.log(`🔎 Filter menu: food_type=${food_type}, minPrice=${minPrice}, maxPrice=${maxPrice}, popular=${popular}`);

    let conditions = ['m.is_available = true'];
    let params = [];
    let paramIdx = 1;

    if (food_type && food_type !== 'ALL STALLS') {
      conditions.push(`m.food_type = $${paramIdx++}`);
      params.push(food_type);
    }

    if (minPrice) {
      conditions.push(`m.price >= $${paramIdx++}`);
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      conditions.push(`m.price <= $${paramIdx++}`);
      params.push(parseFloat(maxPrice));
    }

    if (popular === 'true') {
      conditions.push(`m.is_popular = true`);
    }

    const result = await pool.query(`
      SELECT 
        m.item_id,
        m.name,
        m.category,
        m.price,
        m.veg_non_veg,
        m.is_available,
        m.is_popular,
        m.food_type,
        m.price_range,
        m.vendor_id,
        v.name as vendor_name,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as avg_rating,
        COALESCE(COUNT(r.id), 0) as total_ratings
      FROM menu_items m
      JOIN vendors v ON m.vendor_id = v.vendor_id
      LEFT JOIN dish_ratings r ON m.item_id = r.item_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY m.item_id, m.name, m.category, m.price, m.veg_non_veg, m.is_available, m.is_popular, m.food_type, m.price_range, m.vendor_id, v.name
      ORDER BY m.is_popular DESC, m.name
    `, params);

    console.log(`✅ Filter found ${result.rows.length} items`);
    res.json(result.rows.map(item => ({
      ...item,
      price: parseFloat(item.price),
      avg_rating: parseFloat(item.avg_rating) || 0,
      total_ratings: parseInt(item.total_ratings) || 0
    })));
  } catch (error) {
    console.error('❌ Filter menu error:', error);
    res.status(500).json({ error: 'Failed to filter menu' });
  }
});

// GET VENDOR MENU
router.get('/:vendorId/menu', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { filter } = req.query;
    
    console.log(`📋 Fetching menu for vendor: ${vendorId}, filter: ${filter || 'all'}`);

    let filterClause = '';
    if (filter === 'veg') {
      filterClause = "AND veg_non_veg = 'VEG'";
    } else if (filter === 'nonveg') {
      filterClause = "AND veg_non_veg = 'NON-VEG'";
    }

    const result = await pool.query(`
      SELECT 
        m.item_id,
        m.name,
        m.category,
        m.price,
        m.veg_non_veg,
        m.is_available,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as avg_rating,
        COALESCE(COUNT(r.id), 0) as total_ratings
      FROM menu_items m
      LEFT JOIN dish_ratings r ON m.item_id = r.item_id
      WHERE m.vendor_id = $1 
      AND m.is_available = true
      ${filterClause}
      GROUP BY m.item_id, m.name, m.category, m.price, m.veg_non_veg, m.is_available
      ORDER BY m.category, m.name
    `, [vendorId]);

    console.log(`✅ Found ${result.rows.length} menu items`);

    // Group by category
    const menuByCategory = {};
    
    result.rows.forEach(item => {
      const category = item.category || 'Other';
      
      if (!menuByCategory[category]) {
        menuByCategory[category] = [];
      }
      
      menuByCategory[category].push({
        item_id: item.item_id,
        name: item.name,
        price: parseFloat(item.price),
        veg_non_veg: item.veg_non_veg,
        is_available: item.is_available,
        avg_rating: parseFloat(item.avg_rating) || 0,
        total_ratings: parseInt(item.total_ratings) || 0
      });
    });

    res.json(menuByCategory);
  } catch (error) {
    console.error('❌ Get menu error:', error);
    res.status(500).json({ error: 'Failed to get menu' });
  }
});

module.exports = router;