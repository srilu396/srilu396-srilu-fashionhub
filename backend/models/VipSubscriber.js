const mongoose = require('mongoose');

const vipSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  subscriptionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed'],
    default: 'active'
  },
  notes: {
    type: String,
    default: 'Subscribed via Landing Page Club Privé'
  }
}, { timestamps: true });

module.exports = mongoose.model('VipSubscriber', vipSubscriberSchema);
