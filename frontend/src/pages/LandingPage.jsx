import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  //navigation hook
  const navigate = useNavigate();

  // Form state(MongoDB connection)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const backgroundImages = [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
  ];

  useEffect(() => {
    setIsLoaded(true);
    
    const imageInterval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);

    return () => clearInterval(imageInterval);
  }, [backgroundImages.length]);

  const handleAdminClick = () => {
    navigate('/admin/login');
  };

  const handleUserClick = () => {
    navigate('/user/login');
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    // Scroll to section
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

   const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        // Reset form
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

  return (
    <div className="landing-page">
      {/* Background Images */}
      <div className="background-container">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`background-slide ${index === currentImage ? 'active' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="background-overlay"></div>
      </div>

      {/* Main Content */}
      <div className={`content ${isLoaded ? 'loaded' : ''}`}>
        {/* Header with Navigation */}
        <header className="header">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-container">
                <div className="logo-text">
                  <h1 className="logo-main">SriluFashionHub</h1>
                  <div className="logo-underline"></div>
                </div>
              </div>
              <p className="tagline">Where Elegance Meets Expression</p>
            </div>
            
            {/* Navigation */}
            <nav className="luxury-nav">
              <button 
                className={`nav-item ${activeSection === 'home' ? 'active' : ''}`}
                onClick={() => handleNavigation('home')}
              >
                Home
              </button>
              <button 
                className={`nav-item ${activeSection === 'collections' ? 'active' : ''}`}
                onClick={() => handleNavigation('collections')}
              >
                Collections
              </button>
              <button 
                className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}
                onClick={() => handleNavigation('about')}
              >
                About
              </button>
              <button 
                className={`nav-item ${activeSection === 'contact' ? 'active' : ''}`}
                onClick={() => handleNavigation('contact')}
              >
                Contact
              </button>
            </nav>
          </div>
        </header>

        {/* Home Section */}
        <section id="home" className="main-section">
          <div className="hero-content">
            <div className="text-content">
              <h2 className="welcome-text">
                <span className="text-part">Exclusive</span>
                <span className="text-part">Fashion</span>
                <span className="text-part">For Women</span>
              </h2>
              <p className="description">
                Discover the epitome of luxury and style with our curated collection 
                of premium fashion. Experience bespoke designs that celebrate the 
                modern woman's elegance and sophistication. From stunning evening 
                gowns to chic casual wear, we bring you the finest fashion experience.
              </p>
            </div>

            {/* Stats Section */}
            <div className="stats-container">
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Exclusive Designs</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Countries Served</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Happy Customers</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5 Star</div>
                <div className="stat-label">Premium Rating</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="button-container">
              <button className="btn btn-admin" onClick={handleAdminClick}>
                <span className="btn-text">Admin Portal</span>
                <div className="btn-shine"></div>
              </button>
              
              <button className="btn btn-user" onClick={handleUserClick}>
                <span className="btn-text">Explore Collection</span>
                <div className="btn-shine"></div>
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <h2 className="section-title">Why Choose SriluFashionHub?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">Q</div>
              <h3>Premium Quality</h3>
              <p>Handpicked luxury fabrics and materials with exceptional craftsmanship that stands the test of time</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">D</div>
              <h3>Exclusive Designs</h3>
              <p>Unique patterns crafted by world-renowned fashion designers, ensuring you stand out elegantly</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">S</div>
              <h3>Global Delivery</h3>
              <p>Worldwide shipping with premium luxury packaging and personalized delivery experience</p>
            </div>
            
          </div>
        </section>

        {/* Collections Section */}
        <section id="collections" className="collection-preview">
          <h2 className="section-title">New Arrivals Collection</h2>
          <p className="section-subtitle">Discover our latest luxury pieces crafted for the modern woman</p>
          <div className="collection-grid">
            <div className="collection-item">
              <div className="item-icon">G</div>
              <h4>Evening Gowns</h4>
              <p>Stunning dresses for special occasions and red carpet events</p>
              <div className="collection-badge">NEW</div>
            </div>
            <div className="collection-item">
              <div className="item-icon">C</div>
              <h4>Casual Wear</h4>
              <p>Chic everyday fashion collection with premium comfort</p>
              <div className="collection-badge">TRENDING</div>
            </div>
            <div className="collection-item">
              <div className="item-icon">T</div>
              <h4>Traditional</h4>
              <p>Elegant ethnic wear collection with modern touches</p>
              <div className="collection-badge">POPULAR</div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="about-section">
          <div className="about-content">
            <h2 className="section-title">About SriluFashionHub</h2>
            <div className="about-grid">
              <div className="about-text">
                <h3>Our Story</h3>
                <p>
                  SriluFashionHub was born from a passion for luxury fashion and a commitment 
                  to empowering women through style. Founded in 2020, we have quickly become 
                  a leading destination for sophisticated women seeking exclusive, high-quality 
                  fashion that combines traditional elegance with contemporary design.
                </p>
                <p>
                  Our team of expert designers and fashion consultants work tirelessly to 
                  curate collections that celebrate femininity, confidence, and individuality. 
                  Each piece in our collection is carefully selected to ensure it meets our 
                  standards of quality, comfort, and style.
                </p>
                <div className="mission-vision">
                  <div className="mission">
                    <h4>Our Mission</h4>
                    <p>To empower women through luxury fashion that celebrates their unique beauty and confidence.</p>
                  </div>
                  <div className="vision">
                    <h4>Our Vision</h4>
                    <p>To be the world's most trusted luxury fashion destination for sophisticated women.</p>
                  </div>
                </div>
              </div>
              <div className="about-stats">
                <div className="about-stat">
                  <div className="stat-value">3+</div>
                  <div className="stat-label">Years of Excellence</div>
                </div>
                <div className="about-stat">
                  <div className="stat-value">100+</div>
                  <div className="stat-label">Design Partners</div>
                </div>
                <div className="about-stat">
                  <div className="stat-value">98%</div>
                  <div className="stat-label">Customer Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact-section">
      <div className="contact-content">
        <h2 className="section-title">Get In Touch</h2>
        <p className="section-subtitle">We'd love to hear from you. Reach out to us for any inquiries.</p>
        
        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="status-message success">
            ✅ Message sent successfully! We'll get back to you soon.
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="status-message error">
            ❌ Failed to send message. Please try again.
          </div>
        )}

        <div className="contact-grid">
          <div className="contact-info">
            <h3>Contact Information</h3>
            <div className="contact-item">
              <strong>Email:</strong>
              <p>info@srilufashionhub.com</p>
            </div>
            <div className="contact-item">
              <strong>Phone:</strong>
              <p>+91 9391207207</p>
            </div>
            <div className="contact-item">
              <strong>Address:</strong>
              <p>Luxury Fashion District<br />Pitapuram, Kakinada</p>
            </div>
            <div className="contact-item">
              <strong>Business Hours:</strong>
              <p>Monday - Friday: 9:00 AM - 6:00 PM<br />Saturday: 10:00 AM - 4:00 PM</p>
            </div>
          </div>
          <div className="contact-form">
            <h3>Send us a Message</h3>
            <form className="message-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input 
                  type="text" 
                  name="name"
                  placeholder="Your Name" 
                  className="form-input" 
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <input 
                  type="email" 
                  name="email"
                  placeholder="Your Email" 
                  className="form-input" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <input 
                  type="text" 
                  name="subject"
                  placeholder="Subject" 
                  className="form-input" 
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <textarea 
                  name="message"
                  placeholder="Your Message" 
                  rows="5" 
                  className="form-textarea"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="btn btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Contact Us</h4>
              <p>Email: info@srilufashionhub.com</p>
              <p>Phone: +91 9391207207</p>
              <p>Address: Luxury Fashion District, Pitapuram, Kakinada</p>
            </div>
            <div className="footer-section">
              <h4>Follow Us</h4>
              <p>Instagram | Facebook | Pinterest</p>
              <p>#SriluFashionHub #LuxuryFashion</p>
              <p>Join our VIP membership program</p>
            </div>
            <div className="footer-section">
              <h4>Services</h4>
              <p>Free Shipping Over $200</p>
              <p>Easy Returns & Exchanges</p>
              <p>Luxury Gift Wrapping</p>
              <p>Personal Styling Sessions</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 SriluFashionHub. All rights reserved.</p>
            <p className="footer-motto">Elegance Redefined, Style Perfected</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;