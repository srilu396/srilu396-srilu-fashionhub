import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, syncWithLocalStorage as syncCart } from '../redux/slices/cartSlice';
import { fetchWishlist, syncWithLocalStorage as syncWishlist } from '../redux/slices/wishlistSlice';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User, 
  Package, 
  X, 
  Loader2, 
  Layers, 
  Tag, 
  Grid, 
  ArrowRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import Logo from './common/Logo';
import { productAPI } from '../utils/api';
import './CustomerShoppingHeader.css';

const CustomerShoppingHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const searchWrapRef = useRef(null);

  // Redux state for badges
  const { items: cartItems }    = useSelector((state) => state.cart     || { items: [] });
  const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });

  const userToken = localStorage.getItem('userToken');

  // Sync cart & wishlist from localStorage if guest, and fetch fresh from API if logged in
  useEffect(() => {
    if (userToken) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    } else {
      dispatch(syncCart());
      dispatch(syncWishlist());
    }
  }, [dispatch, userToken]);

  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u && u !== 'undefined' ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'userProfileAvatar') {
        try {
          const u = localStorage.getItem('user');
          setUser(u && u !== 'undefined' ? JSON.parse(u) : null);
        } catch (_) {}
      }
    };
    const handleAvatarEvent = () => {
      try {
        const u = localStorage.getItem('user');
        setUser(u && u !== 'undefined' ? JSON.parse(u) : null);
      } catch (_) {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleAvatarEvent);
    window.addEventListener('userAvatarChanged', handleAvatarEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleAvatarEvent);
      window.removeEventListener('userAvatarChanged', handleAvatarEvent);
    };
  }, []);

  const itemCount    = Array.isArray(cartItems)    ? cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
  const wishlistCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  // Unread Chat Notifications logic
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const u = localStorage.getItem('user');
      const parsed = u && u !== 'undefined' ? JSON.parse(u) : null;
      const cId = parsed?._id || parsed?.id || 'demo_user_123';
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE}/api/chat/unread/user/${cId}`);
      const data = await res.json();
      if (data.success) {
        setUnreadChatCount(data.unreadCount || 0);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    const handleUpdate = () => fetchUnreadCount();
    window.addEventListener('updateUserChatUnread', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('updateUserChatUnread', handleUpdate);
    };
  }, []);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Debounced search effect (~300ms)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSearchResults(null);
      setSearching(false);
      setDropdownOpen(false);
      return;
    }

    setSearching(true);
    setDropdownOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await productAPI.globalSearch(searchQuery);
        if (res && res.success) {
          setSearchResults(res.results || { departments: [], categories: [], subcategories: [], products: [] });
        } else {
          setSearchResults({ departments: [], categories: [], subcategories: [], products: [] });
        }
      } catch (err) {
        console.error('Error during global header search:', err);
        setSearchResults({ departments: [], categories: [], subcategories: [], products: [] });
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setDropdownOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectResult = (path) => {
    setDropdownOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const hasAnyResults = searchResults && (
    (searchResults.departments && searchResults.departments.length > 0) ||
    (searchResults.categories && searchResults.categories.length > 0) ||
    (searchResults.subcategories && searchResults.subcategories.length > 0) ||
    (searchResults.products && searchResults.products.length > 0)
  );

  return (
    <header className="customer-shopping-header">
      <div className="header-container">
        {/* Left: SRILU Logo */}
        <div className="header-left">
          <Logo 
            variant="full"
            size="sm"
            mode="dark"
            subtitle="FASHIONHUB"
            to="/"
          />
        </div>

        {/* Center: Global Search Bar */}
        <div className="header-center" ref={searchWrapRef}>
          <form className="global-search-form" onSubmit={handleSearchSubmit}>
            <Search size={16} className="search-icon-left" />
            <input
              type="text"
              className="global-search-input"
              placeholder="Search products, categories, departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.trim()) setDropdownOpen(true); }}
            />
            {searching ? (
              <Loader2 size={16} className="search-spinner" />
            ) : searchQuery ? (
              <button 
                type="button" 
                className="btn-search-clear" 
                onClick={() => { setSearchQuery(''); setSearchResults(null); setDropdownOpen(false); }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            ) : null}
          </form>

          {/* Categorized Search Results Dropdown */}
          {dropdownOpen && (
            <div className="search-dropdown-popup">
              {searching ? (
                <div className="search-dropdown-loading">
                  <Loader2 size={20} className="spin-icon" />
                  <span>Searching catalog...</span>
                </div>
              ) : !hasAnyResults ? (
                <div className="search-dropdown-empty">
                  <p>No catalog results found for "<strong>{searchQuery}</strong>"</p>
                </div>
              ) : (
                <div className="search-results-content">
                  {/* DEPARTMENTS */}
                  {searchResults.departments && searchResults.departments.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Layers size={13} /> DEPARTMENTS
                      </div>
                      {searchResults.departments.map((dept) => (
                        <div
                          key={dept.id || dept.slug}
                          className="search-item"
                          onClick={() => handleSelectResult(`/shop/${dept.slug}`)}
                        >
                          <div className="item-thumb-icon">
                            {dept.image ? (
                              <img src={dept.image} alt={dept.name} />
                            ) : (
                              <Sparkles size={14} />
                            )}
                          </div>
                          <span className="item-name">{dept.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CATEGORIES */}
                  {searchResults.categories && searchResults.categories.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Grid size={13} /> CATEGORIES
                      </div>
                      {searchResults.categories.map((cat) => (
                        <div
                          key={cat.id || cat.slug}
                          className="search-item"
                          onClick={() => handleSelectResult(`/shop/${cat.departmentSlug}?category=${cat.slug}`)}
                        >
                          <Tag size={14} className="cat-icon" />
                          <div className="item-text-stack">
                            <span className="item-name">{cat.name}</span>
                            <span className="item-sub">in {cat.departmentName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SUBCATEGORIES */}
                  {searchResults.subcategories && searchResults.subcategories.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <Tag size={13} /> SUBCATEGORIES
                      </div>
                      {searchResults.subcategories.map((sub) => (
                        <div
                          key={sub.id || sub.slug}
                          className="search-item"
                          onClick={() => handleSelectResult(`/shop/${sub.departmentSlug}?category=${sub.categorySlug}&subcategory=${sub.slug}`)}
                        >
                          <Tag size={14} className="sub-icon" />
                          <div className="item-text-stack">
                            <span className="item-name">{sub.name}</span>
                            <span className="item-sub">in {sub.categoryName} ({sub.departmentName})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PRODUCTS */}
                  {searchResults.products && searchResults.products.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">
                        <ShoppingBag size={13} /> PRODUCTS
                      </div>
                      {searchResults.products.map((prod) => {
                        const img = prod.images && prod.images.length > 0 ? prod.images[0] : prod.image;
                        return (
                          <div
                            key={prod._id || prod.id}
                            className="search-item product-item"
                            onClick={() => handleSelectResult(`/product/${prod._id || prod.id}`)}
                          >
                            <img src={img} alt={prod.name} className="product-thumb" />
                            <div className="item-text-stack">
                              <span className="item-name">{prod.name}</span>
                              <span className="item-price">₹{Number(prod.price).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* View All Results Action */}
                  <div 
                    className="search-view-all-btn"
                    onClick={() => handleSearchSubmit()}
                  >
                    <span>View all results for "{searchQuery}"</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Customer Action Buttons */}
        <div className="header-right">

          {/* Wishlist */}
          <button 
            className="action-btn" 
            onClick={() => userToken ? navigate('/user/wishlist') : navigate('/login')}
            title="Wishlist"
            aria-label="Wishlist"
          >
            <Heart size={18} className={wishlistCount > 0 ? 'active-icon' : ''} />
            {wishlistCount > 0 && <span className="action-badge">{wishlistCount}</span>}
          </button>

          {/* Cart */}
          <button 
            className="action-btn" 
            onClick={() => navigate('/user/cart')}
            title="Shopping Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingBag size={18} />
            {itemCount > 0 && <span className="action-badge">{itemCount}</span>}
          </button>

          {/* Profile */}
          {(() => {
            const userAvatar = user?.avatarUrl || user?.profileImage || user?.avatar || user?.image || localStorage.getItem('userProfileAvatar');
            return (
              <button 
                className="action-btn header-profile-btn" 
                onClick={() => userToken ? navigate('/user/profile') : navigate('/login')}
                title={user ? `${user.firstName || 'Account'}` : 'Account'}
                aria-label="Account"
                style={{ padding: (userToken && userAvatar) ? '3px' : undefined }}
              >
                {userToken && userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="Profile" 
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #DE7356', display: 'block' }} 
                  />
                ) : (
                  <User size={18} />
                )}
              </button>
            );
          })()}

          {/* Orders */}
          <button 
            className="action-btn" 
            onClick={() => userToken ? navigate('/user/orders') : navigate('/login')}
            title="My Orders"
            aria-label="My Orders"
          >
            <Package size={18} />
          </button>

          {/* Chat Support */}
          <button 
            className="action-btn" 
            onClick={() => window.dispatchEvent(new CustomEvent('openUserChat'))}
            title="Atelier Concierge Chat"
            aria-label="Atelier Concierge Chat"
            style={{ position: 'relative' }}
          >
            <MessageSquare size={18} />
            {unreadChatCount > 0 && (
              <span className="action-badge" style={{ backgroundColor: '#DE7356', color: '#FFF' }}>
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Stacked Search Bar */}
      <div className="mobile-search-row">
        <form className="global-search-form" onSubmit={handleSearchSubmit}>
          <Search size={16} className="search-icon-left" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Search products, categories, departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) setDropdownOpen(true); }}
          />
        </form>
      </div>
    </header>
  );
};

export default CustomerShoppingHeader;
