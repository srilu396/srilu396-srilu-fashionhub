import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link import

const UserLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    '/images/fashion1.jpg',
    '/images/fashion2.jpg',
    '/images/fashion3.jpg',
    '/images/fashion4.jpg',
    '/images/fashion5.jpg'
  ];

  // Auto slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Only proceed with login if it's login mode
      if (!isLogin) {
        // Handle registration
        const endpoint = '/api/users/register';
        const payload = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        };

        console.log('📤 Sending registration request to:', endpoint);
        
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log('📥 Registration response:', data);

        if (data.success) {
          console.log('✅ Registration successful');
          alert('🎉 Registration successful! Please login with your credentials.');
          setIsLogin(true);
          // Clear form
          setFormData({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: ''
          });
        } else {
          setError(data.message || 'Registration failed');
        }
        return; // Stop execution after registration
      }

      // Handle login
      console.log('🚀 Starting login process...');
      const endpoint = '/api/users/login';
      const payload = { 
        email: formData.email, 
        password: formData.password 
      };

      console.log('📤 Sending login request to:', endpoint);
      console.log('📦 Login payload:', payload);

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📥 Login response from server:', data);

      // Check if login was successful
      if (data.success && data.token && data.user) {
        console.log('✅ Login successful!');
        console.log('🔐 Token received:', data.token);
        console.log('👤 User data:', data.user);

        // Store authentication data directly in localStorage
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Verify storage
        const storedToken = localStorage.getItem('userToken');
        const storedUser = localStorage.getItem('user');
        
        console.log('💾 Verification - Token stored:', !!storedToken);
        console.log('💾 Verification - User stored:', !!storedUser);

        if (storedToken && storedUser) {
          console.log('🔄 Navigating to user dashboard...');
          // Navigate to dashboard after successful login
          navigate('/user/dashboard');
        } else {
          setError('Failed to store authentication data');
        }
      } else {
        // Login failed
        console.log('❌ Login failed:', data.message);
        setError(data.message || 'Login failed. Please check your credentials.');
      }

    } catch (err) {
      console.error('❌ Request failed:', err);
      setError('Network error. Please check if server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Playfair Display', 'Cormorant Garamond', serif;
          background: #1C1C1C;
        }

        /* Back Button Styles - ADDED */
        .back-button {
          position: absolute;
          top: 30px;
          left: 30px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: rgba(28, 28, 28, 0.8);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          color: #D4AF37;
          text-decoration: none;
          font-size: 1.1rem;
          font-weight: 500;
          transition: all 0.3s ease;
          font-family: 'Playfair Display', serif;
          cursor: pointer;
        }

        .back-button:hover {
          background: rgba(28, 28, 28, 0.9);
          border-color: #D4AF37;
          transform: translateX(-5px);
          box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3);
        }

        .back-icon {
          font-size: 1.3rem;
        }

        /* Background Slideshow */
        .login-background {
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
          background: linear-gradient(
            135deg,
            rgba(28, 28, 28, 0.9) 0%,
            rgba(75, 28, 47, 0.7) 50%,
            rgba(212, 175, 55, 0.4) 100%
          );
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
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        .element-1 {
          width: 100px;
          height: 100px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .element-2 {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .element-3 {
          width: 80px;
          height: 80px;
          bottom: 20%;
          left: 20%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.6;
          }
        }

        /* Center Container */
        .login-center-container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1200px;
          padding: 2rem;
        }

        .login-content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem 0;
        }

        /* Luxury Header */
        .luxury-header {
          text-align: center;
          margin-bottom: 3rem;
          animation: fadeInUp 1s ease-out;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .logo-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1C1C1C;
          font-weight: bold;
          font-size: 1.2rem;
          font-family: 'Cormorant Garamond', serif;
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
        }

        .brand-title {
          color: #D4AF37;
          font-size: 3.5rem;
          font-weight: 600;
          margin: 0;
          font-family: 'Cormorant Garamond', serif;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .brand-tagline {
          color: #F5F5F5;
          font-size: 1.2rem;
          opacity: 0.9;
          font-style: italic;
          margin: 0;
        }

        /* Auth Card */
        .auth-card {
          background: rgba(28, 28, 28, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 20px;
          padding: 3rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(212, 175, 55, 0.1);
          animation: slideInUp 1s ease-out 0.3s both;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .auth-title {
          color: #D4AF37;
          font-size: 2.2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-family: 'Cormorant Garamond', serif;
        }

        .auth-subtitle {
          color: #F5F5F5;
          opacity: 0.8;
          font-size: 1rem;
          margin: 0;
        }

        /* Error Message */
        .error-message {
          background: rgba(75, 28, 47, 0.3);
          color: #ff6b6b;
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          border: 1px solid #4B1C2F;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: shake 0.5s ease-in-out;
        }

        .error-icon {
          font-size: 1.2rem;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* Auth Form */
        .auth-form {
          margin-bottom: 2rem;
        }

        .name-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .form-input {
          width: 100%;
          padding: 1.2rem 1.2rem 1.2rem 3rem;
          background: rgba(245, 245, 245, 0.08);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          color: #F5F5F5;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-family: 'Playfair Display', serif;
        }

        .form-input:focus {
          outline: none;
          border-color: #D4AF37;
          background: rgba(245, 245, 245, 0.12);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
          transform: translateY(-2px);
        }

        .form-input::placeholder {
          color: rgba(245, 245, 245, 0.6);
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #D4AF37;
          font-size: 1.1rem;
        }

        /* Auth Button */
        .auth-button {
          width: 100%;
          padding: 1.2rem;
          background: linear-gradient(135deg, #D4AF37, #F7E7CE);
          color: #1C1C1C;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Playfair Display', serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .auth-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .auth-button:hover:not(.loading)::before {
          left: 100%;
        }

        .auth-button:hover:not(.loading) {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(212, 175, 55, 0.4);
        }

        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .button-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid #1C1C1C;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Auth Switch */
        .auth-switch {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-switch p {
          color: #F5F5F5;
          opacity: 0.8;
          margin: 0;
        }

        .switch-link {
          color: #D4AF37;
          cursor: pointer;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
        }

        .switch-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: #D4AF37;
          transition: width 0.3s ease;
        }

        .switch-link:hover::after {
          width: 100%;
        }

        .switch-link:hover {
          color: #F7E7CE;
        }

        /* Luxury Features */
        .luxury-features {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          border-top: 1px solid rgba(212, 175, 55, 0.2);
          padding-top: 2rem;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #F5F5F5;
          opacity: 0.8;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .feature:hover {
          opacity: 1;
          color: #D4AF37;
          transform: translateY(-2px);
        }

        .feature-icon {
          font-size: 1rem;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .login-center-container {
            padding: 1rem;
          }

          .brand-title {
            font-size: 2.5rem;
          }

          .auth-card {
            padding: 2rem;
            margin: 1rem;
          }

          .name-fields {
            grid-template-columns: 1fr;
          }

          .luxury-features {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .brand-logo {
            flex-direction: column;
            gap: 0.5rem;
          }

          /* Responsive back button */
          .back-button {
            top: 20px;
            left: 20px;
            padding: 0.8rem 1.2rem;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .brand-title {
            font-size: 2rem;
          }

          .auth-card {
            padding: 1.5rem;
          }

          .auth-title {
            font-size: 1.8rem;
          }

          /* Responsive back button */
          .back-button {
            top: 15px;
            left: 15px;
            padding: 0.7rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>

      <div className="login-container">
        {/* Back to Home Button - ADDED */}
        <Link to="/" className="back-button">
          <span className="back-icon">←</span>
          Back to Home
        </Link>

        {/* Background Slideshow */}
        <div className="login-background">
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
          
          {/* Luxury Brand Elements */}
          <div className="luxury-elements">
            <div className="floating-element element-1"></div>
            <div className="floating-element element-2"></div>
            <div className="floating-element element-3"></div>
          </div>
        </div>
        
        {/* Center Aligned Form */}
        <div className="login-center-container">
          <div className="login-content-wrapper">
            {/* Luxury Brand Header */}
            <div className="luxury-header">
              <div className="brand-logo">
                <div className="logo-icon">SFH</div>
                <h1 className="brand-title">SriluFashionHub</h1>
              </div>
              <p className="brand-tagline">Where Luxury Meets Elegance</p>
            </div>

            {/* Auth Card */}
            <div className="auth-card">
              <div className="auth-header">
                <h2 className="auth-title">
                  {isLogin ? 'Welcome Back' : 'Join Our Luxury Community'}
                </h2>
                <p className="auth-subtitle">
                  {isLogin 
                    ? 'Sign in to access your exclusive collections' 
                    : 'Create your account and discover luxury fashion'
                  }
                </p>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                {!isLogin && (
                  <div className="name-fields">
                    <div className="form-group">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                      <span className="input-icon">👤</span>
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                      <span className="input-icon">👤</span>
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div className="form-group">
                    <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                    <span className="input-icon">🎯</span>
                  </div>
                )}

                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                  <span className="input-icon">✉</span>
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="form-input"
                    minLength="6"
                  />
                  <span className="input-icon">🔒</span>
                </div>

                <button 
                  type="submit" 
                  className={`auth-button ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="button-spinner"></div>
                      Please Wait...
                    </>
                  ) : (
                    isLogin ? 'Sign In to Luxury' : 'Create Luxury Account'
                  )}
                </button>
              </form>

              <div className="auth-switch">
                <p>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span 
                    className="switch-link"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Create One' : 'Sign In'}
                  </span>
                </p>
              </div>

              {/* Luxury Features */}
              <div className="luxury-features">
                <div className="feature">
                  <span className="feature-icon">⭐</span>
                  <span>Exclusive Collections</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🚚</span>
                  <span>Premium Delivery</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">💎</span>
                  <span>Luxury Experience</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserLogin;