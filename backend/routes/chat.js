const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Notification = require('../models/Notification');

// GET /api/chat/messages/:customerId - Get chat thread for customer
router.get('/messages/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const messages = await ChatMessage.find({ customerId })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/chat/send - Send chat message
router.post('/send', async (req, res) => {
  try {
    const { customerId, sender, senderName, message } = req.body;

    if (!customerId || !sender || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const chatMsg = new ChatMessage({
      customerId,
      sender, // 'customer' or 'admin'
      senderName: senderName || (sender === 'admin' ? 'Atelier Concierge' : 'Customer'),
      message: message.trim(),
      isRead: false
    });

    await chatMsg.save();

    // Trigger Admin Notification if customer sends message
    if (sender === 'customer') {
      try {
        const customer = await User.findById(customerId);
        const name = customer ? `${customer.firstName || customer.username}` : 'Customer';
        await Notification.create({
          title: 'New Live Chat Message',
          message: `${name}: "${message.slice(0, 40)}..."`,
          type: 'message',
          link: '/admin/customers'
        });
      } catch (err) {
        console.error('Chat notification error:', err);
      }
    }

    res.status(201).json({
      success: true,
      chatMsg,
      message: 'Message sent successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/chat/conversations - List active chat conversations for Admin
router.get('/conversations', async (req, res) => {
  try {
    // Aggregate distinct customer IDs with last message
    const conversations = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$customerId',
          lastMessage: { $first: '$message' },
          lastSender: { $first: '$sender' },
          lastTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$sender', 'customer'] }, { $eq: ['$isRead', false] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { lastTime: -1 } }
    ]);

    // Populate user info
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const user = await User.findById(conv._id).select('firstName lastName username email status');
        return {
          customerId: conv._id,
          user: user || { firstName: 'Guest', username: 'guest', email: 'N/A' },
          lastMessage: conv.lastMessage,
          lastSender: conv.lastSender,
          lastTime: conv.lastTime,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json({
      success: true,
      conversations: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/chat/read/:customerId - Mark thread as read
router.put('/read/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reader } = req.body; // 'admin' or 'customer'

    // If reader is admin, mark customer messages read; if reader is customer, mark admin messages read
    const targetSender = reader === 'admin' ? 'customer' : 'admin';

    await ChatMessage.updateMany(
      { customerId, sender: targetSender, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
