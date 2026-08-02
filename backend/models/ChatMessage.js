const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: String,
    enum: ['customer', 'admin'],
    required: true
  },
  senderName: {
    type: String,
    default: 'Concierge'
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
