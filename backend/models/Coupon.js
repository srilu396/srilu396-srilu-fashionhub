const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  coupon_code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discount_type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discount_value: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  applicable_categories: [{
    type: String
  }],
  applicable_products: [{
    type: String
  }],
  min_cart_value: {
    type: Number,
    default: 0,
    min: 0
  },
  valid_from: {
    type: Date,
    required: true
  },
  valid_until: {
    type: Date,
    required: true
  },
  usage_limit_total: {
    type: Number,
    default: null,
    min: 1
  },
  usage_limit_per_user: {
    type: Number,
    default: 1,
    min: 1
  },
  used_count: {
    type: Number,
    default: 0,
    min: 0
  },
  active_status: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at timestamp before saving
couponSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;