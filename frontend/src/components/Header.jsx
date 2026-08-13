import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, Search, User, Menu, X, Heart, Package, Shield } from 'lucide-react';
import Logo from './common/Logo';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { items: cartItems } = useSelector((state) => state.cart || { items: [] });
  const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });

  const userToken = localStorage.getItem('userToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const adminToken = localStorage.getItem('adminToken');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');

  const itemCount = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
  const wishlistCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  const handleProfileClick = () => {
    if (userToken && user) {
      navigate('/user/dashboard');
    } else if (adminToken && adminUser) {
      navigate('/admin/dashboard');
    } else {
      navigate('/login');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop', badge: 'Hot' },
    { to: '/#about-us', label: 'About Us' },
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <nav className="navbar">
        {/* Brand */}
        <Logo 
          variant="full"
          size="sm"
          subtitle="FASHIONHUB"
          to="/"
        />

        {/* Desktop links */}
        <ul className="nav-links">
          {navLinks.map(({ to, label, badge }) => (
            <li key={to}>
              <Link
                to={to}
                className={`nav-link ${location.pathname === to ? 'active' : ''}`}
              >
                {label}
                {badge && <span className="nav-badge">{badge}</span>}
              </Link>
            </li>
          ))}
          {adminToken && adminUser && (
            <li>
              <Link to="/admin/dashboard" className="nav-link" style={{ color: 'var(--gold)', fontWeight: '700' }}>
                <Shield size={14} style={{ marginRight: '4px' }} /> Admin Panel
              </Link>
            </li>
          )}
        </ul>

        {/* Right side icons */}
        <div className="nav-right">
          {/* Search Bar */}
          <div className="nav-search-wrap">
            <input
              className="nav-search-input"
              placeholder="Search fashion..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <Search size={15} className="nav-search-icon" />
          </div>

          <div className="nav-divider" />

          {/* Wishlist */}
          <Link to="/user/dashboard" onClick={(e) => { if (!userToken) { e.preventDefault(); navigate('/login'); } }} className="nav-icon-btn" aria-label="Wishlist">
            <Heart size={17} className={wishlistCount > 0 ? 'fill-pink text-pink' : ''} />
            {wishlistCount > 0 && (
              <span className="nav-cart-badge">{wishlistCount}</span>
            )}
          </Link>

          {/* Cart */}
          <Link to="/user/cart" className="nav-icon-btn" aria-label="Cart">
            <ShoppingBag size={17} />
            {itemCount > 0 && (
              <span className="nav-cart-badge">{itemCount}</span>
            )}
          </Link>

          {/* Auth Action Buttons when logged out */}
          {!userToken && !adminToken ? (
            <div className="nav-auth-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent',
                  color: '#D4AF37',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.5px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)'; e.currentTarget.style.background = 'transparent'; }}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/login?tab=signup')}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #C5A028)',
                  color: '#0D0D0E',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 10px rgba(212, 175, 55, 0.25)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(212, 175, 55, 0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(212, 175, 55, 0.25)'; }}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <button onClick={handleProfileClick} className="nav-icon-btn nav-profile-btn" aria-label="Account" title={user ? `${user.firstName}` : 'Account Dashboard'}>
              <User size={17} />
            </button>
          )}

          {/* User Orders Quick Button */}
          {userToken && (
            <button 
              onClick={() => navigate('/user/dashboard')} 
              className="nav-icon-btn" 
              aria-label="Orders"
              title="My Orders"
            >
              <Package size={17} />
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <div className={`nav-mobile-menu ${isOpen ? 'open' : ''}`}>
        {navLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="nav-mobile-link"
            onClick={() => setIsOpen(false)}
          >
            {label}
          </Link>
        ))}
        {userToken ? (
          <Link to="/user/dashboard" className="nav-mobile-link" onClick={() => setIsOpen(false)}>
            My Dashboard
          </Link>
        ) : (
          <Link to="/login" className="nav-mobile-link" onClick={() => setIsOpen(false)}>
            Login / Register
          </Link>
        )}
        {adminToken && (
          <Link to="/admin/dashboard" className="nav-mobile-link" onClick={() => setIsOpen(false)}>
            Admin Dashboard
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;