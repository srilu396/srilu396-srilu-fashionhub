import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Phone, MapPin, LogOut, Save, ShoppingBag, Heart, Package, Search, Tag, Crown, Copy, Check } from 'lucide-react';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { fetchWishlist } from '../../redux/slices/wishlistSlice';
import { productsData } from '../../data/products';
import { couponAPI } from '../../utils/api';

const helperCouponStatus = (coupon) => {
  if (!coupon) return 'inactive';
  if (coupon.active_status === false || coupon.isActive === false) return 'inactive';
  const now = new Date();
  const validUntil = coupon.valid_until || coupon.expiryDate;
  if (validUntil && new Date(validUntil) < now) return 'inactive';
  const validFrom = coupon.valid_from || coupon.startDate;
  if (validFrom && new Date(validFrom) > now) return 'upcoming';
  return 'active';
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'orders' | 'wishlist' | 'profile' | 'coupons'
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [vipCoupons, setVipCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Evaluate existing VIP membership indicator
  const isVipCustomer = Boolean(
    user?.isVipSubscriber || 
    user?.isVip || 
    user?.isVIP || 
    user?.vipStatus || 
    user?.membership === 'VIP' || 
    user?.membershipTier === 'VIP' || 
    user?.tier === 'VIP' || 
    user?.role === 'vip'
  );

  useEffect(() => {
    if (isVipCustomer) {
      fetchVipCoupons();
    }
  }, [user]);

  const fetchVipCoupons = async () => {
    setCouponsLoading(true);
    try {
      const data = await couponAPI.getCoupons();
      const allCoupons = Array.isArray(data) ? data : [];
      // Display Active coupons ONLY (exclude Upcoming and Inactive coupons)
      const activeOnly = allCoupons.filter(c => helperCouponStatus(c) === 'active');
      setVipCoupons(activeOnly);
    } catch (err) {
      console.error('Error fetching VIP coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(''), 2000);
  };

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });
  const { items: cartItems } = useSelector((state) => state.cart || { items: [] });

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

    if (!userToken || !storedUser) {
      navigate('/login');
      return;
    }

    setUser(storedUser);
    setProfileForm({
      firstName: storedUser.firstName || '',
      lastName: storedUser.lastName || '',
      email: storedUser.email || '',
      phone: storedUser.phone || '',
      street: storedUser.address?.street || '',
      city: storedUser.address?.city || '',
      state: storedUser.address?.state || '',
      zipCode: storedUser.address?.zipCode || ''
    });

    fetchData(userToken);
  }, [navigate]);

  const fetchData = async (token) => {
    setLoading(true);
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    try {
      // Products
      const pRes = await fetch(`${API_BASE}/api/products`);
      const pData = await pRes.json();
      let prods = [];
      if (pData.success && Array.isArray(pData.products)) {
        prods = pData.products;
      } else if (Array.isArray(pData)) {
        prods = pData;
      }
      setProducts(prods.length > 0 ? prods : productsData);

      // Orders
      const oRes = await fetch(`${API_BASE}/api/orders/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (oRes.ok) {
        const oData = await oRes.json();
        if (oData.success && Array.isArray(oData.orders)) {
          setUserOrders(oData.orders);
        } else if (Array.isArray(oData)) {
          setUserOrders(oData);
        }
      }

      dispatch(fetchWishlist());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setProducts(productsData);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });

    try {
      const token = localStorage.getItem('userToken');
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
          address: {
            street: profileForm.street,
            city: profileForm.city,
            state: profileForm.state,
            zipCode: profileForm.zipCode
          }
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error updating profile.' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const categories = ['All', "Women's", "Men's", 'Footwear', 'Accessories', 'Skirts'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || (p.category || '').toLowerCase() === selectedCategory.toLowerCase() || (p.subCategory || '').toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="user-dashboard-root" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />

      <main className="profile-page-container">
        {/* Profile Sidebar & Top Bar */}
        <div className="profile-dashboard-grid">
          {/* Left Navigation Card */}
          <div className="profile-card profile-sidebar-card">
            <div className="profile-avatar-section">
              <div className="avatar-wrapper">
                <span className="avatar-placeholder">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <h3>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Customer Profile'}</h3>
              <span className="profile-email-badge">
                <Mail size={12} /> {user?.email}
              </span>
            </div>

            <div className="profile-sidebar-divider" />

            {/* Nav Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <button 
                onClick={() => setActiveTab('shop')} 
                className={`filter-btn ${activeTab === 'shop' ? 'active' : ''}`}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                <ShoppingBag size={16} /> Explore Shop
              </button>
              <button 
                onClick={() => setActiveTab('orders')} 
                className={`filter-btn ${activeTab === 'orders' ? 'active' : ''}`}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                <Package size={16} /> My Orders ({userOrders.length})
              </button>
              <button 
                onClick={() => setActiveTab('wishlist')} 
                className={`filter-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                <Heart size={16} /> Wishlist ({wishlistItems.length})
              </button>
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`filter-btn ${activeTab === 'profile' ? 'active' : ''}`}
                style={{ justifyContent: 'flex-start', width: '100%' }}
              >
                <User size={16} /> Account Details
              </button>
              {isVipCustomer && (
                <button 
                  onClick={() => setActiveTab('coupons')} 
                  className={`filter-btn ${activeTab === 'coupons' ? 'active' : ''}`}
                  style={{ justifyContent: 'flex-start', width: '100%', color: '#B07D3A', fontWeight: '700' }}
                >
                  <Tag size={16} /> VIP Coupons ({vipCoupons.length})
                </button>
              )}
            </div>

            <div className="profile-sidebar-divider" />

            <button onClick={handleLogout} className="profile-logout-btn">
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          {/* Right Main Content */}
          <div className="profile-card">
            {/* VIP COUPONS TAB (VISIBLE TO VIP CUSTOMERS ONLY) */}
            {activeTab === 'coupons' && isVipCustomer && (
              <div>
                <div className="profile-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(176,125,58,0.12)', border: '1px solid rgba(176,125,58,0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color: 'var(--gold)', marginBottom: '8px' }}>
                      <Crown size={13} /> CLUB PRIVÉ MEMBER OFFERS
                    </div>
                    <h2 style={{ margin: 0 }}>Exclusive VIP Coupons</h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-mid)', fontSize: '0.9rem' }}>
                      Active bespoke discount codes reserved exclusively for distinguished VIP members.
                    </p>
                  </div>
                </div>

                {couponsLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-mid)' }}>Loading your VIP privileges...</p>
                  </div>
                ) : vipCoupons.length === 0 ? (
                  <div className="wishlist-empty-state" style={{ padding: '3rem 1rem' }}>
                    <div className="empty-heart-wrap">
                      <Tag size={32} className="empty-heart-icon" />
                    </div>
                    <h3>No Active VIP Coupons</h3>
                    <p>There are currently no active promotional codes. Check back soon for new seasonal privileges.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem', marginTop: '1.5rem' }}>
                    {vipCoupons.map((coupon, idx) => {
                      const code = coupon.coupon_code || coupon.code || 'VIPOFFER';
                      const isCopied = copiedCoupon === code;
                      return (
                        <div 
                          key={coupon._id || coupon.id || idx}
                          style={{
                            background: 'var(--white)',
                            border: '1.5px solid rgba(176, 125, 58, 0.3)',
                            borderRadius: 'var(--r-md)',
                            padding: '1.4rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justify: 'space-between',
                            boxShadow: 'var(--shadow-card)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: '800',
                              fontSize: '0.95rem',
                              letterSpacing: '1px',
                              color: 'var(--dark)',
                              background: 'var(--gold-pale)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid rgba(176, 125, 58, 0.25)'
                            }}>
                              {code}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#014421', background: '#EBF8F2', padding: '3px 8px', borderRadius: '12px' }}>
                              ACTIVE
                            </span>
                          </div>

                          <div style={{ marginBottom: '1.2rem' }}>
                            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: '700', color: 'var(--gold-dark)', lineHeight: '1.1' }}>
                              {coupon.discount_type === 'percentage'
                                ? `${coupon.discount_value || coupon.discount || 0}% OFF`
                                : `₹${Math.round(coupon.discount_value || coupon.discount || 0)} OFF`}
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-mid)', margin: '6px 0 0', lineHeight: '1.4' }}>
                              {coupon.description || 'Exclusive promotional discount code.'}
                            </p>
                          </div>

                          <div style={{ borderTop: '1px dashed rgba(176,125,58,0.25)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-mid)' }}>
                            {(coupon.min_order_value || coupon.min_cart_value || coupon.minOrderAmount) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Min Spend:</span>
                                <strong>₹{Math.round(coupon.min_order_value || coupon.min_cart_value || coupon.minOrderAmount).toLocaleString('en-IN')}</strong>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Valid Until:</span>
                              <strong>
                                {coupon.valid_until || coupon.expiryDate 
                                  ? new Date(coupon.valid_until || coupon.expiryDate).toLocaleDateString()
                                  : 'No Expiry Date'}
                              </strong>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopyCoupon(code)}
                            style={{
                              marginTop: '1rem',
                              width: '100%',
                              padding: '0.7rem',
                              borderRadius: 'var(--r-pill)',
                              background: isCopied ? 'var(--gold-dark)' : 'var(--gold)',
                              color: 'var(--white)',
                              border: 'none',
                              fontWeight: '700',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.25s ease'
                            }}
                          >
                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                            {isCopied ? 'Code Copied!' : 'Copy Code'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* SHOP CATALOG TAB */}
            {activeTab === 'shop' && (
              <div>
                <div className="shop-controls-container" style={{ marginBottom: '2rem' }}>
                  <div className="shop-search-bar" style={{ width: '100%', maxWidth: '100%' }}>
                    <input
                      type="text"
                      placeholder="Search Couture..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={16} className="search-icon" />
                  </div>

                  <div className="shop-category-filters" style={{ marginTop: '1rem', justifyContent: 'flex-start' }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="products-loading" style={{ textAlign: 'center', padding: '4rem' }}>
                    <p>Loading couture catalog...</p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="shop-products-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {filteredProducts.map(prod => (
                      <ProductCard key={prod._id || prod.id} product={prod} />
                    ))}
                  </div>
                ) : (
                  <div className="shop-no-results">
                    <p>No products found matching "{searchTerm}".</p>
                  </div>
                )}
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                <div className="profile-card-header">
                  <h2>Order History</h2>
                  <p>Track, manage, and view your recent purchases.</p>
                </div>

                {userOrders.length === 0 ? (
                  <div className="wishlist-empty-state" style={{ padding: '3rem 1rem' }}>
                    <div className="empty-heart-wrap">
                      <Package size={32} className="empty-heart-icon" />
                    </div>
                    <h3>No Orders Yet</h3>
                    <p>When you purchase items, they will appear here with live tracking status.</p>
                    <button onClick={() => setActiveTab('shop')} className="empty-shop-btn">
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {userOrders.map((order, idx) => (
                      <div key={order._id || idx} style={{ border: '1px solid rgba(232,149,109,0.2)', borderRadius: 'var(--r-md)', padding: '1.5rem', background: 'var(--white)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(232,149,109,0.15)', paddingBottom: '0.8rem' }}>
                          <div>
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--dark)' }}>ORDER #{order._id?.substring(0, 10)}</span>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-mid)', margin: '2px 0 0' }}>
                              Date: {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="nav-badge" style={{ padding: '4px 12px', height: 'fit-content' }}>
                            {order.status || 'Processing'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          {(order.items || order.products || []).map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <img 
                                src={item.image || item.product?.images?.[0] || item.product?.image || 'https://via.placeholder.com/80'} 
                                alt={item.name} 
                                style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '8px' }}
                              />
                              <div style={{ flex: 1 }}>
                                <h5 style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'Sora' }}>{item.name || item.product?.name || 'Couture Apparel'}</h5>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-mid)' }}>Qty: {item.quantity || 1}</span>
                              </div>
                              <span style={{ fontWeight: '700', fontFamily: 'Playfair Display', color: 'var(--gold-dark)' }}>
                                ₹{Math.round(item.price || item.product?.price || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div style={{ marginTop: '1.2rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(232,149,109,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-mid)' }}>Total Amount</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'Playfair Display', color: 'var(--dark)' }}>
                            ₹{Math.round(order.totalAmount || order.totalPrice || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div>
                <div className="profile-card-header">
                  <h2>My Saved Wishlist</h2>
                  <p>Your favorite saved fashion items.</p>
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="wishlist-empty-state" style={{ padding: '3rem 1rem' }}>
                    <div className="empty-heart-wrap">
                      <Heart size={32} className="empty-heart-icon" />
                    </div>
                    <h3>Your Wishlist is Empty</h3>
                    <p>Click the heart icon on any product to save it to your wishlist.</p>
                    <button onClick={() => setActiveTab('shop')} className="empty-shop-btn">
                      Explore Products
                    </button>
                  </div>
                ) : (
                  <div className="shop-products-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {wishlistItems.map(item => (
                      <ProductCard key={item._id || item.id} product={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE & SECURITY TAB */}
            {activeTab === 'profile' && (
              <div>
                <div className="profile-card-header">
                  <h2>Account Settings</h2>
                  <p>Update your personal information and shipping details.</p>
                </div>

                {statusMsg.text && (
                  <div style={{
                    padding: '0.8rem 1.2rem',
                    borderRadius: 'var(--r-md)',
                    marginBottom: '1.5rem',
                    background: statusMsg.type === 'success' ? 'var(--pink-pale)' : '#FFEBEE',
                    color: statusMsg.type === 'success' ? 'var(--pink)' : '#C62828',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {statusMsg.text}
                  </div>
                )}

                <form onSubmit={handleProfileSave} className="profile-edit-form">
                  <div className="form-grid">
                    <div className="form-field-group">
                      <label><User size={14} /> First Name</label>
                      <input 
                        type="text" 
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="form-field-group">
                      <label><User size={14} /> Last Name</label>
                      <input 
                        type="text" 
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="form-field-group full-width">
                      <label><Mail size={14} /> Email Address</label>
                      <input 
                        type="email" 
                        value={profileForm.email} 
                        className="input-disabled"
                        disabled 
                      />
                      <span className="field-hint-msg">Email address cannot be changed.</span>
                    </div>
                    <div className="form-field-group full-width">
                      <label><Phone size={14} /> Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+91 9391207207" 
                      />
                    </div>
                    <div className="form-field-group full-width">
                      <label><MapPin size={14} /> Shipping Address</label>
                      <input 
                        type="text" 
                        value={profileForm.street}
                        onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                        placeholder="Street Address, Flat / House No." 
                      />
                    </div>
                  </div>

                  <button type="submit" className="profile-save-btn">
                    <Save size={16} /> Save Settings
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;