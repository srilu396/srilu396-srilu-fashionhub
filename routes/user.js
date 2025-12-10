const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    console.log('📝 User registration attempt:', { 
      username, 
      email, 
      firstName, 
      lastName,
      passwordLength: password ? password.length : 0 
    });

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required: username, email, password, firstName, lastName'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user'
    });

    console.log('💾 Saving user to database...');
    
    // Save user to database
    const savedUser = await newUser.save();

    // Remove password from response
    const userResponse = {
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      role: savedUser.role
    };

    console.log('✅ User registered successfully:', userResponse.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ User registration error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User already exists with this ${field}`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('❌ Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Failed to register user. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    console.log('✅ User logged in successfully:', userResponse.id);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id/activity', async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .populate('orders')
      .populate('wishlist')
      .populate('cart.product');
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Safely calculate activity statistics
    const totalOrders = customer.orders?.length || 0;
    const totalSpent = customer.orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
    const wishlistCount = customer.wishlist?.length || 0;
    const cartCount = customer.cart?.length || 0;
    
    // Get last order date
    let lastOrderDate = null;
    if (customer.orders && customer.orders.length > 0) {
      const sortedOrders = [...customer.orders].sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      lastOrderDate = sortedOrders[0]?.createdAt || null;
    }
    
    // Extract favorite categories from orders
    const favoriteCategories = [];
    if (customer.orders) {
      customer.orders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            if (item.category && !favoriteCategories.includes(item.category)) {
              favoriteCategories.push(item.category);
            }
          });
        }
      });
    }
    
    // Create activity timeline
    const activityTimeline = [];
    
    // Add account creation
    if (customer.createdAt) {
      activityTimeline.push({
        type: 'account_created',
        date: customer.createdAt,
        description: 'Account created'
      });
    }
    
    // Add last login
    if (customer.lastLogin) {
      activityTimeline.push({
        type: 'last_login',
        date: customer.lastLogin,
        description: 'Last login'
      });
    }
    
    // Add orders
    if (customer.orders) {
      customer.orders.forEach(order => {
        if (order.createdAt) {
          activityTimeline.push({
            type: 'order_placed',
            date: order.createdAt,
            description: `Order #${order.orderNumber || order._id?.slice(-6) || 'N/A'} placed`,
            amount: order.totalAmount || 0
          });
        }
      });
    }
    
    // Sort timeline by date
    activityTimeline.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    
    res.json({
      success: true,
      activity: {
        totalOrders: totalOrders || 0,
        totalSpent: totalSpent || 0,
        wishlistCount: wishlistCount || 0,
        cartCount: cartCount || 0,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
        lastOrderDate: lastOrderDate || null,
        favoriteCategories: favoriteCategories.slice(0, 5), // Top 5 categories
        activityTimeline: activityTimeline.slice(0, 10) // Last 10 activities
      }
    });
  } catch (error) {
    console.error('Error fetching customer activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer activity',
      error: error.message
    });
  }
});


module.exports = router;


// ===== CART ROUTES =====
router.get('/cart', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('cart.product');
    
    res.json({
      success: true,
      cart: user.cart || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/cart/add', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId, quantity = 1 } = req.body;
    
    const user = await User.findById(decoded.id);
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if product already in cart
    const existingItem = user.cart.find(item => 
      item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({
        product: productId,
        quantity,
        addedAt: new Date()
      });
    }

    await user.save();
    await user.populate('cart.product');

    res.json({
      success: true,
      message: 'Added to cart',
      cart: user.cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/cart/remove/:productId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId } = req.params;
    
    const user = await User.findById(decoded.id);
    user.cart = user.cart.filter(item => 
      item.product.toString() !== productId
    );

    await user.save();
    await user.populate('cart.product');

    res.json({
      success: true,
      message: 'Removed from cart',
      cart: user.cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/cart/update', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId, quantity } = req.body;
    
    const user = await User.findById(decoded.id);
    const item = user.cart.find(item => 
      item.product.toString() === productId
    );

    if (item) {
      if (quantity < 1) {
        user.cart = user.cart.filter(item => 
          item.product.toString() !== productId
        );
      } else {
        item.quantity = quantity;
      }
    }

    await user.save();
    await user.populate('cart.product');

    res.json({
      success: true,
      message: 'Cart updated',
      cart: user.cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/cart/clear', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    user.cart = [];
    await user.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      cart: []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== WISHLIST ROUTES =====
router.get('/wishlist', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('wishlist');
    
    res.json({
      success: true,
      wishlist: user.wishlist || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/wishlist/add', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId } = req.body;
    
    const user = await User.findById(decoded.id);
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if already in wishlist
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    await user.populate('wishlist');

    res.json({
      success: true,
      message: 'Added to wishlist',
      wishlist: user.wishlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/wishlist/remove/:productId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { productId } = req.params;
    
    const user = await User.findById(decoded.id);
    user.wishlist = user.wishlist.filter(id => 
      id.toString() !== productId
    );

    await user.save();
    await user.populate('wishlist');

    res.json({
      success: true,
      message: 'Removed from wishlist',
      wishlist: user.wishlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/wishlist/clear', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    user.wishlist = [];
    await user.save();

    res.json({
      success: true,
      message: 'Wishlist cleared',
      wishlist: []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ORDER ROUTES =====
router.get('/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const orders = await Order.find({ user: decoded.id })
      .sort({ createdAt: -1 })
      .populate('items.product');

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/orders/create', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { items, shippingAddress, totalAmount, paymentMethod } = req.body;
    
    const order = new Order({
      user: decoded.id,
      items,
      shippingAddress,
      totalAmount,
      paymentMethod
    });

    await order.save();

    // Clear user's cart after order
    const user = await User.findById(decoded.id);
    user.cart = [];
    await user.save();

    res.json({
      success: true,
      message: 'Order created successfully',
      order: await order.populate('items.product')
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add this import at the top of the file:
const Product = require('../models/Product');
const Order = require('../models/Order');

// ===== USER PROFILE ROUTES =====

const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// GET user profile - Add this route
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate user stats
    const cartCount = user.cart?.length || 0;
    const wishlistCount = user.wishlist?.length || 0;
    
    // Get orders for this user
    const orders = await Order.find({ user: req.user.id });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        createdAt: user.createdAt,
        role: user.role
      },
      stats: {
        totalOrders,
        totalSpent,
        wishlistCount,
        cartCount,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// UPDATE user profile - Add this route
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, city, country } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;

    await user.save();

    // Return updated user
    const updatedUser = await User.findById(req.user.id).select('-password -__v');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone || '',
        address: updatedUser.address || '',
        city: updatedUser.city || '',
        country: updatedUser.country || '',
        createdAt: updatedUser.createdAt,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});