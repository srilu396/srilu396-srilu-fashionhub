const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all customers (admin only)
router.get('/', async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    
    // Build query
    let query = { role: 'user' };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    const customers = await User.find(query)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers'
    });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .select('-password');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer'
    });
  }
});

// Update customer status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const customer = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

// Get customer statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const total = await User.countDocuments({ role: 'user' });
    const active = await User.countDocuments({ role: 'user', status: 'active' });
    const inactive = await User.countDocuments({ role: 'user', status: 'inactive' });
    
    res.json({
      success: true,
      stats: {
        total,
        active,
        inactive
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});


// Admin sync routes
router.post('/sync/cart', adminAuth, async (req, res) => {
  try {
    const { customerId, cart } = req.body;
    
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    user.cart = cart;
    await user.save();
    
    res.json({
      success: true,
      message: 'Cart synced successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sync/wishlist', adminAuth, async (req, res) => {
  try {
    const { customerId, wishlist } = req.body;
    
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    user.wishlist = wishlist;
    await user.save();
    
    res.json({
      success: true,
      message: 'Wishlist synced successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sync/order', adminAuth, async (req, res) => {
  try {
    const { customerId, order } = req.body;
    
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Update user's order history
    await Order.create({
      ...order,
      user: customerId
    });
    
    res.json({
      success: true,
      message: 'Order synced successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sync/order-status', adminAuth, async (req, res) => {
  try {
    const { customerId, orderId, status } = req.body;
    
    const order = await Order.findOne({ orderId, user: customerId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    order.status = status;
    await order.save();
    
    res.json({
      success: true,
      message: 'Order status updated'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get customer activity (for admin)
router.get('/:customerId/activity', adminAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const user = await User.findById(customerId)
      .populate('cart.product')
      .populate('wishlist');
    
    const orders = await Order.find({ user: customerId });
    
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    // Get last order date
    const lastOrder = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    // Get favorite categories from orders
    const categoryCount = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.category) {
          categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
        }
      });
    });
    
    const favoriteCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
    
    res.json({
      success: true,
      activity: {
        totalOrders,
        totalSpent,
        averageOrder,
        lastOrderDate: lastOrder?.createdAt || null,
        favoriteCategories,
        wishlistCount: user.wishlist.length,
        cartCount: user.cart.length,
        activityTimeline: [
          {
            type: 'account_created',
            date: user.createdAt,
            description: 'Account created'
          },
          ...orders.map(order => ({
            type: 'order_placed',
            date: order.createdAt,
            description: `Order placed - $${order.totalAmount}`
          }))
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


function broadcastActivity(activity) {
  }

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const customer = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        statusUpdatedAt: new Date() // Add timestamp
      },
      { new: true }
    ).select('-password');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      customer,
      message: `Customer status updated to ${status}`
    });
    
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

// Get customer's cart (admin only)
router.get('/:id/cart', adminAuth, async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .populate('cart.product', 'name price image category')
      .select('cart');
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    res.json({
      success: true,
      cart: customer.cart || []
    });
  } catch (error) {
    console.error('Error fetching customer cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching customer cart' 
    });
  }
});

// Get customer's wishlist (admin only)
router.get('/:id/wishlist', adminAuth, async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .populate('wishlist', 'name price image category')
      .select('wishlist');
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    res.json({
      success: true,
      wishlist: customer.wishlist || []
    });
  } catch (error) {
    console.error('Error fetching customer wishlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching customer wishlist' 
    });
  }
});

// Get customer's complete data including cart and wishlist counts
router.get('/:id/complete', adminAuth, async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .populate('cart.product', 'name price image')
      .populate('wishlist', 'name price image')
      .select('-password');
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
    
    // Get orders for this customer
    const orders = await Order.find({ user: req.params.id });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    // Calculate completed and pending orders
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'processing').length;
    
    // Get last order date
    const lastOrder = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    res.json({
      success: true,
      customer: {
        ...customer.toObject(),
        totalOrders,
        totalSpent,
        averageOrderValue,
        cartCount: customer.cart.length,
        wishlistCount: customer.wishlist.length,
        completedOrders,
        pendingOrders,
        lastOrderDate: lastOrder?.createdAt || null
      }
    });
  } catch (error) {
    console.error('Error fetching complete customer data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching customer data' 
    });
  }
});

// Add this route to get ALL orders from ALL customers (Admin only)
router.get('/admin/orders', adminAuth, async (req, res) => {
  try {
    console.log('📦 Fetching all orders for admin...');
    
    // Get all customers
    const customers = await User.find({ role: 'user' })
      .select('_id name email username phone address status createdAt');
    
    // Array to store all orders
    const allOrders = [];
    
    // Get orders for each customer
    for (const customer of customers) {
      try {
        // Check if customer has orders in User model
        const userWithOrders = await User.findById(customer._id)
          .populate('orders', 'orderId items totalAmount status createdAt shippingAddress paymentMethod')
          .select('orders');
        
        if (userWithOrders.orders && userWithOrders.orders.length > 0) {
          // Format orders with customer info
          const customerOrders = userWithOrders.orders.map(order => ({
            ...order.toObject ? order.toObject() : order,
            userId: customer._id,
            userName: customer.name || customer.username || 'Customer',
            userEmail: customer.email,
            userPhone: customer.phone,
            userAddress: customer.address
          }));
          
          allOrders.push(...customerOrders);
        }
        
        // Also check Order collection
        const ordersFromCollection = await Order.find({ user: customer._id });
        if (ordersFromCollection.length > 0) {
          const formattedOrders = ordersFromCollection.map(order => ({
            ...order.toObject(),
            userId: customer._id,
            userName: customer.name || customer.username || 'Customer',
            userEmail: customer.email,
            userPhone: customer.phone,
            userAddress: customer.address
          }));
          
          allOrders.push(...formattedOrders);
        }
        
      } catch (error) {
        console.error(`Error fetching orders for customer ${customer._id}:`, error);
        // Continue with next customer
      }
    }
    
    // Remove duplicates
    const uniqueOrders = [];
    const orderIds = new Set();
    
    allOrders.forEach(order => {
      const orderId = order.orderId || order._id.toString();
      if (!orderIds.has(orderId)) {
        orderIds.add(orderId);
        uniqueOrders.push(order);
      }
    });
    
    // Sort by date (newest first)
    uniqueOrders.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.orderDate || 0);
      const dateB = new Date(b.createdAt || b.orderDate || 0);
      return dateB - dateA;
    });
    
    console.log(`✅ Found ${uniqueOrders.length} total orders from ${customers.length} customers`);
    
    res.json({
      success: true,
      orders: uniqueOrders,
      count: uniqueOrders.length,
      customerCount: customers.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all orders',
      error: error.message
    });
  }
});

// Add order status update endpoint
router.put('/admin/orders/:orderId/status', adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating order ${orderId} to status: ${status}`);
    
    // Valid statuses
    const validStatuses = ['processing', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    // First try to find in Order collection
    let order = await Order.findOne({ orderId: orderId });
    
    if (!order) {
      // Try to find in User's orders array
      const userWithOrder = await User.findOne({ 'orders.orderId': orderId });
      
      if (userWithOrder) {
        const orderIndex = userWithOrder.orders.findIndex(o => o.orderId === orderId);
        if (orderIndex > -1) {
          userWithOrder.orders[orderIndex].status = status;
          userWithOrder.orders[orderIndex].updatedAt = new Date();
          
          if (status === 'delivered') {
            userWithOrder.orders[orderIndex].deliveredAt = new Date();
          } else if (status === 'shipped') {
            userWithOrder.orders[orderIndex].shippedAt = new Date();
          } else if (status === 'cancelled') {
            userWithOrder.orders[orderIndex].cancelledAt = new Date();
          }
          
          await userWithOrder.save();
          order = userWithOrder.orders[orderIndex];
        }
      }
    } else {
      // Update in Order collection
      order.status = status;
      order.updatedAt = new Date();
      
      if (status === 'delivered') {
        order.deliveredAt = new Date();
      } else if (status === 'shipped') {
        order.shippedAt = new Date();
      } else if (status === 'cancelled') {
        order.cancelledAt = new Date();
      }
      
      await order.save();
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    console.log(`✅ Order ${orderId} updated to ${status}`);
    
    res.json({
      success: true,
      order,
      message: `Order status updated to ${status}`
    });
    
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// Add order cancel endpoint
router.put('/admin/orders/:orderId/cancel', adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`❌ Cancelling order ${orderId}`);
    
    // Find and cancel order
    const result = await Order.findOneAndUpdate(
      { orderId: orderId },
      { 
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      // Try to find in User's orders
      const userWithOrder = await User.findOne({ 'orders.orderId': orderId });
      
      if (userWithOrder) {
        const orderIndex = userWithOrder.orders.findIndex(o => o.orderId === orderId);
        if (orderIndex > -1) {
          userWithOrder.orders[orderIndex].status = 'cancelled';
          userWithOrder.orders[orderIndex].cancelledAt = new Date();
          userWithOrder.orders[orderIndex].updatedAt = new Date();
          
          await userWithOrder.save();
          const cancelledOrder = userWithOrder.orders[orderIndex];
          
          return res.json({
            success: true,
            order: cancelledOrder,
            message: 'Order cancelled successfully'
          });
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    console.log(`✅ Order ${orderId} cancelled`);
    
    res.json({
      success: true,
      order: result,
      message: 'Order cancelled successfully'
    });
    
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
});

module.exports = router;