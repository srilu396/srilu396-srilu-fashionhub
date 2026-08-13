const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ============================================================
// CUSTOMER ↔ SUPPORT CHAT (isInternal: false / not set)
// ============================================================

// GET /api/chat/messages/:customerId
router.get('/messages/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { viewer } = req.query;

    const query = { customerId, isInternal: { $ne: true } };
    if (viewer === 'customer') {
      query.clearedByUserAt = null;
    } else if (viewer === 'admin') {
      query.clearedByAdminAt = null;
    } else {
      query.clearedByUserAt = null;
    }

    const messages = await ChatMessage.find(query).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/chat/send
router.post('/send', async (req, res) => {
  try {
    const { customerId, sender, senderName, message } = req.body;
    if (!customerId || !sender || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const chatMsg = new ChatMessage({
      customerId,
      sender,
      senderName: senderName || (sender === 'admin' ? 'Atelier Concierge' : 'Customer'),
      message: message.trim(),
      isRead: false,
      isInternal: false,
      clearedByUserAt: null,
      clearedByAdminAt: null
    });
    await chatMsg.save();

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

    res.status(201).json({ success: true, chatMessage: chatMsg, chatMsg, message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/chat/clear/:customerId
router.put('/clear/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { requester } = req.body;
    if (!requester || !['customer', 'admin'].includes(requester)) {
      return res.status(400).json({ success: false, message: 'Valid requester required' });
    }
    const now = new Date();
    const updateField = requester === 'customer' ? { clearedByUserAt: now } : { clearedByAdminAt: now };
    await ChatMessage.updateMany({ customerId, isInternal: { $ne: true } }, { $set: updateField });
    res.json({ success: true, message: `Chat thread cleared for ${requester}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/chat/conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await ChatMessage.aggregate([
      { $match: { clearedByAdminAt: null, isInternal: { $ne: true } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$customerId',
          lastMessage: { $first: '$message' },
          lastSender: { $first: '$sender' },
          lastTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$sender', 'customer'] }, { $eq: ['$isRead', false] }] }, 1, 0] }
          }
        }
      },
      { $sort: { lastTime: -1 } }
    ]);

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
    res.json({ success: true, conversations: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/chat/unread/user/:customerId
router.get('/unread/user/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const unreadCount = await ChatMessage.countDocuments({
      customerId,
      sender: 'admin',
      isRead: false,
      clearedByUserAt: null,
      isInternal: { $ne: true }
    });
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/chat/unread/admin
router.get('/unread/admin', async (req, res) => {
  try {
    const unreadCount = await ChatMessage.countDocuments({
      sender: 'customer',
      isRead: false,
      clearedByAdminAt: null,
      isInternal: { $ne: true }
    });
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/chat/read/:customerId
router.put('/read/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { reader } = req.body;
    const targetSender = reader === 'admin' ? 'customer' : 'admin';
    await ChatMessage.updateMany(
      { customerId, sender: targetSender, isRead: false, isInternal: { $ne: true } },
      { isRead: true }
    );
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// INTERNAL ADMIN ↔ STAFF CHAT (isInternal: true)
// ============================================================

// GET /api/chat/internal/unread/:recipientId  — MUST be before /:senderId/:recipientId
router.get('/internal/unread/:recipientId', async (req, res) => {
  try {
    const { recipientId } = req.params;
    const unreadCount = await ChatMessage.countDocuments({
      recipientId,
      isInternal: true,
      isRead: false
    });
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/chat/internal/send
router.post('/internal/send', async (req, res) => {
  try {
    const { senderId, recipientId, senderName, message } = req.body;
    if (!senderId || !recipientId || !message) {
      return res.status(400).json({ success: false, message: 'senderId, recipientId, and message are required' });
    }

    const senderUser = await User.findById(senderId);
    if (!senderUser) {
      return res.status(403).json({ success: false, message: 'Unauthorized: sender not found' });
    }

    const chatMsg = new ChatMessage({
      customerId: senderId,
      recipientId,
      sender: 'admin',
      senderName: senderName || 'Administrator',
      message: message.trim(),
      isRead: false,
      isInternal: true
    });
    await chatMsg.save();

    try {
      await Notification.create({
        title: `Message from ${senderName || 'Administrator'}`,
        message: `${message.slice(0, 60)}${message.length > 60 ? '...' : ''}`,
        type: 'message',
        link: `/admin/admins?chatWith=${senderId}`
      });
    } catch (notifErr) {
      console.error('Internal chat notification error:', notifErr);
    }

    res.status(201).json({ success: true, chatMessage: chatMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/chat/internal/read/:senderId/:recipientId
router.put('/internal/read/:senderId/:recipientId', async (req, res) => {
  try {
    const { senderId, recipientId } = req.params;
    await ChatMessage.updateMany(
      { customerId: senderId, recipientId, isInternal: true, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'Internal messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/chat/internal/:senderId/:recipientId
router.get('/internal/:senderId/:recipientId', async (req, res) => {
  try {
    const { senderId, recipientId } = req.params;
    const messages = await ChatMessage.find({
      isInternal: true,
      $or: [
        { customerId: senderId, recipientId },
        { customerId: recipientId, recipientId: senderId }
      ]
    }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
