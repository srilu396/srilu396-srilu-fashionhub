import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllOrders } from '../../redux/slices/orderSlice';
import {
  BarChart3, LineChart, PieChart, TrendingUp, TrendingDown,
  DollarSign, ShoppingBag, Users, Package, Calendar,
  Download, Filter, RefreshCw, Eye, MoreVertical,
  ArrowUpRight, ArrowDownRight, Activity, Target,
  Clock, Award, Star, Crown, ShoppingCart, Heart,
  BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Users as UsersIcon, Store, Tag, Hash, Globe, TrendingUp as TrendingUpIcon,
  CreditCard, MapPin, Smartphone, Laptop, Watch, Shirt, Gem,
  Shield, Zap, Rocket, TrendingUp as TrendingUpIcon2, Sparkles
} from 'lucide-react';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Helper function to get month name
const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
};

// Helper function to get day name
const getDayName = (dayIndex) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
};

// Calculate analytics from orders
const calculateAnalytics = (orders) => {
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return {
      overview: {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        conversionRate: 0
      },
      timeSeries: {
        revenueByMonth: [],
        ordersByMonth: [],
        customersByMonth: []
      },
      categories: {
        salesByCategory: [],
        topProducts: []
      },
      customerSegments: {
        newCustomers: 0,
        returningCustomers: 0,
        vipCustomers: 0,
        averageCustomerValue: 0
      },
      performance: {
        bestMonth: null,
        bestDay: null,
        peakHour: null,
        growthRate: 0
      }
    };
  }

  // Get unique customers
  const customerSet = new Set();
  const customerData = {};
  
  orders.forEach(order => {
    const customerId = order.userId || order.user?._id;
    if (customerId) {
      customerSet.add(customerId);
      
      if (!customerData[customerId]) {
        customerData[customerId] = {
          orders: 0,
          totalSpent: 0,
          firstOrder: order.createdAt || order.orderDate,
          lastOrder: order.createdAt || order.orderDate
        };
      }
      
      customerData[customerId].orders++;
      customerData[customerId].totalSpent += order.totalAmount || order.total || 0;
      
      const orderDate = new Date(order.createdAt || order.orderDate);
      if (orderDate > new Date(customerData[customerId].lastOrder)) {
        customerData[customerId].lastOrder = order.createdAt || order.orderDate;
      }
      if (orderDate < new Date(customerData[customerId].firstOrder)) {
        customerData[customerId].firstOrder = order.createdAt || order.orderDate;
      }
    }
  });

  // Calculate overview metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
  const totalOrders = orders.length;
  const totalCustomers = customerSet.size;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Calculate conversion rate (simplified)
  const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

  // Calculate time series data (last 12 months)
  const now = new Date();
  const revenueByMonth = Array(12).fill(0);
  const ordersByMonth = Array(12).fill(0);
  const customersByMonth = Array(12).fill(0);
  const monthSet = new Set();

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt || order.orderDate);
    const monthDiff = (now.getFullYear() - orderDate.getFullYear()) * 12 + (now.getMonth() - orderDate.getMonth());
    
    if (monthDiff >= 0 && monthDiff < 12) {
      const monthIndex = 11 - monthDiff;
      revenueByMonth[monthIndex] += order.totalAmount || order.total || 0;
      ordersByMonth[monthIndex]++;
      
      const customerId = order.userId || order.user?._id;
      const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}-${customerId}`;
      if (!monthSet.has(monthKey)) {
        monthSet.add(monthKey);
        customersByMonth[monthIndex]++;
      }
    }
  });

  // Format time series data
  const timeSeries = {
    revenueByMonth: revenueByMonth.map((revenue, index) => ({
      month: getMonthName((now.getMonth() - (11 - index) + 12) % 12),
      revenue
    })),
    ordersByMonth: ordersByMonth.map((count, index) => ({
      month: getMonthName((now.getMonth() - (11 - index) + 12) % 12),
      orders: count
    })),
    customersByMonth: customersByMonth.map((count, index) => ({
      month: getMonthName((now.getMonth() - (11 - index) + 12) % 12),
      customers: count
    }))
  };

  // Calculate category data (extract from order items)
  const categorySales = {};
  const productSales = {};

  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const category = item.category || 'Uncategorized';
      categorySales[category] = (categorySales[category] || 0) + ((item.price || 0) * (item.quantity || 1));
      
      const productName = item.name || item.product?.name || 'Unknown Product';
      productSales[productName] = (productSales[productName] || 0) + 1;
    });
  });

  // Format category data
  const categories = {
    salesByCategory: Object.entries(categorySales)
      .map(([category, sales]) => ({
        category,
        sales,
        percentage: totalRevenue > 0 ? (sales / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8),
    topProducts: Object.entries(productSales)
      .map(([product, sales]) => ({
        product,
        sales,
        revenue: productSales[product] * 50 // Simplified revenue calculation
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
  };

  // Calculate customer segments
  const customerValues = Object.values(customerData);
  const newCustomers = customerValues.filter(c => {
    const daysSinceFirstOrder = Math.floor((new Date() - new Date(c.firstOrder)) / (1000 * 60 * 60 * 24));
    return daysSinceFirstOrder <= 30;
  }).length;
  
  const returningCustomers = customerValues.filter(c => c.orders > 1).length;
  const vipCustomers = customerValues.filter(c => c.totalSpent > 1000).length;
  const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Calculate performance metrics
  const ordersByDay = {};
  const ordersByHour = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt || order.orderDate);
    const day = getDayName(orderDate.getDay());
    const hour = orderDate.getHours();
    
    ordersByDay[day] = (ordersByDay[day] || 0) + 1;
    ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
  });

  // Find best day and peak hour
  const bestDay = Object.entries(ordersByDay).sort((a, b) => b[1] - a[1])[0];
  const peakHourEntry = Object.entries(ordersByHour).sort((a, b) => b[1] - a[1])[0];
  
  // Calculate growth rate (last month vs previous month)
  const currentMonthRevenue = revenueByMonth[11] || 0;
  const previousMonthRevenue = revenueByMonth[10] || 0;
  const growthRate = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0;

  // Find best month
  const bestMonthIndex = revenueByMonth.indexOf(Math.max(...revenueByMonth));
  const bestMonth = bestMonthIndex >= 0 ? getMonthName((now.getMonth() - (11 - bestMonthIndex) + 12) % 12) : null;

  return {
    overview: {
      totalRevenue,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      conversionRate
    },
    timeSeries,
    categories,
    customerSegments: {
      newCustomers,
      returningCustomers,
      vipCustomers,
      averageCustomerValue
    },
    performance: {
      bestMonth,
      bestDay: bestDay ? bestDay[0] : null,
      peakHour: peakHourEntry ? `${peakHourEntry[0]}:00` : null,
      growthRate
    }
  };
};

// AnalyticsCard Component
const AnalyticsCard = ({ title, value, change, icon, color, description, onClick }) => {
  const changeValue = change || 0;
  const isPositive = changeValue >= 0;
  
  return (
    <div 
      className={`analytics-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{
        '--card-color': color,
        '--card-bg': `${color}15`,
        '--card-border': `${color}30`
      }}
    >
      <div className="card-header">
        <div className="card-icon" style={{ background: `${color}20`, color: color }}>
          {icon}
        </div>
        <h3>{title}</h3>
        {description && <span className="card-help">i</span>}
      </div>
      <div className="card-content">
        <div className="card-value">{value}</div>
        {change !== undefined && (
          <div className={`card-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(change).toFixed(1)}%
            <span className="change-label">{isPositive ? ' increase' : ' decrease'}</span>
          </div>
        )}
      </div>
      {description && <div className="card-description">{description}</div>}
    </div>
  );
};

// Chart Component
const RevenueChart = ({ data }) => {
  const maxRevenue = Math.max(...data.map(item => item.revenue), 1);
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>
          <BarChart3 size={20} />
          Revenue Trend
        </h4>
        <span className="chart-subtitle">Last 12 Months</span>
      </div>
      <div className="chart-bars">
        {data.map((item, index) => (
          <div key={index} className="chart-bar">
            <div className="bar-label">{item.month}</div>
            <div className="bar-container">
              <div 
                className="bar-fill"
                style={{ 
                  height: `${(item.revenue / maxRevenue) * 100}%`,
                  background: `linear-gradient(to top, #D4AF37, #F7E7CE)`
                }}
              />
            </div>
            <div className="bar-value">
              ${(item.revenue / 1000).toFixed(1)}K
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Orders Chart Component
const OrdersChart = ({ data }) => {
  const maxOrders = Math.max(...data.map(item => item.orders), 1);
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>
          <LineChart size={20} />
          Orders Trend
        </h4>
        <span className="chart-subtitle">Last 12 Months</span>
      </div>
      <div className="chart-line">
        <div className="line-graph">
          {data.map((item, index) => (
            <div key={index} className="line-point-container">
              <div 
                className="line-point"
                style={{ 
                  bottom: `${(item.orders / maxOrders) * 100}%`,
                  background: `linear-gradient(135deg, #4B1C2F, #8B3A62)`
                }}
              />
              {index < data.length - 1 && (
                <div 
                  className="line-connector"
                  style={{
                    height: `${Math.abs((data[index + 1].orders - item.orders) / maxOrders) * 50}%`,
                    top: `${(item.orders / maxOrders) * 100}%`
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="line-labels">
          {data.map((item, index) => (
            <div key={index} className="line-label">
              {item.month}
              <div className="line-value">{item.orders}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Category Chart Component
const CategoryChart = ({ data }) => {
  const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>
          <PieChart size={20} />
          Sales by Category
        </h4>
        <span className="chart-subtitle">Top Categories</span>
      </div>
      <div className="category-chart">
        {data.map((item, index) => {
          const colors = ['#D4AF37', '#4B1C2F', '#014421', '#001F3F', '#9C27B0', '#FF5722', '#009688', '#3F51B5'];
          const color = colors[index % colors.length];
          const percentage = totalSales > 0 ? (item.sales / totalSales) * 100 : 0;
          
          return (
            <div key={index} className="category-item">
              <div className="category-info">
                <div className="category-color" style={{ background: color }} />
                <div className="category-name">{item.category}</div>
                <div className="category-percentage">{percentage.toFixed(1)}%</div>
              </div>
              <div className="category-bar">
                <div 
                  className="category-fill"
                  style={{ 
                    width: `${percentage}%`,
                    background: color
                  }}
                />
              </div>
              <div className="category-value">
                ${(item.sales / 1000).toFixed(1)}K
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Top Products Component
const TopProducts = ({ data }) => {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>
          <Award size={20} />
          Top Products
        </h4>
        <span className="chart-subtitle">Best Sellers</span>
      </div>
      <div className="top-products">
        {data.map((item, index) => (
          <div key={index} className="product-item">
            <div className="product-rank">
              {index === 0 && <Crown size={16} color="#D4AF37" />}
              {index === 1 && <Star size={16} color="#FFD700" />}
              {index === 2 && <Star size={16} color="#C0C0C0" />}
              {index >= 3 && <span className="rank-number">{index + 1}</span>}
            </div>
            <div className="product-info">
              <div className="product-name">{item.product}</div>
              <div className="product-stats">
                <span className="sales">{item.sales} sales</span>
                <span className="revenue">${item.revenue.toFixed(2)}</span>
              </div>
            </div>
            <div className="product-trend">
              <TrendingUp size={16} color="#4CAF50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Insights Component
const Insights = ({ analytics }) => {
  const insights = [
    {
      icon: <Rocket size={24} />,
      title: "Revenue Growth",
      content: `Revenue is ${analytics.performance.growthRate >= 0 ? 'growing' : 'declining'} by ${Math.abs(analytics.performance.growthRate).toFixed(1)}% this month`,
      type: analytics.performance.growthRate >= 0 ? 'positive' : 'negative',
      color: analytics.performance.growthRate >= 0 ? '#4CAF50' : '#EF5350'
    },
    {
      icon: <Users size={24} />,
      title: "Customer Retention",
      content: `${analytics.customerSegments.returningCustomers} returning customers (${((analytics.customerSegments.returningCustomers / analytics.overview.totalCustomers) * 100).toFixed(1)}% retention rate)`,
      type: 'positive',
      color: '#2196F3'
    },
    {
      icon: <Target size={24} />,
      title: "Best Performing Day",
      content: analytics.performance.bestDay ? `Most orders are placed on ${analytics.performance.bestDay}s` : 'No day data available',
      type: 'neutral',
      color: '#D4AF37'
    },
    {
      icon: <Zap size={24} />,
      title: "Peak Shopping Time",
      content: analytics.performance.peakHour ? `Peak shopping hour is ${analytics.performance.peakHour}` : 'No hour data available',
      type: 'neutral',
      color: '#FF9800'
    },
    {
      icon: <Crown size={24} />,
      title: "VIP Customers",
      content: `${analytics.customerSegments.vipCustomers} VIP customers spending over $1,000 each`,
      type: 'positive',
      color: '#9C27B0'
    },
    {
      icon: <TrendingUpIcon2 size={24} />,
      title: "Conversion Rate",
      content: `Average ${analytics.overview.conversionRate.toFixed(1)} orders per customer`,
      type: analytics.overview.conversionRate > 1 ? 'positive' : 'neutral',
      color: '#009688'
    }
  ];

  return (
    <div className="insights-container">
      <div className="insights-header">
        <h3>
          <Sparkles size={24} />
          Key Insights
        </h3>
        <span className="insights-subtitle">Actionable business intelligence</span>
      </div>
      <div className="insights-grid">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`insight-card ${insight.type}`}
            style={{ borderLeftColor: insight.color }}
          >
            <div className="insight-icon" style={{ color: insight.color }}>
              {insight.icon}
            </div>
            <div className="insight-content">
              <h4>{insight.title}</h4>
              <p>{insight.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Analytics Component
const Analytics = () => {
  const dispatch = useDispatch();
  const { allOrders: orders, loading, error, stats } = useSelector((state) => state.orders);
  
  const [timeRange, setTimeRange] = useState('year');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('overview');

  // Calculate analytics from orders
  const analytics = useMemo(() => calculateAnalytics(orders), [orders]);

  // Fetch orders on component mount
  useEffect(() => {
    console.log('📊 Analytics mounted, fetching orders...');
    dispatch(fetchAllOrders());
  }, [dispatch]);

  // Set up auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing analytics...');
      dispatch(fetchAllOrders());
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchAllOrders()).unwrap();
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  // Export analytics data
  const exportAnalytics = useCallback(() => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      analytics,
      orders: orders.length,
      stats
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [analytics, orders, stats]);

  // Get change percentage for cards
  const getRevenueChange = () => {
    if (analytics.timeSeries.revenueByMonth.length < 2) return 0;
    const current = analytics.timeSeries.revenueByMonth[11]?.revenue || 0;
    const previous = analytics.timeSeries.revenueByMonth[10]?.revenue || 0;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };

  const getOrdersChange = () => {
    if (analytics.timeSeries.ordersByMonth.length < 2) return 0;
    const current = analytics.timeSeries.ordersByMonth[11]?.orders || 0;
    const previous = analytics.timeSeries.ordersByMonth[10]?.orders || 0;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };

  const getCustomersChange = () => {
    if (analytics.timeSeries.customersByMonth.length < 2) return 0;
    const current = analytics.timeSeries.customersByMonth[11]?.customers || 0;
    const previous = analytics.timeSeries.customersByMonth[10]?.customers || 0;
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading Analytics Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* CSS Styles */}
      <style jsx>{`
        .analytics-page {
          min-height: 100vh;
          background: linear-gradient(135deg, 
            rgba(10, 10, 10, 0.95) 0%,
            rgba(28, 28, 28, 0.95) 50%,
            rgba(10, 10, 10, 0.95) 100%
          );
          padding: 2rem;
          position: relative;
          overflow-x: hidden;
          font-family: 'Playfair Display', 'Cormorant Garamond', serif;
          color: #F5F5F5;
        }

        /* Luxury Background */
        .luxury-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(75, 28, 47, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(1, 68, 33, 0.05) 0%, transparent 50%);
          z-index: 0;
        }

        /* Page Header */
        .page-header {
          position: relative;
          z-index: 2;
          margin-bottom: 3rem;
        }

        .page-title {
          color: #D4AF37;
          font-size: 3.2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-family: 'Cormorant Garamond', serif;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          background: linear-gradient(45deg, #D4AF37, #F7E7CE, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          color: rgba(245, 245, 245, 0.8);
          font-size: 1.2rem;
          margin: 0;
          font-style: italic;
        }

        /* Controls Section */
        .controls-section {
          background: rgba(28, 28, 28, 0.7);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .time-range-selector {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .time-range-btn {
          padding: 0.8rem 1.5rem;
          background: transparent;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          color: rgba(245, 245, 245, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          white-space: nowrap;
        }

        .time-range-btn.active {
          background: rgba(212, 175, 55, 0.15);
          border-color: #D4AF37;
          color: #D4AF37;
        }

        .time-range-btn:hover:not(.active) {
          background: rgba(212, 175, 55, 0.05);
          border-color: rgba(212, 175, 55, 0.3);
          color: #F5F5F5;
        }

        .view-selector {
          display: flex;
          gap: 0.5rem;
        }

        .view-btn {
          padding: 0.8rem 1.5rem;
          background: rgba(212, 175, 55, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          color: rgba(245, 245, 245, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .view-btn.active {
          background: rgba(1, 68, 33, 0.2);
          border-color: rgba(1, 68, 33, 0.3);
          color: #4CAF50;
        }

        .view-btn:hover:not(.active) {
          background: rgba(212, 175, 55, 0.1);
          border-color: rgba(212, 175, 55, 0.3);
        }

        .controls-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .control-button {
          padding: 0.8rem 1.5rem;
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.15) 0%,
            rgba(212, 175, 55, 0.05) 100%
          );
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          color: #D4AF37;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Playfair Display', serif;
          white-space: nowrap;
        }

        .control-button:hover:not(:disabled) {
          background: linear-gradient(135deg, 
            rgba(212, 175, 55, 0.25) 0%,
            rgba(212, 175, 55, 0.15) 100%
          );
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2);
        }

        .control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .control-button.secondary {
          background: rgba(1, 68, 33, 0.1);
          border: 1px solid rgba(1, 68, 33, 0.3);
          color: #4CAF50;
        }

        .control-button.secondary:hover:not(:disabled) {
          background: rgba(1, 68, 33, 0.2);
        }

        /* Loading Spinner */
        .loading-spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-top: 2px solid #D4AF37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Analytics Cards Grid */
        .analytics-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
          position: relative;
          z-index: 2;
        }

        .analytics-card {
          background: rgba(28, 28, 28, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border, rgba(212, 175, 55, 0.15));
          border-radius: 20px;
          padding: 1.8rem;
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
        }

        .analytics-card.clickable {
          cursor: pointer;
        }

        .analytics-card.clickable:hover {
          transform: translateY(-5px);
          border-color: var(--card-color, rgba(212, 175, 55, 0.3));
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }

        .analytics-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, var(--card-color, rgba(212, 175, 55, 0.1)), transparent);
          transition: left 0.6s ease;
        }

        .analytics-card.clickable:hover::before {
          left: 100%;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .card-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: var(--card-bg, rgba(212, 175, 55, 0.1));
          border: 1px solid var(--card-border, rgba(212, 175, 55, 0.2));
          color: var(--card-color, #D4AF37);
        }

        .card-header h3 {
          flex: 1;
          margin: 0;
          color: rgba(245, 245, 245, 0.9);
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .card-help {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: bold;
          cursor: help;
        }

        .card-content {
          margin-bottom: 1rem;
        }

        .card-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #F5F5F5;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .card-change {
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .card-change.positive {
          color: #4CAF50;
        }

        .card-change.negative {
          color: #EF5350;
        }

        .change-label {
          color: rgba(245, 245, 245, 0.6);
          font-weight: normal;
          margin-left: 0.3rem;
        }

        .card-description {
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.6);
          line-height: 1.4;
          padding-top: 1rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        /* Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 1.5rem;
          position: relative;
          z-index: 2;
          margin-bottom: 2rem;
        }

        @media (max-width: 1200px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Chart Container */
        .chart-container {
          background: rgba(28, 28, 28, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 20px;
          padding: 1.8rem;
          position: relative;
          overflow: hidden;
        }

        .chart-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #D4AF37, #4B1C2F, #014421);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .chart-header h4 {
          color: #F5F5F5;
          font-size: 1.3rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .chart-subtitle {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
          font-style: italic;
        }

        /* Revenue Chart */
        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
          height: 250px;
          padding: 1rem 0;
        }

        .chart-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          height: 100%;
        }

        .bar-label {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.85rem;
          text-align: center;
        }

        .bar-container {
          width: 40px;
          height: 100%;
          background: rgba(212, 175, 55, 0.1);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }

        .bar-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 8px;
          transition: height 0.3s ease;
        }

        .bar-value {
          color: #D4AF37;
          font-weight: 600;
          font-size: 0.9rem;
          text-align: center;
          margin-top: 0.5rem;
        }

        /* Orders Chart */
        .chart-line {
          height: 250px;
          position: relative;
          padding: 1rem 0;
        }

        .line-graph {
          position: relative;
          height: calc(100% - 40px);
          width: 100%;
        }

        .line-point-container {
          position: absolute;
          bottom: 0;
          width: calc(100% / 12);
          height: 100%;
        }

        .line-point {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          z-index: 2;
        }

        .line-connector {
          position: absolute;
          left: 50%;
          width: 2px;
          background: linear-gradient(to top, rgba(75, 28, 47, 0.8), rgba(75, 28, 47, 0.2));
          z-index: 1;
        }

        .line-labels {
          display: flex;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        .line-label {
          text-align: center;
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.85rem;
          flex: 1;
        }

        .line-value {
          color: #D4AF37;
          font-weight: 600;
          margin-top: 0.3rem;
        }

        /* Category Chart */
        .category-chart {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .category-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          flex: 1;
        }

        .category-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .category-name {
          flex: 1;
          color: #F5F5F5;
          font-weight: 500;
        }

        .category-percentage {
          color: rgba(245, 245, 245, 0.7);
          font-size: 0.9rem;
          min-width: 50px;
          text-align: right;
        }

        .category-bar {
          flex: 2;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .category-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 1s ease;
        }

        .category-value {
          color: #D4AF37;
          font-weight: 600;
          font-size: 0.9rem;
          min-width: 60px;
          text-align: right;
        }

        /* Top Products */
        .top-products {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .product-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          transition: all 0.3s ease;
        }

        .product-item:hover {
          background: rgba(212, 175, 55, 0.05);
          transform: translateX(5px);
        }

        .product-rank {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.1);
          border: 2px solid #D4AF37;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AF37;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .rank-number {
          font-size: 0.8rem;
        }

        .product-info {
          flex: 1;
        }

        .product-name {
          font-weight: 600;
          color: #F5F5F5;
          margin-bottom: 0.3rem;
        }

        .product-stats {
          display: flex;
          gap: 1.5rem;
          font-size: 0.85rem;
          color: rgba(245, 245, 245, 0.7);
        }

        .product-stats .sales {
          color: #42A5F5;
        }

        .product-stats .revenue {
          color: #4CAF50;
          font-weight: 600;
        }

        .product-trend {
          padding: 0.5rem;
          background: rgba(76, 175, 80, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(76, 175, 80, 0.2);
        }

        /* Insights */
        .insights-container {
          background: rgba(28, 28, 28, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212, 175, 55, 0.15);
          border-radius: 20px;
          padding: 1.8rem;
          position: relative;
          z-index: 2;
          margin-bottom: 2rem;
        }

        .insights-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .insights-header h3 {
          color: #F5F5F5;
          font-size: 1.5rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .insights-subtitle {
          color: rgba(245, 245, 245, 0.6);
          font-size: 0.9rem;
          font-style: italic;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .insight-card {
          background: rgba(28, 28, 28, 0.4);
          border-radius: 15px;
          padding: 1.5rem;
          border-left: 4px solid;
          transition: all 0.3s ease;
        }

        .insight-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }

        .insight-card.positive {
          border-left-color: #4CAF50;
        }

        .insight-card.negative {
          border-left-color: #EF5350;
        }

        .insight-card.neutral {
          border-left-color: #D4AF37;
        }

        .insight-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          background: rgba(255, 255, 255, 0.05);
        }

        .insight-content h4 {
          color: #F5F5F5;
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .insight-content p {
          color: rgba(245, 245, 245, 0.8);
          margin: 0;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 500px;
          flex-direction: column;
          gap: 2rem;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(212, 175, 55, 0.2);
          border-top: 4px solid #D4AF37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: #D4AF37;
          font-size: 1.2rem;
          letter-spacing: 2px;
        }

        /* Error State */
        .error-container {
          padding: 4rem 2rem;
          text-align: center;
        }

        .error-icon {
          font-size: 4rem;
          opacity: 0.3;
          margin-bottom: 1.5rem;
        }

        .error-container h3 {
          color: #F5F5F5;
          margin-bottom: 0.5rem;
        }

        .error-container p {
          color: rgba(245, 245, 245, 0.6);
          margin: 0 0 1.5rem 0;
        }

        /* No Data State */
        .no-data-container {
          padding: 4rem 2rem;
          text-align: center;
        }

        .no-data-icon {
          font-size: 4rem;
          opacity: 0.3;
          margin-bottom: 1.5rem;
        }

        .no-data-container h3 {
          color: #F5F5F5;
          margin-bottom: 0.5rem;
        }

        .no-data-container p {
          color: rgba(245, 245, 245, 0.6);
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .analytics-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .insights-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .analytics-page {
            padding: 1rem;
          }

          .page-title {
            font-size: 2.5rem;
          }

          .controls-section {
            flex-direction: column;
            align-items: stretch;
          }

          .time-range-selector {
            justify-content: center;
          }

          .view-selector {
            justify-content: center;
          }

          .controls-actions {
            justify-content: center;
          }

          .analytics-cards-grid {
            grid-template-columns: 1fr;
          }

          .chart-container {
            padding: 1rem;
          }

          .chart-bars {
            gap: 0.5rem;
          }

          .bar-container {
            width: 30px;
          }

          .category-item {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }

          .category-info {
            justify-content: space-between;
          }

          .category-bar {
            flex: none;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 2rem;
          }

          .card-value {
            font-size: 2rem;
          }

          .time-range-btn, .view-btn, .control-button {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>

      {/* Luxury Background */}
      <div className="luxury-background"></div>

      <div className="page-header">
        <h1 className="page-title">📈 Analytics Dashboard</h1>
        <p className="page-subtitle">
          Real-time insights from {analytics.overview.totalCustomers} customers and {analytics.overview.totalOrders} orders
        </p>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="time-range-selector">
          {['day', 'week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        <div className="view-selector">
          <button 
            className={`view-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            <BarChart2 size={18} />
            Overview
          </button>
          <button 
            className={`view-btn ${viewMode === 'customers' ? 'active' : ''}`}
            onClick={() => setViewMode('customers')}
          >
            <UsersIcon size={18} />
            Customers
          </button>
          <button 
            className={`view-btn ${viewMode === 'products' ? 'active' : ''}`}
            onClick={() => setViewMode('products')}
          >
            <Package size={18} />
            Products
          </button>
        </div>

        <div className="controls-actions">
          <button 
            className="control-button secondary"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
          >
            {loading || isRefreshing ? (
              <>
                <div className="loading-spinner-small"></div>
                Loading...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Refresh Data
              </>
            )}
          </button>
          <button 
            className="control-button"
            onClick={exportAnalytics}
            disabled={orders.length === 0}
          >
            <Download size={18} />
            Export Analytics
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Analytics</h3>
          <p>{error}</p>
          <div className="controls-actions" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
            <button 
              className="control-button" 
              onClick={handleRefresh}
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!error && orders.length === 0 && !loading && (
        <div className="no-data-container">
          <div className="no-data-icon">📊</div>
          <h3>No Analytics Data Available</h3>
          <p>When customers place orders, analytics will appear here automatically.</p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#D4AF37' }}>
            Connect to real-time data from {analytics.overview.totalCustomers} customers
          </p>
        </div>
      )}

      {/* Analytics Content */}
      {!error && orders.length > 0 && (
        <>
          {/* Overview Cards */}
          <div className="analytics-cards-grid">
            <AnalyticsCard
              title="Total Revenue"
              value={formatCurrency(analytics.overview.totalRevenue)}
              change={getRevenueChange()}
              icon={<DollarSign size={24} />}
              color="#D4AF37"
              description="Total revenue generated from all orders"
              onClick={() => setViewMode('overview')}
            />

            <AnalyticsCard
              title="Total Orders"
              value={analytics.overview.totalOrders}
              change={getOrdersChange()}
              icon={<ShoppingBag size={24} />}
              color="#4B1C2F"
              description="Total number of orders placed"
              onClick={() => setViewMode('overview')}
            />

            <AnalyticsCard
              title="Total Customers"
              value={analytics.overview.totalCustomers}
              change={getCustomersChange()}
              icon={<Users size={24} />}
              color="#014421"
              description="Unique customers who placed orders"
              onClick={() => setViewMode('customers')}
            />

            <AnalyticsCard
              title="Avg. Order Value"
              value={formatCurrency(analytics.overview.averageOrderValue)}
              change={analytics.performance.growthRate}
              icon={<CreditCard size={24} />}
              color="#001F3F"
              description="Average value per order"
              onClick={() => setViewMode('overview')}
            />
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <RevenueChart data={analytics.timeSeries.revenueByMonth} />
            <OrdersChart data={analytics.timeSeries.ordersByMonth} />
            <CategoryChart data={analytics.categories.salesByCategory} />
            <TopProducts data={analytics.categories.topProducts} />
          </div>

          {/* Insights */}
          <Insights analytics={analytics} />

          {/* Customer Segments Cards */}
          <div className="analytics-cards-grid">
            <AnalyticsCard
              title="New Customers"
              value={analytics.customerSegments.newCustomers}
              icon={<Sparkles size={24} />}
              color="#2196F3"
              description="Customers who placed first order in last 30 days"
              onClick={() => setViewMode('customers')}
            />

            <AnalyticsCard
              title="Returning Customers"
              value={analytics.customerSegments.returningCustomers}
              icon={<UsersIcon size={24} />}
              color="#4CAF50"
              description="Customers with more than 1 order"
              onClick={() => setViewMode('customers')}
            />

            <AnalyticsCard
              title="VIP Customers"
              value={analytics.customerSegments.vipCustomers}
              icon={<Crown size={24} />}
              color="#9C27B0"
              description="Customers spending over $1,000"
              onClick={() => setViewMode('customers')}
            />

            <AnalyticsCard
              title="Avg. Customer Value"
              value={formatCurrency(analytics.customerSegments.averageCustomerValue)}
              icon={<Target size={24} />}
              color="#FF9800"
              description="Average lifetime value per customer"
              onClick={() => setViewMode('customers')}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;