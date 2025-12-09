import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    navigate('/user/login');
  };

  // SFH Logo Component
  const Logo = () => {
    return (
      <div className="logo-container">
        <div className="logo-circle">
          <span className="logo-text">SFH</span>
        </div>
        <style jsx>{`
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #D4AF37 0%, #F7E7CE 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
          }
          .logo-text {
            color: #1C1C1C;
            font-family: 'Playfair Display', serif;
            font-weight: bold;
            font-size: 1.2rem;
          }
        `}</style>
      </div>
    );
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo with SFH and Name */}
        <Link to="/" className="brand-section">
          <div className="logo-with-name">
            <Logo />
            <div className="brand-text">
              <h1 className="brand-name">Srilu FashionHub</h1>
              <div className="brand-tagline">Luxury Redefined</div>
            </div>
          </div>
        </Link>

        <nav className={`luxury-nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <Link to="/user/dashboard" className="nav-item active">Home</Link>
          <Link to="/user/products" className="nav-item">Products</Link>
          <Link to="/user/categories" className="nav-item">Categories</Link>
          <Link to="/user/new-arrivals" className="nav-item">New Arrivals</Link>
        </nav>

        <div className="user-actions">
          <button className="nav-item search-btn">
            <span className="icon">🔍</span>
          </button>
          
          <Link to="/user/wishlist" className="nav-item wishlist-btn">
            <span className="icon">❤️</span>
          </Link>
          
          <Link to="/user/cart" className="nav-item cart-btn">
            <span className="icon">🛒</span>
          </Link>
          
          <div className="profile-dropdown">
            <button 
              className="nav-item profile-btn"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <span className="icon">👤</span>
            </button>
            
            {isProfileOpen && (
              <div className="dropdown-menu">
                <Link to="/user/profile" className="dropdown-item">My Profile</Link>
                <Link to="/user/orders" className="dropdown-item">My Orders</Link>
                <button onClick={handleLogout} className="dropdown-item logout">
                  Logout
                </button>
              </div>
            )}
          </div>

          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .header {
          background: rgba(28, 28, 28, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 3px solid #D4AF37;
          padding: 1rem 2rem;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }

        /* Brand Section with Logo and Name */
        .brand-section {
          text-decoration: none;
          display: flex;
          align-items: center;
        }

        .logo-with-name {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(45deg, #D4AF37, #F7E7CE, #D4AF37);
          background-size: 200% 200%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s ease-in-out infinite;
          text-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
          font-family: 'Playfair Display', serif;
          margin: 0;
          line-height: 1;
        }

        .brand-tagline {
          color: #F5F5F5;
          font-size: 0.8rem;
          font-style: italic;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-family: 'Cormorant Garamond', serif;
          margin-top: 0.2rem;
        }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Luxury Navigation */
        .luxury-nav {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .nav-item {
          background: none;
          border: none;
          color: #E5DCC3;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.8rem 1.5rem;
          border-radius: 25px;
          transition: all 0.3s ease;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500;
          text-decoration: none;
          position: relative;
        }

        /* REMOVED CIRCLE ANIMATION */
        .nav-item:hover {
          background: rgba(212, 175, 55, 0.1);
          color: #F7E7CE;
          transform: translateY(-2px);
        }

        .nav-item.active {
          background: rgba(212, 175, 55, 0.2);
          color: #F7E7CE;
          border: 1px solid #D4AF37;
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .profile-dropdown {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: rgba(28, 28, 28, 0.95);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 10px;
          padding: 0.5rem;
          min-width: 150px;
          margin-top: 0.5rem;
          backdrop-filter: blur(10px);
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          color: #F5F5F5;
          text-decoration: none;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.3s ease;
          border-radius: 5px;
          font-family: 'Cormorant Garamond', serif;
        }

        .dropdown-item:hover {
          background: rgba(212, 175, 55, 0.1);
        }

        .dropdown-item.logout {
          color: #ff4444;
        }

        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          gap: 4px;
        }

        .bar {
          width: 25px;
          height: 2px;
          background: #F5F5F5;
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
          }

          .luxury-nav {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(28, 28, 28, 0.95);
            flex-direction: column;
            padding: 1rem;
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            backdrop-filter: blur(20px);
          }

          .nav-open {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
          }

          .brand-name {
            font-size: 1.5rem;
          }

          .logo-circle {
            width: 40px;
            height: 40px;
          }

          .logo-text {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .logo-with-name {
            gap: 0.5rem;
          }
          
          .brand-name {
            font-size: 1.3rem;
          }
          
          .brand-tagline {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;