const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Save message to database
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

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!'
    });

  } catch (error) {
    console.error('❌ Error saving message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message.'
    });
  }
});

module.exports = router;