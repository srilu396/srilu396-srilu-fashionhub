const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // recipientId: for internal admin→staff messages (target admin's _id)
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // isInternal: true = admin-to-admin message, false = customer-support message
  isInternal: {
    type: Boolean,
    default: false
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
  },
  clearedByUserAt: {
    type: Date,
    default: null
  },
  clearedByAdminAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
