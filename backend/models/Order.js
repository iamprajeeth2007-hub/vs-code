const pool = require('../config/database');

class Order {
  // Create new order
  static async create(studentSrn, orderData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate order number (CE + timestamp)
      const orderNumber = 'CE' + Date.now().toString().slice(-8);

      // Generate 4-digit pickup code
      const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

      // Insert order — using 'srn' and 'total' to match DB schema
      const orderQuery = `
        INSERT INTO orders (
          order_number, srn, vendor_id, store_name,
          total_amount, status, pickup_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const orderResult = await client.query(orderQuery, [
        orderNumber,
        studentSrn,
        orderData.vendorId,
        orderData.storeName,
        orderData.totalAmount,
        'pending',
        pickupCode
      ]);

      const order = orderResult.rows[0];

      // Insert order items
      const itemsQuery = `
        INSERT INTO order_items (order_id, item_id, item_name, quantity, price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      for (const item of orderData.items) {
        await client.query(itemsQuery, [
          order.id,
          item.item_id || null,
          item.name,
          item.quantity,
          item.price,
          item.price * item.quantity
        ]);
      }

      await client.query('COMMIT');

      return {
        id: order.id,
        order_number: order.order_number,
        pickup_code: order.pickup_code || pickupCode,
        total_amount: order.total_amount,
        status: order.status,
        srn: order.srn
      };

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
      SELECT o.*, s.name as student_name
      FROM orders o
      JOIN students s ON o.srn = s.srn
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
  static async getStudentOrders(srn) {
    const query = `
      SELECT 
        o.id, o.order_number, o.store_name, o.total_amount,
        o.status, o.pickup_code, o.created_at,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.srn = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `;

    const result = await pool.query(query, [srn]);
    return result.rows;
  }

  // Get vendor orders
  static async getVendorOrders(vendorId, status = null) {
    let query = `
      SELECT 
        o.*, s.name as student_name,
        COUNT(oi.id) as items_count
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
    return result.rows;
  }

  // Update order status
  static async updateStatus(orderId, status) {
    const query = `
      UPDATE orders 
      SET status = $2
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

  // Get all orders (admin)
  static async getAllOrders() {
    const query = `
      SELECT 
        o.id, o.order_number, o.srn, o.vendor_id, o.store_name,
        o.total_amount, o.status, o.pickup_code, o.created_at,
        s.name as student_name
      FROM orders o
      LEFT JOIN students s ON o.srn = s.srn
      ORDER BY o.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Order;