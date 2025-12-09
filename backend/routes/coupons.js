const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const auth = require('../middleware/auth'); // Add this if you have auth middleware

// Get all coupons (for admin)
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ created_at: -1 });
    res.json({
      success: true,
      coupons
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Create new coupon
router.post('/', async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    
    // Validate dates
    if (new Date(coupon.valid_from) >= new Date(coupon.valid_until)) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid until must be after valid from' 
      });
    }
    
    // Validate discount value
    if (coupon.discount_type === 'percentage' && coupon.discount_value > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Percentage discount cannot exceed 100%' 
      });
    }
    
    const savedCoupon = await coupon.save();
    res.status(201).json({
      success: true,
      coupon: savedCoupon
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false,
        message: 'Coupon code already exists' 
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
  }
});

// Update coupon
router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!coupon) {
      return res.status(404).json({ 
        success: false,
        message: 'Coupon not found' 
      });
    }
    
    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Delete coupon
router.delete('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ 
        success: false,
        message: 'Coupon not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Coupon deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ===== USER COUPONS API =====

// Get available coupons for users
router.get('/available', async (req, res) => {
  try {
    const now = new Date();
    
    const availableCoupons = await Coupon.find({
      active_status: true,
      valid_from: { $lte: now },
      valid_until: { $gte: now }
    })
    .select('-__v -created_at -updated_at')
    .sort({ created_at: -1 });

    // Filter out coupons that have reached usage limit
    const validCoupons = availableCoupons.filter(coupon => {
      if (coupon.usage_limit_total && coupon.used_count >= coupon.usage_limit_total) {
        return false;
      }
      return true;
    });

    res.json({
      success: true,
      coupons: validCoupons,
      count: validCoupons.length,
      message: `${validCoupons.length} coupons available`
    });

  } catch (error) {
    console.error('Error fetching available coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupons',
      error: error.message
    });
  }
});

// Validate coupon for user
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const now = new Date();
    
    const coupon = await Coupon.findOne({
      coupon_code: code.toUpperCase(),
      active_status: true,
      valid_from: { $lte: now },
      valid_until: { $gte: now }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found or expired'
      });
    }

    // Check usage limit
    if (coupon.usage_limit_total && coupon.used_count >= coupon.usage_limit_total) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    // Check per-user usage limit if exists
    if (coupon.usage_limit_per_user) {
      // You need to implement user-specific usage tracking
      // For now, we'll just check total usage
      if (coupon.used_count >= coupon.usage_limit_total) {
        return res.status(400).json({
          success: false,
          message: 'Coupon usage limit reached'
        });
      }
    }

    res.json({
      success: true,
      coupon: {
        _id: coupon._id,
        coupon_code: coupon.coupon_code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        valid_until: coupon.valid_until,
        min_order_value: coupon.min_order_value,
        description: coupon.description,
        excluded_categories: coupon.excluded_categories
      },
      message: 'Coupon is valid'
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating coupon',
      error: error.message
    });
  }
});

// Apply coupon (increment usage count)
router.post('/apply/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const now = new Date();
    
    const coupon = await Coupon.findOne({
      coupon_code: code.toUpperCase(),
      active_status: true,
      valid_from: { $lte: now },
      valid_until: { $gte: now }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found or expired'
      });
    }

    // Check usage limit
    if (coupon.usage_limit_total && coupon.used_count >= coupon.usage_limit_total) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    // Increment usage count
    coupon.used_count += 1;
    await coupon.save();

    res.json({
      success: true,
      coupon: {
        _id: coupon._id,
        coupon_code: coupon.coupon_code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      },
      message: 'Coupon applied successfully'
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying coupon',
      error: error.message
    });
  }
});

// Get coupon by ID (for admin)
router.get('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get coupon statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const now = new Date();
    
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({
      active_status: true,
      valid_from: { $lte: now },
      valid_until: { $gte: now }
    });
    const expiredCoupons = await Coupon.countDocuments({
      valid_until: { $lt: now }
    });
    const inactiveCoupons = await Coupon.countDocuments({
      active_status: false
    });

    const totalUsed = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalUsed: { $sum: "$used_count" }
        }
      }
    ]);

    const couponsByType = await Coupon.aggregate([
      {
        $group: {
          _id: "$discount_type",
          count: { $sum: 1 },
          totalUsed: { $sum: "$used_count" }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalCoupons,
        active: activeCoupons,
        expired: expiredCoupons,
        inactive: inactiveCoupons,
        totalUsed: totalUsed[0]?.totalUsed || 0,
        byType: couponsByType
      }
    });
  } catch (error) {
    console.error('Error fetching coupon stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupon statistics',
      error: error.message
    });
  }
});

module.exports = router;