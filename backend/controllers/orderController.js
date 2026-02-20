const Order = require('../models/Order');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const studentId = req.user.id;
    const orderData = req.body;

    // Validation
    if (!orderData.vendorId || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Create order
    const order = await Order.create(studentId, {
      vendorId: orderData.vendorId,
      storeName: orderData.storeName,
      totalAmount: orderData.totalAmount,
      items: orderData.items,
      specialInstructions: orderData.specialInstructions,
      paymentStatus: orderData.paymentStatus || 'pending',
      paymentId: orderData.paymentId
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get student order history
exports.getOrderHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const orders = await Order.getStudentOrders(studentId);

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.getById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify order belongs to user
    if (order.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Get vendor orders (vendor only)
exports.getVendorOrders = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status } = req.query;
    
    const orders = await Order.getVendorOrders(vendorId, status);

    res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update order status (vendor only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.updateStatus(orderId, status);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Get vendor stats
exports.getVendorStats = async (req, res) => {
  try {
    const { vendorId } = req.params;
    
    const stats = await Order.getVendorStats(vendorId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};