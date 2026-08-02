const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Message = require('../models/Message');
const Order = require('../models/Order');
const User = require('../models/User');

const resetDb = async () => {
  const args = process.argv.slice(2);
  if (!args.includes('--confirm-delete')) {
    console.error('⚠️  SAFETY LOCK ACTIVATED!');
    console.error('To run database cleanup, you must pass the --confirm-delete argument:');
    console.error('node backend/scripts/resetDb.js --confirm-delete');
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srilufashionhub';
    console.log(`🔌 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('📦 Creating database backup prior to cleanup...');
    const products = await Product.find({});
    const coupons = await Coupon.find({});
    const messages = await Message.find({});
    const orders = await Order.find({});
    const users = await User.find({});

    const backup = {
      timestamp: new Date().toISOString(),
      products,
      coupons,
      messages,
      orders,
      users
    };

    const backupPath = path.join(__dirname, '../backup_data.json');
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup successfully saved to ${backupPath}`);

    console.log('🧹 Clearing Products, Coupons, Messages, and Orders...');
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await Message.deleteMany({});
    await Order.deleteMany({});

    console.log('🧹 Clearing non-main users...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@srilufashionhub.com';
    
    // Ensure main admin exists and is set to isMainAdmin: true
    let mainAdmin = await User.findOne({ email: adminEmail });
    if (!mainAdmin) {
      mainAdmin = await User.findOne({ role: 'admin' });
    }

    if (mainAdmin) {
      mainAdmin.isMainAdmin = true;
      mainAdmin.role = 'admin';
      mainAdmin.status = 'active';
      await mainAdmin.save();
      console.log(`👑 Main admin verified & preserved: ${mainAdmin.email}`);
      await User.deleteMany({ _id: { $ne: mainAdmin._id } });
    } else {
      console.log('👑 Creating main admin account...');
      const adminPassword = process.env.ADMIN_PASSWORD || 'SriluF@sh1on@2024!';
      mainAdmin = new User({
        username: 'admin',
        email: adminEmail,
        password: adminPassword,
        firstName: 'Srilu',
        lastName: 'Admin',
        role: 'admin',
        isMainAdmin: true,
        status: 'active',
        permissions: ['products', 'orders', 'customers', 'coupons', 'admins']
      });
      await mainAdmin.save();
      console.log(`👑 Created main admin account: ${adminEmail}`);
      await User.deleteMany({ _id: { $ne: mainAdmin._id } });
    }

    console.log('🎉 Database cleanup completed successfully! Fresh production environment ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database cleanup error:', error);
    process.exit(1);
  }
};

resetDb();
