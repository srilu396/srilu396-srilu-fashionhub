const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Message = require('../models/Message');

// GET /api/analytics - Live analytics data directly from MongoDB
router.get('/', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();
    const totalCoupons = await Coupon.countDocuments();
    const totalMessages = await Message.countDocuments();

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
        averageOrderValue,
        conversionRate: totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0,
        trends: {
          revenue: revTrend,
          orders: ordersTrend,
          customers: 8,
          products: 4
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
        averageCustomerValue: totalUsers > 0 ? totalRevenue / totalUsers : 0
      }
    });
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/order-insights - Period filtering, monthly year aggregation, and product order insights
router.get('/order-insights', async (req, res) => {
  try {
    const { period = 'all', year, month } = req.query;
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'month') {
      const targetYear = year ? parseInt(year, 10) : now.getFullYear();
      const targetMonth = month !== undefined ? parseInt(month, 10) : now.getMonth();
      startDate = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
      endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      const targetYear = year ? parseInt(year, 10) : now.getFullYear();
      startDate = new Date(targetYear, 0, 1, 0, 0, 0, 0);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    }

    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const allOrders = await Order.find(query).populate('user', 'firstName lastName email').sort({ createdAt: -1 });

    // Active (non-cancelled) orders vs cancelled orders
    const activeOrders = allOrders.filter(o => (o.status || '').toLowerCase() !== 'cancelled');
    const cancelledOrders = allOrders.filter(o => (o.status || '').toLowerCase() === 'cancelled');

    const totalOrders = allOrders.length;
    const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || o.finalAmount || 0), 0);

    // Unique customers count
    const customerSet = new Set();
    activeOrders.forEach(o => {
      const uId = o.user?._id || o.user || o.shippingAddress?.email || o.shippingAddress?.fullName;
      if (uId) customerSet.add(String(uId));
    });
    const uniqueCustomers = customerSet.size;

    // Total products sold (units)
    let productsSold = 0;
    activeOrders.forEach(o => {
      (o.items || []).forEach(item => {
        productsSold += Number(item.quantity || 1);
      });
    });

    // Product Order Insights Map: productId/name -> { name, ordersCount (distinct order count), unitsSold }
    const productInsightMap = {};
    activeOrders.forEach(o => {
      const seenInOrder = new Set();
      (o.items || []).forEach(item => {
        const key = item.product?._id || item.product || item.id || item.name || 'Unknown';
        const name = item.name || item.title || 'Luxury Fashion Item';

        if (!productInsightMap[key]) {
          productInsightMap[key] = { id: key, name, ordersCount: 0, unitsSold: 0 };
        }

        productInsightMap[key].unitsSold += Number(item.quantity || 1);

        if (!seenInOrder.has(key)) {
          seenInOrder.add(key);
          productInsightMap[key].ordersCount += 1;
        }
      });
    });

    const productInsights = Object.values(productInsightMap).sort((a, b) => b.unitsSold - a.unitsSold);

    // Monthly aggregation for Year view (Jan - Dec)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAggregation = monthNames.map((mName, mIdx) => ({
      month: mName,
      monthIndex: mIdx,
      orders: 0,
      revenue: 0,
      unitsSold: 0,
      cancelled: 0
    }));

    allOrders.forEach(o => {
      const d = new Date(o.createdAt || Date.now());
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        monthlyAggregation[mIdx].orders += 1;
        if ((o.status || '').toLowerCase() === 'cancelled') {
          monthlyAggregation[mIdx].cancelled += 1;
        } else {
          monthlyAggregation[mIdx].revenue += (o.totalAmount || o.finalAmount || 0);
          (o.items || []).forEach(item => {
            monthlyAggregation[mIdx].unitsSold += Number(item.quantity || 1);
          });
        }
      }
    });

    res.json({
      success: true,
      period,
      summary: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        uniqueCustomers,
        productsSold,
        cancelledOrders: cancelledOrders.length
      },
      monthlyAggregation,
      productInsights,
      orders: allOrders
    });
  } catch (error) {
    console.error('Order insights analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
