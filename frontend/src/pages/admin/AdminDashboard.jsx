import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
 const { user, logoutAdmin } = useAuth();
  const navigate = useNavigate();

  // Slideshow state with online fashion images
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1505751171710-1f6d0ace5a85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
  ];

  // Auto slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 125847.89,
    totalOrders: 2847,
    totalProducts: 567,
    totalCustomers: 12458,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoading(false);
    };
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    logoutAdmin();  
    navigate('/admin/login');
  };

  // All feature buttons - stable without animations
  const featureButtons = [
    { 
      id: 'overview', 
      label: 'Dashboard Overview', 
      icon: '📊', 
      description: 'View overall statistics and metrics',
      color: 'gold',
      path: '/admin/dashboard'
    },
    { 
      id: 'new-product', 
      label: 'New Product', 
      icon: '✨', 
      description: 'Add new fashion item to catalog',
      color: 'emerald',
      path: '/admin/new-product'
    },
    { 
      id: 'new-coupon', 
      label: 'New Coupon', 
      icon: '🎫', 
      description: 'Create discount offers and promotions',
      color: 'burgundy',
      path: '/admin/new-coupon'
    },
    { 
      id: 'products', 
      label: 'Products Management', 
      icon: '👗', 
      description: 'Manage all products in inventory',
      color: 'navy',
      path: '/admin/products'
    },
    { 
      id: 'coupons', 
      label: 'Coupons Management', 
      icon: '💰', 
      description: 'View and manage all discount coupons',
      color: 'purple',
      path: '/admin/coupons'
    },
    { 
      id: 'orders', 
      label: 'Orders Management', 
      icon: '📦', 
      description: 'Process and track customer orders',
      color: 'gold',
      path: '/admin/orders'
    },
    { 
      id: 'customers', 
      label: 'Customers', 
      icon: '👥', 
      description: 'View and manage customer database',
      color: 'emerald',
      path: '/admin/customers'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: '📈', 
      description: 'Sales and performance analytics',
      color: 'burgundy',
      path: '/admin/analytics'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: '⚙️', 
      description: 'Store configuration and settings',
      color: 'teal',
      path: '/admin/settings'
      
    }
  ];

  const StatCard = ({ title, value, change, icon, color }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        {change && <div className="stat-change">{change}</div>}
      </div>
    </div>
  );

  const FeatureButton = ({ feature }) => (
    <div 
      className={`feature-btn ${feature.color}`}
      onClick={() => navigate(feature.path)}
    >
      <div className="feature-icon">{feature.icon}</div>
      <div className="feature-content">
        <h3>{feature.label}</h3>
        <p>{feature.description}</p>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="tab-content">
      {/* Quick Feature Buttons Grid */}
      <div className="features-section">
        <div className="section-header">
          <h2>🚀 Quick Actions</h2>
          <p>Manage your fashion store efficiently</p>
        </div>
        <div className="features-grid">
          {featureButtons.map((feature) => (
            <FeatureButton key={feature.id} feature={feature} />
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={`$${dashboardData.totalRevenue.toLocaleString()}`}
          change="+18.5% this month"
          icon="💰"
          color="revenue"
        />
        <StatCard
          title="Total Orders"
          value={dashboardData.totalOrders.toLocaleString()}
          change="+284 new orders"
          icon="📦"
          color="orders"
        />
        <StatCard
          title="Products"
          value={dashboardData.totalProducts.toLocaleString()}
          change="+45 new arrivals"
          icon="👗"
          color="products"
        />
        <StatCard
          title="Customers"
          value={dashboardData.totalCustomers.toLocaleString()}
          change="+892 new customers"
          icon="👥"
          color="customers"
        />
      </div>
    </div>
  );

  return (
    <>
      <style jsx>{`
        .admin-dashboard {
          min-height: 100vh;
          display: flex;
          position: relative;
          overflow: hidden;
          font-family: 'Playfair Display', 'Cormorant Garamond', serif;
          background: #1C1C1C;
        }

        /* Background Slideshow with Online Images */
        .admin-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .slideshow-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0;
          transform: scale(1.1);
          transition: all 1.5s cubic-bezier(0.7, 0, 0.3, 1);
        }

        .slide.active {
          opacity: 1;
          transform: scale(1);
        }

        .slide-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(28, 28, 28, 0.92) 0%, rgba(75, 28, 47, 0.85) 50%, rgba(1, 68, 33, 0.7) 100%);
        }

        /* Luxury Floating Elements */
        .luxury-elements {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .floating-element {
          position: absolute;
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 50%;
          animation: float 8s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-25px) rotate(180deg);
            opacity: 0.8;
          }
        }

        /* Sidebar */
        .sidebar {
          width: ${sidebarOpen ? '320px' : '80px'};
          background: rgba(28, 28, 28, 0.95);
          backdrop-filter: blur(25px);
          border-right: 1px solid rgba(212, 175, 55, 0.4);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
          position: relative;
          box-shadow: 8px 0 40px rgba(0, 0, 0, 0.6);
        }

        .sidebar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #D4AF37, #4B1C2F, #014421, #001F3F);
        }

        .sidebar-header {
          padding: 2.5rem 2rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }

        .logo-icon {
          width: 55px;
          height: 55px;
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1C1C1C;
          font-weight: bold;
          font-size: 1.2rem;
          font-family: 'Cormorant Garamond', serif;
          box-shadow: 0 15px 35px rgba(212, 175, 55, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .brand-text {
          opacity: ${sidebarOpen ? '1' : '0'};
          transition: opacity 0.3s ease 0.1s;
        }

        .brand-name {
          color: #D4AF37;
          font-size: 1.6rem;
          font-weight: 700;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .brand-subtitle {
          color: #F5F5F5;
          opacity: 0.8;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
          font-style: italic;
        }

        .sidebar-nav {
          padding: 2rem 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1.3rem 2rem;
          color: #F5F5F5;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          border-left: 4px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          left: -100%;
          top: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent);
          transition: left 0.6s ease;
        }

        .nav-item:hover::before {
          left: 100%;
        }

        .nav-item:hover {
          background: rgba(212, 175, 55, 0.08);
          border-left-color: rgba(212, 175, 55, 0.6);
        }

        .nav-item.active {
          background: rgba(212, 175, 55, 0.12);
          border-left-color: #D4AF37;
          color: #D4AF37;
        }

        .nav-icon {
          font-size: 1.4rem;
          min-width: 28px;
          transition: all 0.3s ease;
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.2);
        }

        .nav-text {
          opacity: ${sidebarOpen ? '1' : '0'};
          transition: opacity 0.3s ease;
          white-space: nowrap;
          font-weight: 600;
          font-size: 1rem;
        }

        /* Main Content Area */
        .main-content {
          flex: 1;
          padding: 2.5rem;
          z-index: 2;
          position: relative;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding: 1.5rem 0;
        }

        .toggle-sidebar {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          padding: 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.2rem;
        }

        .toggle-sidebar:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: scale(1.1);
        }

        .user-area {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .notifications {
          position: relative;
          cursor: pointer;
          padding: 0.75rem;
          border-radius: 10px;
          transition: all 0.3s ease;
          background: rgba(212, 175, 55, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.1);
        }

        .notifications:hover {
          background: rgba(212, 175, 55, 0.1);
          transform: scale(1.1);
        }

        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #4B1C2F;
          color: #F5F5F5;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 2px solid #1C1C1C;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 0.75rem 1.5rem;
          background: rgba(212, 175, 55, 0.08);
          border-radius: 15px;
          border: 1px solid rgba(212, 175, 55, 0.2);
          transition: all 0.3s ease;
        }

        .user-info:hover {
          background: rgba(212, 175, 55, 0.12);
          transform: translateY(-2px);
        }

        .user-avatar {
          width: 55px;
          height: 55px;
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1C1C1C;
          font-weight: bold;
          font-size: 1.2rem;
          box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 700;
          color: #F5F5F5;
          font-size: 1.1rem;
        }

        .user-role {
          font-size: 0.85rem;
          color: #D4AF37;
          opacity: 0.9;
          font-weight: 600;
        }

        .logout-btn {
          background: rgba(75, 28, 47, 0.3);
          color: #ff6b6b;
          border: 1px solid #4B1C2F;
          padding: 0.85rem 1.75rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          font-weight: 600;
        }

        .logout-btn:hover {
          background: rgba(75, 28, 47, 0.5);
          transform: translateY(-2px);
        }

        /* Features Section - STABLE BUTTONS */
        .features-section {
          margin-bottom: 3rem;
        }

        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-header h2 {
          font-size: 2.5rem;
          color: #D4AF37;
          margin: 0 0 1rem 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .section-header p {
          color: rgba(245, 245, 245, 0.8);
          font-size: 1.1rem;
          margin: 0;
          font-style: italic;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .feature-btn {
          background: rgba(28, 28, 28, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 15px;
          padding: 2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-btn:hover {
          border-color: rgba(212, 175, 55, 0.6);
          background: rgba(28, 28, 28, 0.9);
        }

        .feature-icon {
          font-size: 2.5rem;
          padding: 1.2rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .feature-btn:hover .feature-icon {
          transform: scale(1.05);
        }

        .feature-content {
          flex: 1;
        }

        .feature-content h3 {
          color: #F5F5F5;
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .feature-content p {
          color: rgba(245, 245, 245, 0.7);
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        /* Color variants for feature buttons */
        .feature-btn.gold .feature-icon { 
          background: rgba(212, 175, 55, 0.15); 
          border: 1px solid rgba(212, 175, 55, 0.3); 
        }
        .feature-btn.emerald .feature-icon { 
          background: rgba(1, 68, 33, 0.15); 
          border: 1px solid rgba(1, 68, 33, 0.3); 
        }
        .feature-btn.burgundy .feature-icon { 
          background: rgba(75, 28, 47, 0.15); 
          border: 1px solid rgba(75, 28, 47, 0.3); 
        }
        .feature-btn.navy .feature-icon { 
          background: rgba(0, 31, 63, 0.15); 
          border: 1px solid rgba(0, 31, 63, 0.3); 
        }
        .feature-btn.purple .feature-icon { 
          background: rgba(75, 0, 130, 0.15); 
          border: 1px solid rgba(75, 0, 130, 0.3); 
        }
        .feature-btn.teal .feature-icon { 
          background: rgba(0, 128, 128, 0.15); 
          border: 1px solid rgba(0, 128, 128, 0.3); 
        }

        /* Statistics Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .stat-card {
          background: rgba(28, 28, 28, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 15px;
          padding: 2rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: rgba(212, 175, 55, 0.6);
          background: rgba(28, 28, 28, 0.9);
        }

        .stat-icon {
          font-size: 2.5rem;
          padding: 1.2rem;
          background: rgba(212, 175, 55, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.3);
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.05);
        }

        .stat-content h3 {
          margin: 0 0 0.5rem 0;
          color: rgba(245, 245, 245, 0.8);
          font-size: 0.9rem;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #F5F5F5;
          margin-bottom: 0.5rem;
        }

        .stat-change {
          font-size: 0.85rem;
          color: #4CAF50;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        /* Color variants for stat cards */
        .stat-card.revenue { border-left: 4px solid #D4AF37; }
        .stat-card.orders { border-left: 4px solid #4B1C2F; }
        .stat-card.products { border-left: 4px solid #014421; }
        .stat-card.customers { border-left: 4px solid #001F3F; }

        /* Tab Content */
        .tab-content {
          opacity: 1;
          transform: none;
        }

        /* Loading State */
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
          font-size: 1.3rem;
          color: #D4AF37;
        }

        .loading::after {
          content: '';
          width: 25px;
          height: 25px;
          border: 3px solid transparent;
          border-top: 3px solid #D4AF37;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .sidebar {
            position: fixed;
            left: ${sidebarOpen ? '0' : '-320px'};
            height: 100vh;
            z-index: 1000;
          }
          
          .features-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 1.5rem;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .user-area {
            flex-direction: column;
            gap: 1rem;
          }
          
          .section-header h2 {
            font-size: 2rem;
          }
        }

        @media (min-width: 1500px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <div className="admin-dashboard">
        {/* Background Slideshow with Online Images */}
        <div className="admin-background">
          <div className="slideshow-container">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${slide})` }}
              >
                <div className="slide-overlay"></div>
              </div>
            ))}
          </div>
          
          {/* Luxury Floating Elements */}
          <div className="luxury-elements">
            <div className="floating-element" style={{width: '120px', height: '120px', top: '15%', left: '8%', animationDelay: '0s', borderColor: 'rgba(212, 175, 55, 0.5)'}}></div>
            <div className="floating-element" style={{width: '180px', height: '180px', top: '65%', right: '8%', animationDelay: '2s', borderColor: 'rgba(1, 68, 33, 0.4)'}}></div>
            <div className="floating-element" style={{width: '100px', height: '100px', bottom: '15%', left: '15%', animationDelay: '4s', borderColor: 'rgba(75, 28, 47, 0.4)'}}></div>
            <div className="floating-element" style={{width: '140px', height: '140px', top: '25%', right: '15%', animationDelay: '6s', borderColor: 'rgba(0, 31, 63, 0.4)'}}></div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="brand-logo">
              <div className="logo-icon">SFH</div>
              <div className="brand-text">
                <h1 className="brand-name">SriluFashionHub</h1>
                <p className="brand-subtitle">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: '📊', path: '/admin/dashboard' },
              { id: 'new-product', label: 'New Product', icon: '✨', path: '/admin/new-product' },
              { id: 'products', label: 'Products', icon: '👗', path: '/admin/products' },
              { id: 'orders', label: 'Orders', icon: '📦', path: '/admin/orders' },
              { id: 'customers', label: 'Customers', icon: '👥', path: '/admin/customers' },
              { id: 'analytics', label: 'Analytics', icon: '📈', path: '/admin/analytics' },
              { id: 'settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' }
            ].map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(item.path);  
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
              </div>
            ))}

          </nav>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="top-bar">
            <button 
              className="toggle-sidebar"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>

            <div className="user-area">
              <div className="notifications">
                <span>🔔</span>
                <div className="notification-badge">3</div>
              </div>
              
              <div className="user-info">
                <div className="user-avatar">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="user-details">
                  <div className="user-name">{user?.name || 'Administrator'}</div>
                  <div className="user-role">Super Admin</div>
                </div>
              </div>
              
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading Luxury Dashboard...</div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab />}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;