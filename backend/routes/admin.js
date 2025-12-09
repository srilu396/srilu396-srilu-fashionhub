const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const adminAuth = require('../middleware/adminAuth');
const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

// Admin: Add to customer's cart
router.post('/customers/:customerId/cart/add', adminAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { productId, quantity = 1 } = req.body;
    
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Check if product already in cart
    const existingItem = customer.cart.find(item => 
      item.product.toString() === productId
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      customer.cart.push({
        product: productId,
        quantity,
        addedAt: new Date()
      });
    }
    
    await customer.save();
    await customer.populate('cart.product', 'name price image');
    
    res.json({
      success: true,
      message: 'Added to customer cart',
      cart: customer.cart
    });
  } catch (error) {
    console.error('Admin add to cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Remove from customer's cart
router.delete('/customers/:customerId/cart/remove/:productId', adminAuth, async (req, res) => {
  try {
    const { customerId, productId } = req.params;
    
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    customer.cart = customer.cart.filter(item => 
      item.product.toString() !== productId
    );
    
    await customer.save();
    await customer.populate('cart.product', 'name price image');
    
    res.json({
      success: true,
      message: 'Removed from customer cart',
      cart: customer.cart
    });
  } catch (error) {
    console.error('Admin remove from cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update customer cart quantity
router.put('/customers/:customerId/cart/update', adminAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { productId, quantity } = req.body;
    
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const item = customer.cart.find(item => 
      item.product.toString() === productId
    );
    
    if (item) {
      if (quantity < 1) {
        customer.cart = customer.cart.filter(item => 
          item.product.toString() !== productId
        );
      } else {
        item.quantity = quantity;
      }
    }
    
    await customer.save();
    await customer.populate('cart.product', 'name price image');
    
    res.json({
      success: true,
      message: 'Customer cart updated',
      cart: customer.cart
    });
  } catch (error) {
    console.error('Admin update cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Clear customer's cart
router.delete('/customers/:customerId/cart/clear', adminAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    customer.cart = [];
    await customer.save();
    
    res.json({
      success: true,
      message: 'Customer cart cleared',
      cart: []
    });
  } catch (error) {
    console.error('Admin clear cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Add to customer's wishlist
router.post('/customers/:customerId/wishlist/add', adminAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { productId } = req.body;
    
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Check if already in wishlist
    if (!customer.wishlist.includes(productId)) {
      customer.wishlist.push(productId);
      await customer.save();
    }
    
    await customer.populate('wishlist', 'name price image');
    
    res.json({
      success: true,
      message: 'Added to customer wishlist',
      wishlist: customer.wishlist
    });
  } catch (error) {
    console.error('Admin add to wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Remove from customer's wishlist
router.delete('/customers/:customerId/wishlist/remove/:productId', adminAuth, async (req, res) => {
  try {
    const { customerId, productId } = req.params;
    
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    customer.wishlist = customer.wishlist.filter(id => 
      id.toString() !== productId
    );
    
    await customer.save();
    await customer.populate('wishlist', 'name price image');
    
    res.json({
      success: true,
      message: 'Removed from customer wishlist',
      wishlist: customer.wishlist
    });
  } catch (error) {
    console.error('Admin remove from wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Clear customer's wishlist
router.delete('/customers/:customerId/wishlist/clear', adminAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    customer.wishlist = [];
    await customer.save();
    
    res.json({
      success: true,
      message: 'Customer wishlist cleared',
      wishlist: []
    });
  } catch (error) {
    console.error('Admin clear wishlist error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==================== ADMIN SETTINGS ROUTES ====================

// Get all settings
router.get('/settings', adminAuth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({
        general: {
          siteName: 'SriluFashionHub',
          siteTagline: 'Where Luxury Meets Elegance',
          adminEmail: 'admin@srilufashionhub.com',
          currency: 'USD',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
        },
        store: {
          taxRate: 18,
          shippingFee: 5.99,
          freeShippingThreshold: 100,
          storeCurrency: 'USD',
          weightUnit: 'kg',
          dimensionsUnit: 'cm',
        },
        payments: {
          stripeEnabled: true,
          paypalEnabled: true,
          razorpayEnabled: true,
          cashOnDelivery: true,
          paymentGateway: 'stripe',
          stripeKey: '',
          paypalClientId: '',
        },
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: '587',
          smtpUser: '',
          smtpPass: '',
          emailSender: 'noreply@srilufashionhub.com',
          emailEncryption: 'tls',
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          ipRestriction: false,
          allowedIPs: [],
          loginAttempts: 5,
        },
        notifications: {
          notifyNewOrders: true,
          notifyLowStock: true,
          notifyNewUsers: true,
          notifyReviews: true,
        },
        maintenance: {
          maintenanceMode: false,
          maintenanceMessage: 'We are upgrading our system for better service. Please check back soon.',
          allowAdminAccess: true,
        },
        lastUpdated: new Date(),
        updatedBy: req.adminUser._id,
      });
    }
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update settings
router.put('/settings', adminAuth, async (req, res) => {
  try {
    const { 
      general, 
      store, 
      payments, 
      email, 
      security, 
      notifications, 
      maintenance 
    } = req.body;
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    // Update only provided sections
    if (general) settings.general = { ...settings.general, ...general };
    if (store) settings.store = { ...settings.store, ...store };
    if (payments) settings.payments = { ...settings.payments, ...payments };
    if (email) settings.email = { ...settings.email, ...email };
    if (security) settings.security = { ...settings.security, ...security };
    if (notifications) settings.notifications = { ...settings.notifications, ...notifications };
    if (maintenance) settings.maintenance = { ...settings.maintenance, ...maintenance };
    
    settings.lastUpdated = new Date();
    settings.updatedBy = req.adminUser._id;
    
    await settings.save();
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test email configuration
router.post('/settings/test-email', adminAuth, async (req, res) => {
  try {
    const { smtpConfig, testEmail } = req.body;
    
    if (!smtpConfig || !smtpConfig.host || !smtpConfig.port || !smtpConfig.user) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMTP configuration is incomplete' 
      });
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.encryption === 'ssl',
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass || ''
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Verify connection configuration
    await transporter.verify();
    
    // Send test email
    const mailOptions = {
      from: smtpConfig.sender || smtpConfig.user,
      to: testEmail || smtpConfig.user,
      subject: '✅ Test Email - SriluFashionHub Admin Settings',
      text: `This is a test email from SriluFashionHub Admin Panel.
      
If you're receiving this, your SMTP configuration is working correctly!
      
Configuration Details:
- SMTP Host: ${smtpConfig.host}
- SMTP Port: ${smtpConfig.port}
- Sender: ${smtpConfig.sender || smtpConfig.user}
- Encryption: ${smtpConfig.encryption || 'TLS'}
      
This email was sent on: ${new Date().toLocaleString()}
      
Best regards,
SriluFashionHub Admin Team`,
      
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .email-container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #D4AF37; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .title { color: #D4AF37; font-size: 20px; margin: 20px 0; }
    .success-icon { font-size: 40px; color: #4CAF50; margin: 20px 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .config-details { background: #fff; border-left: 4px solid #D4AF37; padding: 15px; margin: 15px 0; }
    .detail-item { margin: 10px 0; }
    .label { font-weight: bold; color: #4B1C2F; }
    .luxury-border { height: 4px; background: linear-gradient(90deg, #D4AF37, #4B1C2F, #014421, #001F3F); margin: 20px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="luxury-border"></div>
    <div class="header">
      <div class="logo">SriluFashionHub</div>
      <div class="title">Email Configuration Test</div>
    </div>
    <div style="text-align: center;">
      <div class="success-icon">✅</div>
      <h2 style="color: #4CAF50;">Configuration Successful!</h2>
    </div>
    <div class="content">
      <p>Hello Admin,</p>
      <p>This is a test email from your <strong>SriluFashionHub Admin Panel</strong>.</p>
      <div class="config-details">
        <h3 style="color: #D4AF37;">Configuration Details:</h3>
        <div class="detail-item"><span class="label">SMTP Host:</span> ${smtpConfig.host}</div>
        <div class="detail-item"><span class="label">SMTP Port:</span> ${smtpConfig.port}</div>
        <div class="detail-item"><span class="label">Encryption:</span> ${smtpConfig.encryption || 'TLS'}</div>
        <div class="detail-item"><span class="label">Sender:</span> ${smtpConfig.sender || smtpConfig.user}</div>
        <div class="detail-item"><span class="label">Sent To:</span> ${testEmail || smtpConfig.user}</div>
        <div class="detail-item"><span class="label">Sent At:</span> ${new Date().toLocaleString()}</div>
      </div>
    </div>
    <div class="luxury-border"></div>
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p>© ${new Date().getFullYear()} SriluFashionHub</p>
    </div>
  </div>
</body>
</html>`
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Save successful configuration
    if (smtpConfig.saveToSettings) {
      const settings = await Settings.findOne();
      if (settings) {
        settings.email = {
          ...settings.email,
          host: smtpConfig.host,
          port: smtpConfig.port,
          user: smtpConfig.user,
          pass: smtpConfig.pass,
          sender: smtpConfig.sender,
          encryption: smtpConfig.encryption
        };
        settings.lastUpdated = new Date();
        settings.updatedBy = req.adminUser._id;
        await settings.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Test email sent successfully!',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('Test email error:', error);
    
    let errorMessage = 'Failed to send test email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check username/password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Check SMTP host/port.';
    } else if (error.message.includes('Invalid login')) {
      errorMessage = 'Invalid login credentials.';
    } else {
      errorMessage = `SMTP Error: ${error.message}`;
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
});

// Export data
router.post('/settings/export-data', adminAuth, async (req, res) => {
  try {
    const { dataTypes = ['users', 'products'] } = req.body;
    
    const exportData = {
      exportedAt: new Date(),
      exportedBy: req.adminUser._id,
      data: {}
    };
    
    // Export users
    if (dataTypes.includes('users')) {
      const users = await User.find({}).select('-password -__v');
      exportData.data.users = users;
    }
    
    // Export products
    if (dataTypes.includes('products')) {
      const products = await Product.find({}).select('-__v');
      exportData.data.products = products;
    }
    
    // Export settings
    if (dataTypes.includes('settings')) {
      const settings = await Settings.findOne();
      exportData.data.settings = settings;
    }
    
    res.json({
      success: true,
      message: 'Data exported successfully',
      exportData
    });
    
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset statistics
router.post('/settings/reset-statistics', adminAuth, async (req, res) => {
  try {
    const { statistics = [] } = req.body;
    
    res.json({
      success: true,
      message: 'Statistics reset successfully',
      resetStatistics: statistics
    });
    
  } catch (error) {
    console.error('Reset statistics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear cache
router.post('/settings/clear-cache', adminAuth, async (req, res) => {
  try {
    const { cacheTypes = ['all'] } = req.body;
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      clearedCaches: cacheTypes
    });
    
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Factory reset
router.post('/settings/factory-reset', adminAuth, async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (!confirm) {
      return res.status(400).json({ 
        success: false, 
        message: 'Confirmation required' 
      });
    }
    
    // Delete settings
    await Settings.deleteMany({});
    
    // Create defaults
    const defaultSettings = await Settings.create({
      general: {
        siteName: 'SriluFashionHub',
        siteTagline: 'Where Luxury Meets Elegance',
        adminEmail: 'admin@srilufashionhub.com',
        currency: 'USD',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
      },
      store: {
        taxRate: 18,
        shippingFee: 5.99,
        freeShippingThreshold: 100,
        storeCurrency: 'USD',
        weightUnit: 'kg',
        dimensionsUnit: 'cm',
      },
      payments: {
        stripeEnabled: true,
        paypalEnabled: true,
        razorpayEnabled: true,
        cashOnDelivery: true,
        paymentGateway: 'stripe',
        stripeKey: '',
        paypalClientId: '',
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        smtpUser: '',
        smtpPass: '',
        emailSender: 'noreply@srilufashionhub.com',
        emailEncryption: 'tls',
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        ipRestriction: false,
        allowedIPs: [],
        loginAttempts: 5,
      },
      notifications: {
        notifyNewOrders: true,
        notifyLowStock: true,
        notifyNewUsers: true,
        notifyReviews: true,
      },
      maintenance: {
        maintenanceMode: false,
        maintenanceMessage: 'We are upgrading our system for better service. Please check back soon.',
        allowAdminAccess: true,
      },
      lastUpdated: new Date(),
      updatedBy: req.adminUser._id,
    });
    
    res.json({
      success: true,
      message: 'Factory reset completed',
      settings: defaultSettings
    });
    
  } catch (error) {
    console.error('Factory reset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;