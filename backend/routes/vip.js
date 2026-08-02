const express = require('express');
const router = express.Router();
const VipSubscriber = require('../models/VipSubscriber');
const Notification = require('../models/Notification');
const adminAuth = require('../middleware/adminAuth');

// POST /api/vip/subscribe - Public VIP Circle Subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address required' });
    }

    let subscriber = await VipSubscriber.findOne({ email: email.toLowerCase().trim() });
    if (subscriber) {
      if (subscriber.status === 'unsubscribed') {
        subscriber.status = 'active';
        subscriber.subscriptionDate = new Date();
        await subscriber.save();
      }
      return res.json({
        success: true,
        alreadySubscribed: true,
        message: 'Welcome back to Club Privé! You are already subscribed.'
      });
    }

    subscriber = new VipSubscriber({
      email: email.toLowerCase().trim(),
      subscriptionDate: new Date(),
      status: 'active'
    });

    await subscriber.save();

    // Create Admin Notification
    try {
      await Notification.create({
        title: 'New VIP Circle Subscriber',
        message: `${email} has joined the Private VIP Circle.`,
        type: 'vip',
        link: '/admin/vip-subscribers'
      });
    } catch (notifErr) {
      console.error('Error triggering VIP notification:', notifErr);
    }

    res.status(201).json({
      success: true,
      subscriber,
      message: 'Welcome to Club Privé! VIP subscription confirmed.'
    });
  } catch (error) {
    console.error('VIP Subscription Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/vip - List all VIP Subscribers (Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    const query = {};

    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const subscribers = await VipSubscriber.find(query).sort({ subscriptionDate: -1 });

    res.json({
      success: true,
      subscribers,
      count: subscribers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/vip/:id - Delete VIP subscriber (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const subscriber = await VipSubscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }
    res.json({ success: true, message: 'VIP Subscriber removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
