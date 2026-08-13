import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingBag,
  Heart,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Award,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Gift,
  Globe,
  MessageSquare
} from 'lucide-react';
import Logo from '../../components/common/Logo';
import ProductCard from '../../components/ProductCard';
import { fetchWishlist } from '../../redux/slices/wishlistSlice';
import SectionCurveDivider from '../../components/common/SectionCurveDivider';
import { CategorySkeletonRow, ProductSkeletonGrid } from '../../components/common/DashboardSkeletons';
import {
  useCurrentUser,
  useCategories,
  useProducts,
  useWishlistQuery,
  useCartQuery,
  useUnreadChatCount
} from '../../hooks/useDashboardQueries';
import './UserDashboard.css';
import '../../styles/store.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const categoryScrollRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [userState, setUserState] = useState(null);

  // 1. TanStack Query hooks (independent & concurrent)
  const { data: storedUser } = useCurrentUser();
  const userId = userState?._id || userState?.id || storedUser?._id || storedUser?.id;

  const { data: departments = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts(selectedCategory, 12);
  const { data: wishlistData = [] } = useWishlistQuery(userId);
  const { data: cartData = [] } = useCartQuery(userId);
  const { data: unreadChatCount = 0 } = useUnreadChatCount(userId);

  // Redux store integration for backward compatibility with existing Redux-based components
  const { items: reduxWishlist } = useSelector((state) => state.wishlist || { items: [] });
  const { items: reduxCart } = useSelector((state) => state.cart || { items: [] });

  const cartItemsCount = Array.isArray(reduxCart) && reduxCart.length > 0
    ? reduxCart.reduce((sum, item) => sum + (item.quantity || 1), 0)
    : (Array.isArray(cartData) ? cartData.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0);

  const wishlistItemsCount = Array.isArray(reduxWishlist) && reduxWishlist.length > 0
    ? reduxWishlist.length
    : (Array.isArray(wishlistData) ? wishlistData.length : 0);

  // Initial user check & state setup
  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    let u = storedUser;
    if (!u) {
      try {
        const raw = localStorage.getItem('user');
        if (raw && raw !== 'undefined') u = JSON.parse(raw);
      } catch (_) {}
    }

    if (!userToken || !u) {
      navigate('/login');
      return;
    }

    setUserState(u);
  }, [navigate, storedUser]);

  // Non-blocking Redux synchronization
  useEffect(() => {
    if (userId) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, userId]);

  // Profile update storage event listener
  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.key === 'user' && e.newValue && e.newValue !== 'undefined') {
        try {
          setUserState(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleUserUpdate);
    return () => window.removeEventListener('storage', handleUserUpdate);
  }, []);

  const scrollToCategories = () => {
    const el = document.getElementById('shop-by-category');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToProducts = () => {
    const el = document.getElementById('best-sellers-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollCategoryLeft = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollCategoryRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setCarouselIndex(0);
    scrollToProducts();
  };

  const nextCarousel = () => {
    const maxIdx = Math.max(0, filteredProducts.length - 4);
    setCarouselIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
  };

  const prevCarousel = () => {
    const maxIdx = Math.max(0, filteredProducts.length - 4);
    setCarouselIndex((prev) => (prev <= 0 ? maxIdx : prev - 1));
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'All') return true;
    return (
      (p.category || '').toLowerCase() === selectedCategory.toLowerCase() ||
      (p.subCategory || '').toLowerCase() === selectedCategory.toLowerCase()
    );
  });

  const displayedProducts = filteredProducts.slice(carouselIndex, carouselIndex + 6);
  const activeUser = userState || storedUser;

  return (
    <div className="storefront-root">
      {/* 1. LIGHT LUXURY NAVIGATION HEADER */}
      <header className="light-luxury-header">
        <div className="light-nav-container">
          <Logo variant="full" size="sm" mode="dark" subtitle="FASHION HUB" to="/user/dashboard" />

          <ul className="nav-links-center">
            <li>
              <button className="nav-item-link active">Home</button>
            </li>
            <li>
              <button className="nav-item-link" onClick={scrollToCategories}>Collections</button>
            </li>
            <li>
              <button className="nav-item-link" onClick={scrollToCategories}>New Arrivals</button>
            </li>
          </ul>

          <div className="nav-actions-right">
            {(() => {
              const userAvatar = activeUser?.avatarUrl || activeUser?.profileImage || activeUser?.avatar || activeUser?.image || localStorage.getItem('userProfileAvatar');
              return (
                <button className="nav-icon-btn" title="Account" onClick={() => navigate('/user/profile')} style={{ padding: userAvatar ? '3px' : undefined }}>
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt="Account" 
                      style={{ width: '25px', height: '25px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #DE7356', display: 'block' }} 
                    />
                  ) : (
                    <User size={19} />
                  )}
                </button>
              );
            })()}

            <button className="nav-icon-btn" title="Wishlist" onClick={() => navigate('/user/wishlist')}>
              <Heart size={19} />
              {wishlistItemsCount > 0 && <span className="nav-cart-badge">{wishlistItemsCount}</span>}
            </button>

            <button
              className="nav-icon-btn nav-icon-btn--chat"
              title="Chat with Support"
              onClick={() => window.dispatchEvent(new CustomEvent('openUserChat'))}
              style={{ position: 'relative' }}
            >
              <MessageSquare size={19} />
              {unreadChatCount > 0 && (
                <span className="nav-cart-badge">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>

            <button className="nav-icon-btn" title="Cart" onClick={() => navigate('/user/cart')}>
              <ShoppingBag size={19} />
              {cartItemsCount > 0 && <span className="nav-cart-badge">{cartItemsCount}</span>}
            </button>

            <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* 2. 3D HERO SECTION */}
        <section className="hero-3d-wrapper">
          <div className="hero-3d-container">
            <div className="hero-content-left">
              <div className="hero-eyebrow">ELEVATE YOUR STYLE. EXPRESS YOUR UNIQUENESS.</div>
              <h1 className="hero-main-title">
                FASHION THAT <br />
                <span className="hero-highlight-word">INSPIRES</span> <br />
                CONFIDENCE
              </h1>
              <p className="hero-description">
                Discover premium collection across Fashion, Beauty, Jewellery, Home & more - curated just for you.
              </p>

              <button className="btn-shop-collection" onClick={scrollToCategories}>
                SHOP THE COLLECTION <ArrowRight size={16} />
              </button>

              <div className="hero-trust-bar">
                <div className="trust-item">
                  <div className="trust-icon-box">
                    <ShieldCheck size={16} />
                  </div>
                  <span>100% Original Products</span>
                </div>

                <div className="trust-item">
                  <div className="trust-icon-box">
                    <RefreshCw size={16} />
                  </div>
                  <span>Easy Returns Within 7 Days</span>
                </div>

                <div className="trust-item">
                  <div className="trust-icon-box">
                    <Award size={16} />
                  </div>
                  <span>Premium Quality</span>
                </div>

                <div className="trust-item">
                  <div className="trust-icon-box">
                    <Headphones size={16} />
                  </div>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>

          <SectionCurveDivider nextSectionClass="shop-by-category" />
        </section>

        {/* 3. SHOP BY DEPARTMENT SECTION */}
        <section id="shop-by-category" className="category-section-container">
          <div className="category-title-block">
            <h2 className="category-editorial-heading">SHOP BY DEPARTMENT</h2>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '-0.5rem 0 1rem', letterSpacing: '0.06em' }}>
              Discover curated collections by department
            </p>
            <div className="category-editorial-divider" aria-hidden="true">
              <span className="editorial-divider-line" />
              <div className="four-rhombus-cluster">
                <span className="rhombus-node" />
                <span className="rhombus-node" />
                <span className="rhombus-node" />
                <span className="rhombus-node" />
              </div>
              <span className="editorial-divider-line" />
            </div>
          </div>

          {categoriesLoading ? (
            <CategorySkeletonRow count={5} />
          ) : departments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No departments available yet.
            </div>
          ) : (
            <div className="category-carousel-outer-wrapper">
              <button
                className="category-side-arrow-btn side-arrow-left"
                onClick={scrollCategoryLeft}
                title="Previous departments"
                aria-label="Previous departments"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="category-scroll-container" ref={categoryScrollRef}>
                {departments.map((dept) => {
                  const slug = dept.slug || dept.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                  return (
                    <div
                      key={dept._id || dept.name}
                      className="category-card"
                      onClick={() => navigate(`/shop/${slug}`)}
                    >
                      <div className="category-img-wrap">
                        <img
                          src={dept.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'}
                          alt={dept.name}
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div className="category-card-body">
                        <h3 className="category-card-title">{dept.name}</h3>
                        <span className="category-cta-text">EXPLORE →</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                className="category-side-arrow-btn side-arrow-right"
                onClick={scrollCategoryRight}
                title="Next departments"
                aria-label="Next departments"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          )}
        </section>

        {/* 4. PROMOTIONAL BANNERS SECTION */}
        <section className="promo-banners-container">
          <div className="promo-grid">
            <div className="promo-card promo-card-pink">
              <div className="promo-card-content">
                <span className="promo-tag">NEW ARRIVALS</span>
                <h3 className="promo-title">Fresh Styles <br /> Just For You</h3>
                <button className="promo-btn" onClick={scrollToProducts}>
                  SHOP NOW →
                </button>
              </div>
            </div>

            <div className="promo-card promo-card-champagne">
              <div className="promo-card-content">
                <span className="promo-tag">EXCLUSIVE OFFER</span>
                <h3 className="promo-title">Up to <br /> <span className="title-gold-text">40% OFF</span></h3>
                <p className="promo-subtitle">On Selected Items</p>
                <button className="promo-btn" onClick={scrollToProducts}>
                  SHOP DEALS →
                </button>
              </div>
              <div className="promo-callout-40-right">
                <span className="callout-40-num">40</span>
                <div className="callout-40-stack">
                  <span className="callout-40-percent">%</span>
                  <span className="callout-40-off">OFF</span>
                </div>
              </div>
            </div>

            <div className="promo-card promo-card-rose">
              <div className="promo-card-content">
                <span className="promo-tag">SPECIAL SAVINGS</span>
                <h3 className="promo-title">Claim Exclusive <br /> Discount Coupons</h3>
                <button className="promo-btn" onClick={() => navigate('/user/coupons')}>
                  VIEW COUPONS →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. DARK SERVICE STRIP */}
        <section className="dark-service-strip-wrapper">
          <div className="dark-service-strip-pill">
            <div className="service-box">
              <div className="service-icon-circle">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h4 className="service-title">Curated Collections</h4>
                <p className="service-desc">Handpicked With Love</p>
              </div>
            </div>

            <div className="service-divider" />

            <div className="service-box">
              <div className="service-icon-circle">
                <Globe size={20} />
              </div>
              <div>
                <h4 className="service-title">Global Quality</h4>
                <p className="service-desc">From Trusted Brands</p>
              </div>
            </div>

            <div className="service-divider" />

            <div className="service-box">
              <div className="service-icon-circle">
                <Gift size={20} />
              </div>
              <div>
                <h4 className="service-title">Luxury Packaging</h4>
                <p className="service-desc">For Every Order</p>
              </div>
            </div>

            <div className="service-divider" />

            <div className="service-box">
              <div className="service-icon-circle">
                <Headphones size={20} />
              </div>
              <div>
                <h4 className="service-title">Customer First</h4>
                <p className="service-desc">We're Here For You</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. BEST SELLERS / PRODUCTS SECTION */}
        <section id="best-sellers-section" className="best-sellers-wrapper">
          <div className="section-title-wrap" style={{ margin: '4rem 0 2rem' }}>
            <h2 className="section-title-text">
              {selectedCategory === 'All' ? 'BEST SELLERS' : `${selectedCategory.toUpperCase()} PRODUCTS`}
            </h2>
            <div className="diamond-divider" aria-hidden="true">
              <div className="diamond-line" />
              <div className="four-rhombus-cluster">
                <span className="rhombus-node" />
                <span className="rhombus-node" />
                <span className="rhombus-node" />
                <span className="rhombus-node" />
              </div>
              <div className="diamond-line" />
            </div>
          </div>

          {productsLoading ? (
            <ProductSkeletonGrid count={6} />
          ) : displayedProducts.length > 0 ? (
            <div className="best-sellers-carousel-outer">
              {filteredProducts.length > 6 && (
                <button className="side-carousel-arrow side-left" onClick={prevCarousel} title="Previous">
                  <ChevronLeft size={20} />
                </button>
              )}

              <div className="best-sellers-grid">
                {displayedProducts.map((prod) => (
                  <ProductCard key={prod._id || prod.id} product={prod} />
                ))}
              </div>

              {filteredProducts.length > 6 && (
                <button className="side-carousel-arrow side-right" onClick={nextCarousel} title="Next">
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p>No products found in category "{selectedCategory}".</p>
            </div>
          )}
        </section>
      </main>

      {/* 7. RICH LUXURY FOOTER */}
      <footer className="luxury-footer-wrapper">
        <div className="main-footer-body">
          <div>
            <Logo variant="full" size="md" mode="gold" subtitle="FASHION HUB" to="/user/dashboard" />
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginTop: '1rem', lineHeight: '1.6' }}>
              Timeless luxury fashion, bespoke apparel, and lifestyle essentials.
            </p>
          </div>

          <div>
            <h4 className="footer-col-title">SHOP</h4>
            <ul className="footer-link-list">
              <li>
                <a href="#shop" onClick={() => handleCategorySelect('All')}>All Products</a>
              </li>
              <li>
                <a href="#women" onClick={() => handleCategorySelect("Women's")}>Women Fashion</a>
              </li>
              <li>
                <a href="#beauty" onClick={() => handleCategorySelect('Beauty & Care')}>Beauty & Care</a>
              </li>
              <li>
                <a href="#accessories" onClick={() => handleCategorySelect('Accessories')}>Accessories</a>
              </li>
              <li>
                <a href="#home" onClick={() => handleCategorySelect('Home & Living')}>Home & Living</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">CUSTOMER CARE</h4>
            <ul className="footer-link-list">
              <li>
                <button onClick={() => navigate('/user/orders')} className="nav-item-link" style={{ color: 'rgba(255,255,255,0.65)', padding: 0, textTransform: 'none' }}>Track Order</button>
              </li>
              <li>
                <button onClick={() => navigate('/user/orders')} className="nav-item-link" style={{ color: 'rgba(255,255,255,0.65)', padding: 0, textTransform: 'none' }}>Returns & Refunds</button>
              </li>
              <li>
                <button onClick={scrollToCategories} className="nav-item-link" style={{ color: 'rgba(255,255,255,0.65)', padding: 0, textTransform: 'none' }}>Shipping Info</button>
              </li>
              <li>
                <button onClick={scrollToCategories} className="nav-item-link" style={{ color: 'rgba(255,255,255,0.65)', padding: 0, textTransform: 'none' }}>FAQs</button>
              </li>
              <li>
                <button onClick={() => navigate('/user/profile')} className="nav-item-link" style={{ color: 'rgba(255,255,255,0.65)', padding: 0, textTransform: 'none' }}>Contact Us</button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">ABOUT US</h4>
            <ul className="footer-link-list">
              <li>
                <a href="#about">About SRILU</a>
              </li>
              <li>
                <a href="#story">Our Story</a>
              </li>
              <li>
                <a href="#careers">Careers</a>
              </li>
              <li>
                <a href="#terms">Terms & Conditions</a>
              </li>
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">SECURE PAYMENTS</h4>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 0.8rem 0' }}>
              100% Protected
            </p>
            <div className="payment-badges-wrap">
              <span className="payment-pill">VISA</span>
              <span className="payment-pill">Mastercard</span>
              <span className="payment-pill">UPI</span>
              <span className="payment-pill">Razorpay</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          © 2025 SRILU Fashion Hub. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default UserDashboard;