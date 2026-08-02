import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Award, 
  ArrowRight, 
  ChevronRight, 
  Menu, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2,
  ShoppingBag,
  Heart,
  Eye,
  Send,
  Instagram,
  Facebook,
  Compass,
  Crown,
  Clock,
  Check
} from 'lucide-react';
import { vipAPI } from '../utils/api';
import './LandingPage.css';

const HERO_SLIDES = [
  {
    image: 'https://images.alphacoders.com/135/1355129.jpeg',
    category: 'HAUTE COUTURE 2026',
    title: 'LUXURY FASHION CRAFTED FOR EVERY EXPRESSION',
    subtitle: 'Discover timeless couture, modern Indian heritage & bespoke silhouettes for women and men.'
  },
  {
    image: 'image.png',
    category: 'GENTLEMEN’S ATELIER',
    title: 'REFINED TAILORING & ROYAL ETHNIC SILHOUETTES',
    subtitle: 'Impeccably cut tuxedos, handcrafted sherwanis and elevated contemporary menswear.'
  },
  {
    image: 'https://wallpapergod.com/images/hd/blackpink-4000X2883-wallpaper-jlue9yav8i9nhatd.jpeg',
    category: 'INDIAN HERITAGE LUXURY',
    title: 'THE ART OF HERITAGE MEETS MODERN ELEGANCE',
    subtitle: 'Bespoke silk sarees, embroidered lehengas and regal occasionwear.'
  },
  {
    image: 'imge_1.png',
    category: 'ARTISANAL ACCESSORIES',
    title: 'HANDMADE LEATHERWARE & FINE JEWELRY',
    subtitle: 'Exquisite finishing touches designed to complete your signature statement.'
  }
];

const ATELIER_INSPIRATIONS = [
  {
    number: "01",
    tag: "DESIGN & DRAUGHTING",
    title: "Artistic Vision & Silhouette",
    description: "Every creation begins with expressive hand-sketches, structural drape studies, and architectural proportion planning in our master atelier.",
    image: "https://i.pinimg.com/736x/54/bc/8a/54bc8a7052bd049385a3292b550f4eb7.jpg",
    badge: "GESTURE & SKETCH"
  },
  {
    number: "02",
    tag: "TACTILE HARMONY",
    title: "Fabric & Color Palette",
    description: "Curated mulberry silks, hand-spun cashmeres, and rich organic dyes merged into harmonious, timeless color stories.",
    image: "https://i.pinimg.com/736x/6b/f7/31/6bf731f9589fc5405a8ea13455405267.jpg",
    badge: "SILK & TEXTURE"
  },
  {
    number: "03",
    tag: "SARTORIAL DUALITY",
    title: "Couture & Gentlemen’s Suiting",
    description: "Equal sartorial devotion to modern female grace and royal gentlemen’s tailoring engineered to absolute distinction.",
    image: "https://i.pinimg.com/1200x/0f/15/42/0f1542f3a21daf9fdde4872dffa9a3af.jpg",
    badge: "ATELIER TAILORING"
  }
];

const EXHIBITION_SCENES = [
  {
    id: 'first-impression',
    step: '01',
    label: 'Daylight Refinement',
    tag: '01 • MORNING ELEGANCE',
    title: 'The First Impression',
    quote: '“Elegance is the quietest form of impact.”',
    description: 'Subtle silk knits, tailored separates, and effortless cuts engineered to command poise before a single word is spoken.',
    image: 'https://thekoreaedit.com/wp-content/uploads/2025/03/ByenWooSeok-3-scaled.jpeg',
    specs: ['Mulberry Silk Knits', 'Soft Shoulders', 'Day-to-Evening Transition'],
    linkText: 'Explore Edition'
  },
  {
    id: 'confidence-in-motion',
    step: '02',
    label: 'Tailored Architecture',
    tag: '02 • EXECUTIVE POISE',
    title: 'Confidence in Motion',
    quote: '“Crafted for those who set the rhythm of the room.”',
    description: 'Sharp tuxedos, structured jackets, and modern lines crafted for executive posture and boardroom dominance.',
    image: 'https://i.pinimg.com/736x/73/6a/3d/736a3d265b8b78ff614f19e02f68532a.jpg',
    specs: ['Bespoke Italian Wool', 'Hand-stitched Lapels', 'Architectural Fit'],
    linkText: 'Discover Tailoring'
  },
  {
    id: 'evenings-that-last',
    step: '03',
    label: 'Nocturne Gala',
    tag: '03 • MOONLIGHT RECEPTIONS',
    title: 'Evenings That Last',
    quote: '“Memories woven in silk and gold thread.”',
    description: 'Bespoke zardozi gowns and royal sherwanis engineered to illuminate grand receptions and moonlight celebrations.',
    image: '/occasion_gala.png',
    specs: ['Hand Embroidery', 'Royal Metallic Accents', 'Gala Silhouette'],
    linkText: 'View Eveningwear'
  },
  {
    id: 'quiet-luxury',
    step: '04',
    label: 'Unhurried Sanctuary',
    tag: '04 • RESORT & ESCAPE',
    title: 'Quiet Luxury',
    quote: '“True luxury is feeling completely at ease.”',
    description: 'Unstructured linen, breathable textures, and relaxed silhouettes for private retreats and weekend escapes.',
    image: 'https://i.pinimg.com/1200x/40/1e/1f/401e1fed46d0fc7f1dcac70adcd6de53.jpg',
    specs: ['Artisanal Linen', 'Relaxed Draped Silhouette', 'Resort Palette'],
    linkText: 'Explore Leisure'
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeExhibition, setActiveExhibition] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [vipSuccessModalOpen, setVipSuccessModalOpen] = useState(false);
  const [vipSubmitting, setVipSubmitting] = useState(false);

  // Auto Hero Slider, Exhibition Auto-Slide & Scroll Listener
  useEffect(() => {
    // Ensure admin dark/light mode attribute does not pollute landing page
    document.documentElement.removeAttribute('data-theme');

    // Preload images for Exhibition and Hero sliders to prevent any blank image flickering
    EXHIBITION_SCENES.forEach((scene) => {
      if (scene.image) {
        const img = new Image();
        img.src = scene.image;
      }
    });
    HERO_SLIDES.forEach((slide) => {
      if (slide.image) {
        const img = new Image();
        img.src = slide.image;
      }
    });

    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);

    const exhibitionTimer = setInterval(() => {
      setActiveExhibition((prev) => (prev + 1) % EXHIBITION_SCENES.length);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(slideTimer);
      clearInterval(exhibitionTimer);
    };
  }, []);

  // Navigation handlers
  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignUpClick = () => {
    navigate('/login?tab=signup');
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Form Input Change
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Submit Contact Inquiry
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success || response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [newsletterError, setNewsletterError] = useState('');

  // VIP Newsletter Submit via backend VIP API with full validation
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterError('');
    
    const trimmedEmail = (newsletterEmail || '').trim();
    if (!trimmedEmail) {
      setNewsletterError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setNewsletterError('Please enter a valid email address.');
      return;
    }

    setVipSubmitting(true);
    try {
      const res = await vipAPI.subscribe(trimmedEmail);
      if (res.alreadySubscribed) {
        setNewsletterError('This email is already a distinguished member of Club Privé.');
      } else if (res.success) {
        setNewsletterSubscribed(true);
        setVipSuccessModalOpen(true);
        setNewsletterEmail('');
      } else {
        setNewsletterError(res.message || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      console.error('VIP Subscription Error:', err);
      setNewsletterError('Network error. Please try again.');
    } finally {
      setVipSubmitting(false);
    }
  };

  return (
    <div className="luxury-landing">
      {/* ═══════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════ */}
      <header className={`luxury-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Left: Brand Logo */}
          <div className="navbar-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="brand-logo-mark">S</span>
            <div className="brand-title-wrap">
              <span className="brand-name">SRILU FASHION HUB</span>
              <span className="brand-tagline">PARIS • MUMBAI • NEW YORK</span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="navbar-center-links">
            <button className="nav-link" onClick={() => scrollToSection('collections')}>Collections</button>
            <button className="nav-link" onClick={() => scrollToSection('new-arrivals')}>New Arrivals</button>
            <button className="nav-link" onClick={() => scrollToSection('brand-story')}>About</button>
            <button className="nav-link" onClick={() => scrollToSection('contact')}>Contact</button>
          </nav>

          {/* Right: Authentication CTAs */}
          <div className="navbar-right-actions">
            <button className="btn-nav-login" onClick={handleLoginClick}>
              Login
            </button>
            <button className="btn-nav-signup" onClick={handleSignUpClick}>
              <span>Create Account</span>
            </button>
            
            {/* Mobile Menu Toggle Button */}
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="mobile-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mobile-drawer-links">
                <button onClick={() => scrollToSection('collections')}>Collections</button>
                <button onClick={() => scrollToSection('women')}>Women</button>
                <button onClick={() => scrollToSection('men')}>Men</button>
                <button onClick={() => scrollToSection('new-arrivals')}>New Arrivals</button>
                <button onClick={() => scrollToSection('brand-story')}>About</button>
                <button onClick={() => scrollToSection('contact')}>Concierge</button>
                <div className="mobile-drawer-auth">
                  <button className="btn-mobile-login" onClick={handleLoginClick}>Login</button>
                  <button className="btn-mobile-signup" onClick={handleSignUpClick}>Create Account</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════════════════════════════
          SECTION 1: HERO BANNER & SLIDER
      ═══════════════════════════════════════ */}
      <section className="hero-section">
        {/* Background Slideshow */}
        <div className="hero-slider">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
          <div className="hero-overlay" />
        </div>

        {/* Hero Content */}
        <div className="hero-container">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide}
              className="hero-content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="hero-badge">
                <Sparkles size={14} className="badge-icon" />
                <span>{HERO_SLIDES[currentSlide].category}</span>
              </div>

              <h1 className="hero-headline">
                {HERO_SLIDES[currentSlide].title}
              </h1>

              <p className="hero-subtext">
                {HERO_SLIDES[currentSlide].subtitle}
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="hero-cta-group">
                <button className="btn-hero-primary" onClick={handleLoginClick}>
                  <span>Login</span>
                  <ArrowRight size={18} />
                </button>

                <button className="btn-hero-secondary" onClick={handleSignUpClick}>
                  <span>Create Account</span>
                </button>
              </div>

              {/* Stat Counters */}
              <div className="hero-stats-row">
                <div className="stat-box">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Bespoke Creations</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-box">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Handcrafted Textiles</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-box">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Global Flagships</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slider Indicators */}
          <div className="hero-controls">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 1: THE SRILU EXPERIENCE (ARTISAN ATELIER STUDIO - DARK THEME)
      ═══════════════════════════════════════ */}
      <section id="collections" className="srilu-experience-section dark-atelier-theme">
        <div className="experience-container">
          <motion.div 
            className="experience-header text-center"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-tag gold-tag">L’ATELIER DE CRÉATION</span>
            <h2 className="section-title text-light">The SRILU Experience</h2>
            <p className="section-description text-subtle">
              Inside our master atelier—where design sketches, fabric inspiration, and sartorial duality take shape.
            </p>
          </motion.div>

          <div className="atelier-inspiration-grid">
            {ATELIER_INSPIRATIONS.map((item, idx) => (
              <motion.div 
                key={idx}
                className="atelier-mood-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: idx * 0.15 }}
              >
                <img src={item.image} alt={item.title} className="atelier-bg-image" loading="lazy" />
                <div className="atelier-card-gradient" />
                <span className="atelier-badge">{item.badge}</span>
                
                <div className="atelier-card-content">
                  <div className="atelier-meta">
                    <span className="atelier-num">{item.number}</span>
                    <span className="atelier-tag">{item.tag}</span>
                  </div>
                  <h3 className="atelier-title">{item.title}</h3>
                  <p className="atelier-desc">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="atelier-footer-stamp">
            <span className="stamp-line" />
            <p className="stamp-quote">“Creation is an intimate dialogue between rare material and human emotion.”</p>
            <button className="btn-atelier-action" onClick={handleLoginClick}>
              <span>Explore the Atelier</span>
              <ArrowRight size={16} />
            </button>
            <span className="stamp-line" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 2: DESIGNED FOR EVERY OCCASION (PANORAMIC EXHIBITION GALLERY STAGE)
      ═══════════════════════════════════════ */}
      <section id="new-arrivals" className="occasions-section exhibition-gallery-theme">
        <div className="occasions-container">
          <motion.div 
            className="occasions-header text-center"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-tag">THE EXPOSITION</span>
            <h2 className="section-title">Designed For Every Occasion</h2>
            <p className="section-description">
              A panoramic lookbook gallery of sartorial scenes.
            </p>
          </motion.div>

          {/* Exhibition Timeline Controls */}
          <div className="exhibition-timeline-nav">
            {EXHIBITION_SCENES.map((scene, index) => (
              <button
                key={scene.id}
                className={`timeline-step-btn ${index === activeExhibition ? 'active' : ''}`}
                onClick={() => setActiveExhibition(index)}
              >
                <span className="step-num">{scene.step}</span>
                <span className="step-label">{scene.label}</span>
                {index === activeExhibition && (
                  <motion.div className="timeline-active-line" layoutId="activeExhibitionLine" />
                )}
              </button>
            ))}
          </div>

          {/* Cinematic Exhibition Stage */}
          <div className="exhibition-stage">
            <div className="exhibition-frame">
              {/* Stacked Images for Ultra-Smooth Crossfade without Blank Gaps */}
              <div className="exhibition-images-wrapper">
                {EXHIBITION_SCENES.map((scene, index) => (
                  <motion.img 
                    key={scene.id}
                    src={scene.image} 
                    alt={scene.title}
                    className="exhibition-bg-image"
                    initial={false}
                    animate={{ 
                      opacity: index === activeExhibition ? 1 : 0,
                      scale: index === activeExhibition ? 1 : 1.04
                    }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                ))}
              </div>

              <div className="exhibition-frame-vignette" />
              
              {/* Slide Counter Badge */}
              <div className="exhibition-counter">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeExhibition}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.3 }}
                  >
                    {EXHIBITION_SCENES[activeExhibition].step}
                  </motion.span>
                </AnimatePresence>
                <span className="counter-divider">/</span>
                <span>04</span>
              </div>

              {/* Sleek Plaque Overlay */}
              <div className="exhibition-plaque">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeExhibition}
                    className="exhibition-plaque-content"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="plaque-tag">{EXHIBITION_SCENES[activeExhibition].tag}</span>
                    <h3 className="plaque-title">{EXHIBITION_SCENES[activeExhibition].title}</h3>
                    <blockquote className="plaque-quote">{EXHIBITION_SCENES[activeExhibition].quote}</blockquote>
                    <p className="plaque-desc">{EXHIBITION_SCENES[activeExhibition].description}</p>
                    
                    {/* Spec Highlights */}
                    <div className="plaque-specs">
                      {EXHIBITION_SCENES[activeExhibition].specs.map((spec, sIdx) => (
                        <span key={sIdx} className="spec-pill">{spec}</span>
                      ))}
                    </div>

                    <button className="plaque-cta-btn" onClick={handleLoginClick}>
                      <span>{EXHIBITION_SCENES[activeExhibition].linkText}</span>
                      <ChevronRight size={16} />
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Stage Navigation Arrows */}
            <div className="exhibition-controls">
              <button 
                className="btn-stage-arrow" 
                onClick={() => setActiveExhibition((prev) => (prev === 0 ? EXHIBITION_SCENES.length - 1 : prev - 1))}
                aria-label="Previous scene"
              >
                ←
              </button>
              <button 
                className="btn-stage-arrow" 
                onClick={() => setActiveExhibition((prev) => (prev + 1) % EXHIBITION_SCENES.length)}
                aria-label="Next scene"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 4: BRAND STORY & HERITAGE
      ═══════════════════════════════════════ */}
      <section id="brand-story" className="brand-story-section">
        <div className="story-container">
          <div className="story-image-column">
            <div className="image-frame main-frame">
              <img 
                src="https://i.pinimg.com/736x/1a/89/82/1a898230eda56015e8b6b30be8ff591d.jpg" 
                alt="Atelier Craftsmanship" 
                loading="lazy"
              />
            </div>
            <div className="image-frame accent-frame">
              <img 
                src="https://i.pinimg.com/1200x/e7/0e/46/e70e46a4d8662e18ab001662f9241391.jpg" 
                alt="Embroidery Detail" 
                loading="lazy"
              />
            </div>
          </div>

          <div className="story-text-column">
            <span className="section-tag">HERITAGE & CRAFTSMANSHIP</span>
            <h2 className="section-title">Where Heritage Meets Contemporary Elegance</h2>
            
            <p className="story-lead">
              Founded on the belief that fashion is the highest form of self-expression, SRILU Fashion Hub merges centuries-old Indian sartorial mastery with contemporary global luxury aesthetics.
            </p>

            <p className="story-body">
              Every garment crafted in our ateliers undergoes hundreds of hours of precision hand-weaving, zardozi embroidery, and bespoke tailoring. We celebrate both women's grace and men's refined stature with pieces created to endure generations.
            </p>

            <div className="story-pillars">
              <div className="pillar-item">
                <div className="pillar-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4>Artisanal Masterclass</h4>
                  <p>Hand-woven by heritage master artisans across India.</p>
                </div>
              </div>

              <div className="pillar-item">
                <div className="pillar-icon">
                  <Award size={20} />
                </div>
                <div>
                  <h4>Bespoke Tailoring</h4>
                  <p>Custom fittings tailored precisely to your personal measurements.</p>
                </div>
              </div>
            </div>

            <button className="btn-story-cta" onClick={handleLoginClick}>
              <span>Discover Our Philosophy</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 5: EDITORIAL STORYTELLING SHOWCASE
      ═══════════════════════════════════════ */}
      <section className="editorial-showcase-section">
        <div className="editorial-banner">
          <div className="editorial-bg-image" />
          <div className="editorial-overlay" />
          <div className="editorial-content">
            <span className="editorial-badge">EDITORIAL SELECTION</span>
            <h2 className="editorial-title">Designed for Every Occasion</h2>
            <p className="editorial-text">
              From high-profile galas and royal wedding celebrations to effortless everyday elegance, experience couture engineered to make every moment unforgettable.
            </p>
            <div className="editorial-buttons">
              <button className="btn-editorial-gold" onClick={handleLoginClick}>
                <span>Explore Gala Lookbook</span>
              </button>
              <button className="btn-editorial-glass" onClick={handleSignUpClick}>
                <span>Join VIP Atelier</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 6: CUSTOMER EXPERIENCE PILLARS
      ═══════════════════════════════════════ */}
      <section className="experience-section">
        <div className="section-header text-center">
          <span className="section-tag">THE SRILU EXPERIENCE</span>
          <h2 className="section-title">Uncompromising Luxury Service</h2>
        </div>

        <div className="experience-grid">
          <div className="experience-card">
            <div className="exp-icon-wrap">
              <Award size={28} />
            </div>
            <h3>Artisanal Quality</h3>
            <p>Finest silk, velvet, and cashmere hand-selected from prestigious mills.</p>
          </div>

          <div className="experience-card">
            <div className="exp-icon-wrap">
              <ShieldCheck size={28} />
            </div>
            <h3>Secure Shopping</h3>
            <p>256-bit encrypted checkout with white-glove fraud protection.</p>
          </div>

          <div className="experience-card">
            <div className="exp-icon-wrap">
              <Sparkles size={28} />
            </div>
            <h3>Private Concierge</h3>
            <p>Personal stylist advice and dedicated bespoke fitting services.</p>
          </div>

          <div className="experience-card">
            <div className="exp-icon-wrap">
              <Truck size={28} />
            </div>
            <h3>Express Global Delivery</h3>
            <p>Insured worldwide shipping in signature luxury presentation packaging.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 7: CONCIERGE INQUIRY & NEWSLETTER
      ═══════════════════════════════════════ */}
      <section id="contact" className="concierge-section">
        <div className="concierge-container">
          {/* Left: Contact / Concierge Inquiry Form */}
          <div className="concierge-form-wrap">
            <span className="section-tag">PRIVATE CONCIERGE</span>
            <h3 className="concierge-title">Bespoke Inquiry & Support</h3>
            <p className="concierge-sub">
              Reach out to our personal styling team for custom appointments, bridal inquiries, or assistance.
            </p>

            {submitStatus === 'success' && (
              <div className="status-banner success">
                <CheckCircle2 size={18} />
                <span>Message submitted successfully. Our concierge will contact you shortly.</span>
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="status-banner error">
                <span>Failed to send message. Please check connection and try again.</span>
              </div>
            )}

            <form className="concierge-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Your Full Name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  required 
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <input 
                type="text" 
                name="subject" 
                placeholder="Inquiry Subject (e.g. Bridal Fitting, Custom Order)" 
                value={formData.subject}
                onChange={handleInputChange}
                required 
              />
              <textarea 
                name="message" 
                rows="4" 
                placeholder="Tell us about your requirements..." 
                value={formData.message}
                onChange={handleInputChange}
                required
              />
              <button type="submit" className="btn-submit-concierge" disabled={isSubmitting}>
                <span>{isSubmitting ? 'Sending Request...' : 'Send Inquiry'}</span>
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Right: Newsletter Privé Invitation */}
          <div className="newsletter-card">
            <div className="newsletter-badge">CLUB PRIVÉ</div>
            <h3 className="newsletter-title">Join The Private VIP Circle</h3>
            <p className="newsletter-text">
              Subscribe to receive exclusive invitations to private runway debuts, early collection access, and bespoke seasonal lookbooks.
            </p>

            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              {/* Unified Luxury Subscription Control */}
              <div className="vip-unified-control">
                <Mail className="mail-icon" size={18} />
                <input 
                  type="email" 
                  placeholder="Enter your private email address..." 
                  value={newsletterEmail}
                  onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterError(''); }}
                  disabled={vipSubmitting}
                  autoComplete="email"
                />
                <button 
                  type="submit" 
                  className={`btn-vip-subscribe ${vipSubmitting ? 'loading' : ''} ${newsletterSubscribed ? 'success' : ''}`}
                  disabled={vipSubmitting}
                >
                  <span>{vipSubmitting ? 'Subscribing' : newsletterSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                  {vipSubmitting ? (
                    <span className="vip-loading-dot" />
                  ) : newsletterSubscribed ? (
                    <Check size={16} />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </button>
              </div>
              {newsletterError && (
                <div className="newsletter-error-msg">
                  <span>✕ {newsletterError}</span>
                </div>
              )}
            </form>

            <div className="concierge-direct-info">
              <a href="tel:+919391207207" className="info-item-link">
                <Phone size={16} className="info-icon" />
                <span>+91 93912 07207</span>
              </a>
              <a href="mailto:support@srilu.in" className="info-item-link">
                <Mail size={16} className="info-icon" />
                <span>support@srilu.in</span>
              </a>
              <a href="https://maps.google.com/?q=Pitapuram,Kakinada,Andhra+Pradesh,India" target="_blank" rel="noreferrer" className="info-item-link">
                <MapPin size={16} className="info-icon" />
                <span>Pitapuram, Kakinada District, AP, India</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SECTION 8: LUXURY FOOTER
      ═══════════════════════════════════════ */}
      <footer className="luxury-footer">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <span className="logo-symbol">S</span>
              <span className="logo-text">SRILU FASHION HUB</span>
            </div>
            <p className="footer-brand-desc">
              Premier luxury storefront celebrating haute couture, bespoke gentlemen's atelier, and modern Indian heritage fashion.
            </p>
            
            {/* Social Icons Replacement */}
            <div className="footer-socials" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px' }}>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram" style={{ color: '#D4AF37' }}>
                <Instagram size={18} />
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer" title="Pinterest" style={{ color: '#D4AF37' }}>
                <Compass size={18} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook" style={{ color: '#D4AF37' }}>
                <Facebook size={18} />
              </a>
            </div>
          </div>

          <div className="footer-links-col">
            <h4>Boutique Information</h4>
            <div className="footer-contact-block">
              <a 
                href="https://maps.google.com/?q=Pitapuram,Kakinada,Andhra+Pradesh,India" 
                target="_blank" 
                rel="noreferrer"
                className="footer-contact-item footer-contact-link"
              >
                <MapPin size={18} className="footer-contact-icon" />
                <div>
                  <strong className="footer-contact-title">SRILU Fashion Hub</strong>
                  <p className="footer-contact-text">Pitapuram, Kakinada District,</p>
                  <p className="footer-contact-text">Andhra Pradesh, India</p>
                </div>
              </a>

              <a href="tel:+919391207207" className="footer-contact-item footer-contact-link">
                <Phone size={18} className="footer-contact-icon" />
                <span className="footer-contact-val">+91 93912 07207</span>
              </a>

              <a href="mailto:support@srilu.in" className="footer-contact-item footer-contact-link">
                <Mail size={18} className="footer-contact-icon" />
                <span className="footer-contact-val">support@srilu.in</span>
              </a>

              <div className="footer-contact-item">
                <Clock size={18} className="footer-contact-icon" />
                <span className="footer-contact-val">Mon – Sat: 10:00 AM – 8:00 PM</span>
              </div>
            </div>
          </div>

          <div className="footer-links-col">
            <h4>Ateliers</h4>
            <ul>
              <li><button onClick={() => scrollToSection('collections')}>Collections</button></li>
              <li><button onClick={() => scrollToSection('new-arrivals')}>New Arrivals</button></li>
              <li><button onClick={() => scrollToSection('brand-story')}>Artisanal Heritage</button></li>
              <li><button onClick={() => scrollToSection('contact')}>Concierge Inquiry</button></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4>Account & Access</h4>
            <ul>
              <li><button onClick={handleLoginClick}>Login to Account</button></li>
              <li><button onClick={handleSignUpClick}>Create Account</button></li>
              <li><button onClick={() => scrollToSection('contact')}>Submit Inquiry</button></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">&copy; {new Date().getFullYear()} SRILU FASHION HUB. ALL RIGHTS RESERVED.</p>
          <p className="footer-motto">ELEGANCE REDEFINED • STYLE PERFECTED</p>
        </div>
      </footer>

      {/* VIP Circle Subscription Success Modal */}
      {vipSuccessModalOpen && (
        <div className="auth-modal-backdrop" onClick={() => setVipSuccessModalOpen(false)}>
          <div className="auth-modal-card text-center" style={{ maxWidth: '460px', padding: '36px 28px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.15)', border: '2px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <Check size={34} color="#D4AF37" />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#F9F6F0', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
              ✓ Welcome to Club Privé
            </h3>
            <p style={{ fontSize: '13px', color: '#A0A0AB', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              You are now part of the SRILU private circle.
            </p>

            <div style={{ backgroundColor: '#0D0D11', borderRadius: '10px', padding: '16px 20px', textAlign: 'left', border: '1px solid rgba(212,175,55,0.25)', marginBottom: '24px' }}>
              <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>
                Exclusive VIP Benefits Include:
              </span>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#E4E4E7' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#D4AF37' }}>•</span> Early collection access
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#D4AF37' }}>•</span> Exclusive offers & trunk shows
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#D4AF37' }}>•</span> Private launch invitations
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#D4AF37' }}>•</span> Seasonal haute couture lookbooks
                </li>
              </ul>
            </div>

            <button
              onClick={() => setVipSuccessModalOpen(false)}
              className="btn-hero-primary"
              style={{ width: '100%', justifyContent: 'center', height: '48px' }}
            >
              Continue Exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;