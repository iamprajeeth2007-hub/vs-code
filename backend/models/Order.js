const pool = require('../config/database');

class Order {
  // Create new order
  static async create(studentId, orderData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate order number (CE + timestamp)
      const orderNumber = 'CE' + Date.now().toString().slice(-8);
      
      // Generate 4-digit pickup code
      const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Insert order
      const orderQuery = `
        INSERT INTO orders (
          order_number, student_id, vendor_id, store_name,
          total_amount, status, payment_status, payment_id,
          special_instructions, pickup_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const orderResult = await client.query(orderQuery, [
        orderNumber,
        studentId,
        orderData.vendorId,
        orderData.storeName,
        orderData.totalAmount,
        'pending',
        orderData.paymentStatus || 'pending',
        orderData.paymentId || null,
        orderData.specialInstructions || null,
        pickupCode
      ]);
      
      const order = orderResult.rows[0];
      
      // Insert order items
      const itemsQuery = `
        INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, price)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      for (const item of orderData.items) {
        await client.query(itemsQuery, [
          order.id,
          item.menuItemId || null,
          item.name,
          item.quantity,
          item.price
        ]);
      }
      
      await client.query('COMMIT');
      
      // Return complete order with items
      return await this.getById(order.id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get order by ID with items
  static async getById(orderId) {
    const orderQuery = `
      SELECT o.*, s.srn, s.name as student_name
      FROM orders o
      JOIN students s ON o.student_id = s.id
      WHERE o.id = $1
    `;
    
    const itemsQuery = `
      SELECT * FROM order_items WHERE order_id = $1
    `;
    
    const orderResult = await pool.query(orderQuery, [orderId]);
    const itemsResult = await pool.query(itemsQuery, [orderId]);
    
    if (orderResult.rows.length === 0) return null;
    
    return {
      ...orderResult.rows[0],
      items: itemsResult.rows
    };
  }

  // Get student order history
  static async getStudentOrders(studentId) {
    const query = `
      SELECT 
        o.id, o.order_number, o.store_name, o.total_amount,
        o.status, o.payment_status, o.pickup_code, o.created_at,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.student_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query, [studentId]);
    return result.rows;
  }

  // Get vendor orders
  static async getVendorOrders(vendorId, status = null) {
    let query = `
      SELECT 
        o.*, s.srn, s.name as student_name,
        COUNT(oi.id) as items_count
      FROM orders o
      JOIN students s ON o.student_id = s.id
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
    return result.rows;
  }

  // Update order status
  static async updateStatus(orderId, status) {
    const query = `
      UPDATE orders 
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [orderId, status]);
    return result.rows[0];
  }

  // Get today's stats for vendor
  static async getVendorStats(vendorId) {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'preparing') as preparing_count,
        COUNT(*) FILTER (WHERE status = 'ready') as ready_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE), 0) as today_revenue
      FROM orders
      WHERE vendor_id = $1 AND DATE(created_at) = CURRENT_DATE
    `;
    
    const result = await pool.query(query, [vendorId]);
    return result.rows[0];
  }
}

module.exports = Order;