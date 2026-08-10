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
  Lock,
  Award,
  Headphones,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Mail,
  Gift,
  Globe
} from 'lucide-react';
import Logo from '../../components/common/Logo';
import ProductCard from '../../components/ProductCard';
import { fetchWishlist } from '../../redux/slices/wishlistSlice';
import { productsData } from '../../data/products';
import SectionCurveDivider from '../../components/common/SectionCurveDivider';
import { useToast } from '../../components/common/Toast/useToast';
import './UserDashboard.css';
import '../../styles/store.css';

const CATEGORY_CARDS = [
  {
    name: 'Women Fashion',
    categoryKey: "Women's",
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    cta: 'EXPLORE NOW →'
  },
  {
    name: 'Beauty & Care',
    categoryKey: 'Beauty & Care',
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80',
    cta: 'EXPLORE NOW →'
  },
  {
    name: 'Jewellery',
    categoryKey: 'Accessories',
    img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
    cta: 'EXPLORE NOW →'
  },
  {
    name: 'Bags & Accessories',
    categoryKey: 'Accessories',
    img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
    cta: 'EXPLORE NOW →'
  },
  {
    name: 'Home & Living',
    categoryKey: 'Home & Living',
    img: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&auto=format&fit=crop&q=80',
    cta: 'EXPLORE NOW →'
  },
  {
    name: 'Gifts & Hampers',
    categoryKey: 'Gifts & Hampers',
    img: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&auto=format&fit=crop&q=80',
    cta: 'EXPLORE NOW →'
  }
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const categoryScrollRef = useRef(null);

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });
  const { items: cartItems } = useSelector((state) => state.cart || { items: [] });

  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
  const wishlistCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

    if (!userToken || !storedUser) {
      navigate('/login');
      return;
    }

    setUser(storedUser);
    fetchData(userToken);
  }, [navigate]);

  const fetchData = async (token) => {
    setLoading(true);
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    try {
      const pRes = await fetch(`${API_BASE}/api/products`);
      const pData = await pRes.json();
      let prods = [];
      if (pData.success && Array.isArray(pData.products)) {
        prods = pData.products;
      } else if (Array.isArray(pData)) {
        prods = pData;
      }
      setProducts(prods.length > 0 ? prods : productsData);
      dispatch(fetchWishlist());
    } catch (err) {
      console.error('Error fetching storefront data:', err);
      setProducts(productsData);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast.success('Thank you for subscribing to SRILU FashionHub!');
    setNewsletterEmail('');
  };

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

  return (
    <div className="storefront-root">
      {/* 1. LIGHT LUXURY NAVIGATION HEADER (Matches Image 2 Header) */}
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
            <li>
              <button className="nav-item-link" onClick={() => navigate('/user/coupons')}>Premium Club</button>
            </li>
          </ul>

          <div className="nav-actions-right">
            <button className="nav-icon-btn" title="Account" onClick={() => navigate('/user/profile')}>
              <User size={19} />
            </button>

            <button className="nav-icon-btn" title="Wishlist" onClick={() => navigate('/user/wishlist')}>
              <Heart size={19} />
              {wishlistCount > 0 && <span className="nav-cart-badge">{wishlistCount}</span>}
            </button>

            <button className="nav-icon-btn" title="Cart" onClick={() => navigate('/user/cart')}>
              <ShoppingBag size={19} />
              {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
            </button>

            <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* 2. 3D HERO SECTION WITH FULL BOUTIQUE BACKGROUND IMAGE */}
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

          {/* Premium Reusable Section Curve Divider */}
          <SectionCurveDivider nextSectionClass="shop-by-category" />
        </section>

        {/* 3. SHOP BY CATEGORY SECTION (Luxury Fashion Editorial Showcase) */}
        <section id="shop-by-category" className="category-section-container">
          <div className="category-title-block">
            <h2 className="category-editorial-heading">SHOP BY CATEGORY</h2>
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

          <div className="category-carousel-outer-wrapper">
            {/* Outer Left Side Arrow Button */}
            <button
              className="category-side-arrow-btn side-arrow-left"
              onClick={scrollCategoryLeft}
              title="Previous categories"
              aria-label="Previous categories"
            >
              <ChevronLeft size={22} />
            </button>

            <div className="category-scroll-container" ref={categoryScrollRef}>
              {/* All Category Pill */}
              <div
                className={`category-card ${selectedCategory === 'All' ? 'selected-active' : ''}`}
                onClick={() => handleCategorySelect('All')}
              >
                <div className="category-img-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80"
                    alt="All Categories"
                    loading="lazy"
                  />
                </div>
                <div className="category-card-body">
                  <h3 className="category-card-title">All Products</h3>
                  <span className="category-cta-text">EXPLORE ALL →</span>
                </div>
              </div>

              {CATEGORY_CARDS.map((cat, idx) => (
                <div
                  key={idx}
                  className={`category-card ${selectedCategory === cat.categoryKey ? 'selected-active' : ''}`}
                  onClick={() => handleCategorySelect(cat.categoryKey)}
                >
                  <div className="category-img-wrap">
                    <img src={cat.img} alt={cat.name} loading="lazy" />
                  </div>
                  <div className="category-card-body">
                    <h3 className="category-card-title">{cat.name}</h3>
                    <span className="category-cta-text">{cat.cta}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Outer Right Side Arrow Button */}
            <button
              className="category-side-arrow-btn side-arrow-right"
              onClick={scrollCategoryRight}
              title="Next categories"
              aria-label="Next categories"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </section>

        {/* 4. PROMOTIONAL BANNERS SECTION (Exact Replica of Reference Image) */}
        <section className="promo-banners-container">
          <div className="promo-grid">
            {/* Banner 1: New Arrivals */}
            <div className="promo-card promo-card-pink">
              <div className="promo-card-content">
                <span className="promo-tag">NEW ARRIVALS</span>
                <h3 className="promo-title">Fresh Styles <br /> Just For You</h3>
                <button className="promo-btn" onClick={scrollToProducts}>
                  SHOP NOW →
                </button>
              </div>
            </div>

            {/* Banner 2: Exclusive 40% Off */}
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

            {/* Banner 3: Premium VIP Club with Dark Card Graphic */}
            <div className="promo-card promo-card-rose">
              <div className="promo-card-content">
                <span className="promo-tag">PREMIUM CLUB</span>
                <h3 className="promo-title">Join & Enjoy <br /> Exclusive Benefits</h3>
                <button className="promo-btn" onClick={() => navigate('/user/coupons')}>
                  JOIN NOW →
                </button>
              </div>

              <div className="promo-vip-card-graphic">
                <div className="vip-card-body">
                  <svg width="34" height="34" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="unicornGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F8E5A0" />
                        <stop offset="50%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#AA8022" />
                      </linearGradient>
                    </defs>
                    <path d="M28 8 L38 2 L31 13 Z" fill="url(#unicornGoldGrad)" />
                    <path d="M28 12 C24 15 20 20 18 26 C16 32 19 38 24 42 C21 38 20 34 22 28 C24 22 29 18 34 16 C36 14 34 12 28 12 Z" fill="url(#unicornGoldGrad)" />
                    <path d="M26 18 C20 20 14 26 14 34 C14 40 18 44 26 46 C22 43 20 39 21 34 C23 28 28 24 35 21 C31 19 28 18 26 18 Z" fill="url(#unicornGoldGrad)" opacity="0.85" />
                  </svg>
                  <span className="vip-card-brand">SRILU</span>
                  <span className="vip-card-sub">FASHION HUB</span>
                </div>
                <div className="vip-card-gold-accent">
                  <div className="gold-gem-cube"></div>
                </div>
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p>Loading products catalog...</p>
            </div>
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