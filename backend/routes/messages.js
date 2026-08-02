const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET /api/messages - Fetch all customer messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages.'
    });
  }
});

// POST /api/messages - Save message to database
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    console.log('📨 Received message:', { name, email, subject, message });

    const newMessage = new Message({
      name,
      email,
      subject,
      message
    });

    const savedMessage = await newMessage.save();
    
    console.log('✅ Message saved to MongoDB:', savedMessage._id);

    // Create Admin Notification
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        title: 'New Bespoke Contact Inquiry',
        message: `From ${name} (${email}): "${subject || 'Inquiry'}"`,
        type: 'message',
        link: '/admin/messages'
      });
    } catch (notifErr) {
      console.error('Error triggering message notification:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: savedMessage
    });

  } catch (error) {
    console.error('❌ Error saving message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message.'
    });
  }
});

// PUT /api/messages/:id/read - Mark message read status
router.put('/:id/read', async (req, res) => {
  try {
    const { isRead = true } = req.body;
    const msg = await Message.findByIdAndUpdate(req.params.id, { isRead }, { new: true });
    res.json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/messages/:id - Delete a message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message.'
    });
  }
});

module.exports = router;