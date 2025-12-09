import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import AnimatedBackground from '../../components/AnimatedBackground';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Tag, Percent, Calendar, Copy, Clock, Filter, Search, ChevronRight, Gift } from 'lucide-react';

const UserCoupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/user/login');
      return;
    }
    
    fetchCoupons();
  }, [navigate]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      
      const response = await fetch('http://localhost:5000/api/coupons/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
        setFilteredCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      // Fallback to mock data for testing
      const mockCoupons = getMockCoupons();
      setCoupons(mockCoupons);
      setFilteredCoupons(mockCoupons);
    } finally {
      setLoading(false);
    }
  };

  const getMockCoupons = () => [
    {
      _id: '1',
      coupon_code: 'WELCOME20',
      discount_type: 'percentage',
      discount_value: 20,
      valid_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage_limit_total: 100,
      used_count: 45,
      active_status: true,
      description: 'Welcome discount for new customers',
      min_order_value: 100,
      excluded_categories: []
    },
    {
      _id: '2',
      coupon_code: 'SUMMER15',
      discount_type: 'percentage',
      discount_value: 15,
      valid_from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      usage_limit_total: 200,
      used_count: 120,
      active_status: true,
      description: 'Summer sale special offer',
      min_order_value: 50,
      excluded_categories: []
    },
    {
      _id: '3',
      coupon_code: 'FLASH50',
      discount_type: 'fixed',
      discount_value: 50,
      valid_from: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      valid_until: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      usage_limit_total: 50,
      used_count: 32,
      active_status: true,
      description: 'Flash sale - limited time only',
      min_order_value: 200,
      excluded_categories: []
    },
    {
      _id: '4',
      coupon_code: 'LOYALTY10',
      discount_type: 'percentage',
      discount_value: 10,
      valid_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      usage_limit_total: null,
      used_count: 78,
      active_status: true,
      description: 'Loyalty discount for regular customers',
      min_order_value: 0,
      excluded_categories: []
    },
    {
      _id: '5',
      coupon_code: 'FREE25',
      discount_type: 'fixed',
      discount_value: 25,
      valid_from: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      valid_until: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      usage_limit_total: 80,
      used_count: 79,
      active_status: true,
      description: 'Limited time $25 off',
      min_order_value: 100,
      excluded_categories: []
    }
  ];

  useEffect(() => {
    filterAndSortCoupons();
  }, [coupons, searchTerm, sortBy, statusFilter]);

  const filterAndSortCoupons = () => {
    let filtered = coupons.filter(coupon => {
      const matchesSearch = coupon.coupon_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && coupon.active_status && isCouponActive(coupon)) ||
        (statusFilter === 'expired' && (!coupon.active_status || !isCouponActive(coupon))) ||
        (statusFilter === 'almost_expired' && isAlmostExpired(coupon));
      
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.valid_from) - new Date(a.valid_from);
        case 'expiring_soon':
          return new Date(a.valid_until) - new Date(b.valid_until);
        case 'discount_high':
          return b.discount_value - a.discount_value;
        case 'discount_low':
          return a.discount_value - b.discount_value;
        default:
          return 0;
      }
    });

    setFilteredCoupons(filtered);
  };

  const isCouponActive = (coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);
    
    return coupon.active_status && now >= validFrom && now <= validUntil;
  };

  const isAlmostExpired = (coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.valid_until);
    const hoursLeft = (validUntil - now) / (1000 * 60 * 60);
    
    return hoursLeft <= 48 && hoursLeft > 0;
  };

  const getDaysLeft = (validUntil) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUsagePercentage = (coupon) => {
    if (!coupon.usage_limit_total) return 0;
    return Math.min((coupon.used_count / coupon.usage_limit_total) * 100, 100);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    
    setTimeout(() => {
      setCopiedCoupon(null);
    }, 2000);
  };

  const applyCoupon = (coupon) => {
    // Store coupon in localStorage for checkout
    localStorage.setItem('selectedCoupon', JSON.stringify(coupon));
    
    // Navigate to cart or show success message
    alert(`Coupon ${coupon.coupon_code} selected! It will be applied at checkout.`);
    
    // Optionally navigate to cart
    // navigate('/user/cart');
  };

  const getStatusBadge = (coupon) => {
    if (!coupon.active_status) {
      return <span className="status-badge inactive">Inactive</span>;
    }
    
    if (!isCouponActive(coupon)) {
      return <span className="status-badge expired">Expired</span>;
    }
    
    if (isAlmostExpired(coupon)) {
      return <span className="status-badge almost-expired">Ending Soon</span>;
    }
    
    return <span className="status-badge active">Active</span>;
  };

  if (loading) {
    return (
      <div className="user-coupons-page">
        <AnimatedBackground />
        <Header />
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-coupons-page">
      <AnimatedBackground />
      <Header />
      
      {/* Hero Section */}
      <section className="coupons-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon">🎫</span>
            <span className="hero-text">Available Coupons</span>
          </h1>
          <p className="hero-subtitle">
            Save more on your luxury fashion purchases with exclusive discounts
          </p>
        </div>
        
        {/* Stats Bar */}
        <div className="coupons-stats">
          <div className="stat-item">
            <div className="stat-value">{coupons.filter(isCouponActive).length}</div>
            <div className="stat-label">Active Coupons</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">
              {coupons.filter(c => c.discount_type === 'percentage').length}
            </div>
            <div className="stat-label">% Discounts</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">
              {coupons.filter(c => c.discount_type === 'fixed').length}
            </div>
            <div className="stat-label">Fixed Discounts</div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="coupons-controls">
        <div className="controls-container">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search coupons by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <Filter size={16} />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Coupons</option>
                <option value="active">Active</option>
                <option value="almost_expired">Ending Soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            
            <div className="filter-group">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="discount_high">Highest Discount</option>
                <option value="discount_low">Lowest Discount</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Coupons Grid */}
      <section className="coupons-grid-section">
        <div className="coupons-grid">
          {filteredCoupons.length > 0 ? (
            filteredCoupons.map((coupon) => {
              const isActive = isCouponActive(coupon);
              const daysLeft = getDaysLeft(coupon.valid_until);
              const usagePercent = getUsagePercentage(coupon);
              
              return (
                <div 
                  key={coupon._id} 
                  className={`coupon-card ${isActive ? 'active' : 'inactive'}`}
                >
                  <div className="coupon-header">
                    <div className="coupon-code">
                      <span className="code-text">{coupon.coupon_code}</span>
                      {getStatusBadge(coupon)}
                    </div>
                    
                    <button
                      onClick={() => copyToClipboard(coupon.coupon_code)}
                      className="copy-btn"
                      title="Copy to clipboard"
                    >
                      {copiedCoupon === coupon.coupon_code ? (
                        <span className="copied-text">✓ Copied</span>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="coupon-discount">
                    <div className="discount-value">
                      {coupon.discount_type === 'percentage' ? (
                        <>
                          <Percent size={24} />
                          <span className="value">{coupon.discount_value}%</span>
                          <span className="off">OFF</span>
                        </>
                      ) : (
                        <>
                          <span className="currency">$</span>
                          <span className="value">{coupon.discount_value}</span>
                          <span className="off">OFF</span>
                        </>
                      )}
                    </div>
                    
                    {coupon.min_order_value > 0 && (
                      <div className="min-order">
                        Min. order: ${coupon.min_order_value}
                      </div>
                    )}
                  </div>
                  
                  <div className="coupon-description">
                    <p>{coupon.description}</p>
                  </div>
                  
                  <div className="coupon-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <Calendar size={14} />
                        <span className="detail-label">Valid until:</span>
                        <span className="detail-value">
                          {new Date(coupon.valid_until).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {daysLeft > 0 && isActive && (
                        <div className="detail-item">
                          <Clock size={14} />
                          <span className="detail-label">Expires in:</span>
                          <span className="detail-value days-left">
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {coupon.usage_limit_total && (
                      <div className="usage-info">
                        <div className="usage-text">
                          Used: {coupon.used_count}/{coupon.usage_limit_total}
                        </div>
                        <div className="usage-bar">
                          <div 
                            className="usage-fill"
                            style={{ width: `${usagePercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isActive && (
                    <div className="coupon-actions">
                      <button 
                        onClick={() => applyCoupon(coupon)}
                        className="apply-btn"
                      >
                        <Gift size={18} />
                        Apply Coupon
                      </button>
                      <button 
                        onClick={() => navigate('/user/cart')}
                        className="view-cart-btn"
                      >
                        Go to Cart
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                  
                  {!isActive && (
                    <div className="coupon-expired">
                      <span className="expired-text">This coupon is no longer active</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-coupons">
              <div className="no-coupons-icon">🎁</div>
              <h3>No coupons found</h3>
              <p>Try adjusting your search or check back later for new offers</p>
            </div>
          )}
        </div>
      </section>

      {/* How to Use Section */}
      <section className="how-to-use">
        <h2 className="section-title">How to Use Coupons</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Browse Coupons</h3>
            <p>Find available coupons from the list above</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Copy Code</h3>
            <p>Click "Copy" to copy the coupon code to clipboard</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Apply at Checkout</h3>
            <p>Paste the code during checkout to apply discount</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Save More</h3>
            <p>Enjoy instant savings on your luxury purchases</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .user-coupons-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
          color: #ffffff;
          position: relative;
          font-family: 'Playfair Display', 'Times New Roman', serif;
        }

        /* Loading Container */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70vh;
          gap: 1.5rem;
        }

        .loading-container p {
          color: #D4AF37;
          font-size: 1.2rem;
        }

        /* Hero Section */
        .coupons-hero {
          padding: 100px 5% 40px;
          background: linear-gradient(135deg, rgba(28, 28, 28, 0.9), rgba(75, 28, 47, 0.7));
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          text-align: center;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto 2rem;
        }

        .hero-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-size: 3.5rem;
          margin-bottom: 1rem;
          color: #F5F5F5;
        }

        .hero-icon {
          font-size: 4rem;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .hero-text {
          background: linear-gradient(45deg, #D4AF37, #F7E7CE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.3rem;
          color: rgba(245, 245, 245, 0.9);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Stats Bar */
        .coupons-stats {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          background: rgba(28, 28, 28, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 20px;
          padding: 1.5rem;
          max-width: 800px;
          margin: 2rem auto 0;
          backdrop-filter: blur(10px);
        }

        .stat-item {
          text-align: center;
          flex: 1;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: bold;
          color: #D4AF37;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          color: rgba(245, 245, 245, 0.8);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(212, 175, 55, 0.3);
        }

        /* Controls Section */
        .coupons-controls {
          padding: 2rem 5%;
          background: rgba(28, 28, 28, 0.5);
        }

        .controls-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 2rem;
          align-items: center;
          justify-content: space-between;
        }

        .search-box {
          flex: 1;
          max-width: 500px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          color: #D4AF37;
        }

        .search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(212, 175, 55, 0.2);
          border-radius: 15px;
          padding: 1rem 1rem 1rem 3.5rem;
          color: #F5F5F5;
          font-size: 1.1rem;
          font-family: 'Playfair Display', serif;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }

        .filter-controls {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #D4AF37;
        }

        .filter-select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 8px;
          padding: 0.8rem 1rem;
          color: #F5F5F5;
          font-size: 1rem;
          font-family: 'Playfair Display', serif;
          cursor: pointer;
          min-width: 180px;
        }

        .filter-select:focus {
          outline: none;
          border-color: #D4AF37;
        }

        /* Coupons Grid */
        .coupons-grid-section {
          padding: 2rem 5%;
          max-width: 1400px;
          margin: 0 auto;
        }

        .coupons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }

        .coupon-card {
          background: linear-gradient(135deg, rgba(28, 28, 28, 0.8), rgba(45, 45, 45, 0.8));
          border: 2px solid;
          border-radius: 20px;
          padding: 2rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .coupon-card.active {
          border-color: rgba(212, 175, 55, 0.4);
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.2);
        }

        .coupon-card.inactive {
          border-color: rgba(117, 117, 117, 0.4);
          opacity: 0.8;
        }

        .coupon-card:hover {
          transform: translateY(-10px);
          border-color: rgba(212, 175, 55, 0.6);
          box-shadow: 0 20px 40px rgba(212, 175, 55, 0.3);
        }

        .coupon-card.inactive:hover {
          transform: translateY(-5px);
          border-color: rgba(117, 117, 117, 0.6);
          box-shadow: 0 10px 20px rgba(117, 117, 117, 0.2);
        }

        .coupon-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .coupon-code {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .code-text {
          font-family: 'Courier New', monospace;
          font-size: 1.5rem;
          font-weight: bold;
          color: #F5F5F5;
          background: rgba(212, 175, 55, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 10px;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }

        .status-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.active {
          background: rgba(1, 68, 33, 0.3);
          border: 1px solid #4CAF50;
          color: #4CAF50;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .status-badge.inactive {
          background: rgba(117, 117, 117, 0.3);
          border: 1px solid #9E9E9E;
          color: #9E9E9E;
        }

        .status-badge.expired {
          background: rgba(244, 67, 54, 0.3);
          border: 1px solid #F44336;
          color: #F44336;
        }

        .status-badge.almost-expired {
          background: rgba(255, 193, 7, 0.3);
          border: 1px solid #FFC107;
          color: #FFC107;
          animation: pulse 1s ease-in-out infinite;
        }

        .copy-btn {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .copy-btn:hover {
          background: rgba(212, 175, 55, 0.3);
          transform: scale(1.05);
        }

        .copied-text {
          color: #4CAF50;
        }

        /* Discount Section */
        .coupon-discount {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .discount-value {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .discount-value .value {
          font-size: 3rem;
          font-weight: bold;
          color: #D4AF37;
        }

        .discount-value .off {
          font-size: 1.2rem;
          color: #F7E7CE;
          font-weight: 600;
        }

        .discount-value .currency {
          font-size: 2rem;
          color: #D4AF37;
          margin-right: 0.2rem;
        }

        .min-order {
          font-size: 0.9rem;
          color: rgba(245, 245, 245, 0.7);
          font-style: italic;
        }

        /* Description */
        .coupon-description {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.1);
        }

        .coupon-description p {
          color: #E5DCC3;
          line-height: 1.6;
          font-size: 1rem;
        }

        /* Details */
        .coupon-details {
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .detail-label {
          color: rgba(245, 245, 245, 0.7);
        }

        .detail-value {
          color: #F5F5F5;
          font-weight: 500;
        }

        .days-left {
          color: #FFC107;
          font-weight: bold;
        }

        .usage-info {
          margin-top: 1rem;
        }

        .usage-text {
          font-size: 0.9rem;
          color: rgba(245, 245, 245, 0.7);
          margin-bottom: 0.5rem;
        }

        .usage-bar {
          width: 100%;
          height: 6px;
          background: rgba(245, 245, 245, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .usage-fill {
          height: 100%;
          background: linear-gradient(90deg, #D4AF37, #F7E7CE);
          border-radius: 3px;
          transition: width 1s ease;
        }

        /* Actions */
        .coupon-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .apply-btn {
          flex: 1;
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          color: #1C1C1C;
          border: none;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .apply-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(212, 175, 55, 0.4);
        }

        .view-cart-btn {
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(212, 175, 55, 0.3);
          color: #D4AF37;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .view-cart-btn:hover {
          background: rgba(212, 175, 55, 0.2);
          transform: translateY(-3px);
        }

        .coupon-expired {
          text-align: center;
          padding: 1rem;
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid rgba(244, 67, 54, 0.3);
          border-radius: 12px;
          margin-top: 1.5rem;
        }

        .expired-text {
          color: #F44336;
          font-weight: 500;
        }

        /* No Coupons */
        .no-coupons {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 20px;
        }

        .no-coupons-icon {
          font-size: 4rem;
          opacity: 0.3;
          margin-bottom: 1.5rem;
        }

        .no-coupons h3 {
          color: #F5F5F5;
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }

        .no-coupons p {
          color: rgba(245, 245, 245, 0.6);
          margin-bottom: 1.5rem;
        }

        /* How to Use Section */
        .how-to-use {
          padding: 4rem 5%;
          background: linear-gradient(135deg, rgba(1, 68, 33, 0.1), rgba(28, 28, 28, 0.6));
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }

        .section-title {
          text-align: center;
          font-size: 2.5rem;
          color: #F5F5F5;
          margin-bottom: 3rem;
          background: linear-gradient(45deg, #D4AF37, #F7E7CE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .step-card {
          background: rgba(28, 28, 28, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .step-card:hover {
          transform: translateY(-10px);
          border-color: rgba(212, 175, 55, 0.4);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }

        .step-number {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          color: #1C1C1C;
          margin: 0 auto 1.5rem;
        }

        .step-card h3 {
          color: #D4AF37;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .step-card p {
          color: rgba(245, 245, 245, 0.8);
          line-height: 1.5;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .controls-container {
            flex-direction: column;
            gap: 1.5rem;
          }

          .search-box {
            max-width: none;
            width: 100%;
          }

          .coupons-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
            flex-direction: column;
            gap: 0.5rem;
          }

          .hero-icon {
            font-size: 3rem;
          }

          .coupons-stats {
            flex-direction: column;
            gap: 1.5rem;
          }

          .stat-divider {
            width: 80%;
            height: 1px;
          }

          .filter-controls {
            flex-direction: column;
            width: 100%;
          }

          .filter-group {
            width: 100%;
          }

          .filter-select {
            width: 100%;
          }

          .detail-row {
            flex-direction: column;
            gap: 0.5rem;
          }

          .coupon-actions {
            flex-direction: column;
          }

          .steps-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .coupons-grid {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1.1rem;
          }

          .stat-value {
            font-size: 2rem;
          }

          .discount-value .value {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default UserCoupons;