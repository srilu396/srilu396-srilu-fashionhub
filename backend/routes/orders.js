const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

// Helper to decode token safely
const decodeToken = (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// GET /api/orders - Fetch orders for logged in user or all orders if admin
router.get('/', async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (decoded.role === 'admin') {
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('user', 'username email firstName lastName')
        .populate('items.product');

      return res.json({
        success: true,
        count: orders.length,
        orders
      });
    } else {
      const orders = await Order.find({ user: decoded.id })
        .sort({ createdAt: -1 })
        .populate('items.product');

      return res.json({
        success: true,
        count: orders.length,
        orders
      });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/admin/all - Get all orders across all customers (for admin dashboard)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username email firstName lastName phone address')
      .populate('items.product');

    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      return {
        ...orderObj,
        userId: order.user?._id || order.user,
        userName: order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.username : 'Customer',
        userEmail: order.user?.email || 'No email',
        userPhone: order.user?.phone || '',
        userAddress: order.user?.address || ''
      };
    });

    const uniqueCustomers = new Set(orders.map(o => o.user?._id?.toString() || o.user?.toString())).size;

    res.json({
      success: true,
      count: formattedOrders.length,
      customerCount: uniqueCustomers,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching all orders for admin:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders or POST /api/orders/create - Create order
const createOrderHandler = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { items, shippingAddress, totalAmount, paymentMethod } = req.body;

    const orderId = req.body.orderId || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const order = new Order({
      orderId,
      user: decoded.id,
      items: items || [],
      shippingAddress: shippingAddress || {},
      totalAmount: totalAmount || 0,
      paymentMethod: paymentMethod || 'Credit Card',
      status: 'processing'
    });

    await order.save();

    // Clear user's cart in database
    const user = await User.findById(decoded.id);
    if (user) {
      user.cart = [];
      await user.save();
    }

    const populatedOrder = await Order.findById(order._id).populate('items.product');

    res.json({
      success: true,
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post('/', createOrderHandler);
router.post('/create', createOrderHandler);

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let order = await Order.findOne({ $or: [{ _id: id }, { orderId: id }] });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/cancel - Cancel order
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let order = await Order.findOne({ $or: [{ _id: id }, { orderId: id }] });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (decoded.role !== 'admin' && order.user.toString() !== decoded.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
