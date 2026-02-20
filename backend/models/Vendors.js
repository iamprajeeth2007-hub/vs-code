const pool = require('../config/database');

class Vendor {
  // Get all active vendors
  static async getAll() {
    const query = `
      SELECT vendor_id, store_name, rating, prep_time, location, is_active
      FROM vendors
      WHERE is_active = true
      ORDER BY store_name
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get vendor by ID
  static async getById(vendorId) {
    const query = `SELECT * FROM vendors WHERE vendor_id = $1`;
    const result = await pool.query(query, [vendorId]);
    return result.rows[0];
  }

  // Get vendor menu - matches exact Supabase columns from screenshot
  static async getMenu(vendorId) {
    const query = `
      SELECT 
        id,
        item_id,
        vendor_id,
        name,
        description,
        price,
        category,
        veg_non_veg,
        is_available
      FROM menu_items
      WHERE vendor_id = $1
      AND is_available = true
      ORDER BY category, name
    `;
    const result = await pool.query(query, [vendorId]);
    return result.rows;
  }

  // Update vendor status
  static async updateStatus(vendorId, isActive) {
    const query = `
      UPDATE vendors 
      SET is_active = $2
      WHERE vendor_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [vendorId, isActive]);
    return result.rows[0];
  }
}

module.exports = Vendor;