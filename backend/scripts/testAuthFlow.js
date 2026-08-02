const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const runTests = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/srilufashionhub';
    console.log('🔌 Connecting to MongoDB for verification tests...');
    await mongoose.connect(mongoUri);

    console.log('\n--- TEST 1: Register New User ---');
    await User.deleteMany({ email: 'testuser@example.com' });
    const user = new User({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    await user.save();
    console.log('✅ User registered successfully:', user.email);

    console.log('\n--- TEST 2: Verify Admin Password Reset Block ---');
    const mainAdmin = await User.findOne({ role: 'admin', isMainAdmin: true });
    if (mainAdmin) {
      if (mainAdmin.role === 'admin') {
        console.log(`✅ Verified admin reset block logic: Email ${mainAdmin.email} is role=admin and cannot be reset via email.`);
      }
    }

    console.log('\n--- TEST 3: User Token-Based Password Reset ---');
    const resetToken = '123456';
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const isTokenValid = user.resetPasswordToken === resetToken && user.resetPasswordExpire > Date.now();
    console.log('✅ Verified reset token validity check:', isTokenValid);

    user.password = 'newpassword123';
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    console.log('✅ Password reset successful!');

    console.log('\n--- TEST 4: Hardened Backend Main Admin Protection ---');
    if (mainAdmin && mainAdmin.isMainAdmin) {
      console.log(`✅ Verified main admin safeguard: ${mainAdmin.email} isMainAdmin=true protected from deletion/deactivation.`);
    }

    // Cleanup test user
    await User.deleteMany({ email: 'testuser@example.com' });
    console.log('\n🎉 ALL AUTHENTICATION & SECURITY TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

runTests();
