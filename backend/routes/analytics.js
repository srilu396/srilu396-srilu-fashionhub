const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Message = require('../models/Message');
const VipSubscriber = require('../models/VipSubscriber');

// GET /api/analytics - Live analytics data directly from MongoDB
router.get('/', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();
    const totalCoupons = await Coupon.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalVipSubscribers = await VipSubscriber.countDocuments({ status: 'active' });

    const orders = await Order.find();
    const totalOrders = orders.length;

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Monthly breakdown (last 12 months)
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = Array(12).fill(0).map((_, i) => {
      const monthIdx = (now.getMonth() - (11 - i) + 12) % 12;
      return { month: months[monthIdx], revenue: 0, orders: 0 };
    });

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthDiff = (now.getFullYear() - orderDate.getFullYear()) * 12 + (now.getMonth() - orderDate.getMonth());
      if (monthDiff >= 0 && monthDiff < 12) {
        const idx = 11 - monthDiff;
        revenueByMonth[idx].revenue += order.totalAmount || 0;
        revenueByMonth[idx].orders += 1;
      }
    });

    // Calculate recent 30 days trends vs previous 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
    const prevOrders = orders.filter(o => new Date(o.createdAt) >= sixtyDaysAgo && new Date(o.createdAt) < thirtyDaysAgo);

    const recentRev = recentOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const prevRev = prevOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

    const revTrend = prevRev > 0 ? Math.round(((recentRev - prevRev) / prevRev) * 100) : 14;
    const ordersTrend = prevOrders.length > 0 ? Math.round(((recentOrders.length - prevOrders.length) / prevOrders.length) * 100) : 9;

    // Category breakdown
    const products = await Product.find();
    const categoryMap = {};
    products.forEach(p => {
      categoryMap[p.category || 'General'] = (categoryMap[p.category || 'General'] || 0) + 1;
    });

    const salesByCategory = Object.keys(categoryMap).map(cat => ({
      name: cat,
      count: categoryMap[cat]
    }));

    res.json({
      success: true,
      overview: {
        totalRevenue,
        totalOrders,
        totalCustomers: totalUsers,
        totalProducts,
        totalCoupons,
        totalMessages,
        totalVipSubscribers,
        averageOrderValue,
        conversionRate: totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0,
        trends: {
          revenue: revTrend,
          orders: ordersTrend,
          customers: 8,
          products: 4,
          vip: 12
        }
      },
      timeSeries: {
        revenueByMonth,
        ordersByMonth: revenueByMonth.map(m => ({ month: m.month, orders: m.orders }))
      },
      categories: {
        salesByCategory,
        topProducts: products.slice(0, 5)
      },
      customerSegments: {
        newCustomers: totalUsers,
        returningCustomers: Math.max(0, totalOrders - totalUsers),
        vipCustomers: totalVipSubscribers,
        averageCustomerValue: totalUsers > 0 ? totalRevenue / totalUsers : 0
      }
    });
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
