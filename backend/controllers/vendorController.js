const pool = require('../config/database');

// GET /api/vendors
exports.getAllVendors = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vendor_id, name, rating, prep_time, location, is_active 
       FROM vendors 
       WHERE is_active = true 
       ORDER BY name`
    );
    res.json({
      success: true,
      count: result.rows.length,
      vendors: result.rows
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

// GET /api/vendors/:vendorId
exports.getVendorById = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const result = await pool.query(
      'SELECT * FROM vendors WHERE vendor_id = $1',
      [vendorId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ success: true, vendor: result.rows[0] });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
};

// GET /api/vendors/:vendorId/menu
exports.getVendorMenu = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendorResult = await pool.query(
      'SELECT * FROM vendors WHERE vendor_id = $1',
      [vendorId]
    );
    if (vendorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const menuResult = await pool.query(
      `SELECT id, item_id, vendor_id, name, description, price, category, veg_non_veg, is_available
       FROM menu_items 
       WHERE vendor_id = $1 AND is_available = true
       ORDER BY category, name`,
      [vendorId]
    );

    res.json({
      success: true,
      vendor: {
        id: vendorResult.rows[0].vendor_id,
        name: vendorResult.rows[0].name
      },
      count: menuResult.rows.length,
      menu: menuResult.rows
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
};

// PUT /api/vendors/:vendorId/status
exports.updateVendorStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { isActive } = req.body;
    const result = await pool.query(
      'UPDATE vendors SET is_active = $2 WHERE vendor_id = $1 RETURNING *',
      [vendorId, isActive]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ success: true, vendor: result.rows[0] });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
};