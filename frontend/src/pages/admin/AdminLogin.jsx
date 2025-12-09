import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    '/images/admin/admin-bg.jpg',
    '/images/admin/admin-bg.jpg',
    '/images/admin/admin-bg.jpg',
    '/images/admin/admin-bg.jpg',
    '/images/admin/admin-bg.jpg'
  ];

  // Auto slideshow effect - Fixed version
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
      // Simulate API call - replace with actual authentication
      setTimeout(() => {
        if (formData.email === 'admin@srilufashionhub.com' && formData.password === 'SriluF@sh1on@2024!') {
          // Use the auth context login function instead of direct localStorage
          const mockUser = {
            id: 1,
            name: 'Admin User',
            email: formData.email,
            role: 'admin'
          };
          
          loginAdmin(mockUser, 'authenticated'); // Use the auth context
          navigate('/admin/dashboard');
        } else {
          setError('Invalid admin credentials. Please try again.');
        }
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Inline styles
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
      background: '#1C1C1C',
    },
    // ADD THIS BACK BUTTON STYLE:
    backButton: {
      position: 'absolute',
      top: '30px',
      left: '30px',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '0.8rem',
      background: 'rgba(28, 28, 28, 0.8)',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(212, 175, 55, 0.3)',
      borderRadius: '12px',
      padding: '1rem 1.5rem',
      color: '#D4AF37',
      textDecoration: 'none',
      fontSize: '1.1rem',
      fontWeight: 500,
      transition: 'all 0.3s ease',
      fontFamily: "'Playfair Display', serif",
      cursor: 'pointer',
    },
    background: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
    },
    slideshowContainer: {
      position: 'relative',
      width: '100%',
      height: '100%',
    },
    slide: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: 0,
      transform: 'scale(1.1)',
      transition: 'all 1.5s cubic-bezier(0.7, 0, 0.3, 1)',
    },
    activeSlide: {
      opacity: 1,
      transform: 'scale(1)',
    },
    slideOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, rgba(28, 28, 28, 0.95) 0%, rgba(75, 28, 47, 0.8) 50%, rgba(1, 68, 33, 0.6) 100%)',
    },
    luxuryElements: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    },
    floatingElement: {
      position: 'absolute',
      border: '1px solid rgba(212, 175, 55, 0.4)',
      borderRadius: '50%',
      animation: 'float 8s ease-in-out infinite',
    },
    centerContainer: {
      position: 'relative',
      zIndex: 2,
      width: '100%',
      maxWidth: '1200px',
      padding: '2rem',
    },
    contentWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem 0',
    },
    luxuryHeader: {
      textAlign: 'center',
      marginBottom: '3rem',
      animation: 'fadeInUp 1s ease-out',
    },
    brandLogo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      marginBottom: '1.5rem',
    },
    logoIcon: {
      width: '70px',
      height: '70px',
      background: 'linear-gradient(135deg, #D4AF37, #F7E7CE)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#1C1C1C',
      fontWeight: 'bold',
      fontSize: '1.4rem',
      fontFamily: "'Cormorant Garamond', serif",
      boxShadow: '0 15px 35px rgba(212, 175, 55, 0.4)',
      border: '2px solid rgba(255, 255, 255, 0.1)',
    },
    brandTitle: {
      color: '#D4AF37',
      fontSize: '4rem',
      fontWeight: 600,
      margin: 0,
      fontFamily: "'Cormorant Garamond', serif",
      textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5)',
      letterSpacing: '2px',
    },
    brandTagline: {
      color: '#F5F5F5',
      fontSize: '1.4rem',
      opacity: 0.9,
      fontStyle: 'italic',
      margin: 0,
      letterSpacing: '1px',
    },
    authCard: {
      background: 'rgba(28, 28, 28, 0.9)',
      backdropFilter: 'blur(25px)',
      border: '1px solid rgba(212, 175, 55, 0.4)',
      borderRadius: '25px',
      padding: '3.5rem',
      width: '100%',
      maxWidth: '500px',
      boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(212, 175, 55, 0.2)',
      animation: 'slideInUp 1s ease-out 0.3s both',
      position: 'relative',
      overflow: 'hidden',
    },
    authCardBefore: {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #D4AF37, #4B1C2F, #014421, #001F3F)',
    },
    authHeader: {
      textAlign: 'center',
      marginBottom: '3rem',
    },
    authTitle: {
      color: '#D4AF37',
      fontSize: '2.5rem',
      fontWeight: 600,
      marginBottom: '0.5rem',
      fontFamily: "'Cormorant Garamond', serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
    },
    adminIcon: {
      fontSize: '2rem',
      background: 'linear-gradient(135deg, #D4AF37, #F7E7CE)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    authSubtitle: {
      color: '#F5F5F5',
      opacity: 0.8,
      fontSize: '1.1rem',
      margin: 0,
      fontWeight: 300,
    },
    errorMessage: {
      background: 'rgba(75, 28, 47, 0.4)',
      color: '#ff6b6b',
      padding: '1.2rem',
      borderRadius: '12px',
      marginBottom: '2rem',
      border: '1px solid #4B1C2F',
      display: 'flex',
      alignItems: 'center',
      gap: '0.8rem',
      animation: 'shake 0.5s ease-in-out',
      fontWeight: 500,
    },
    authForm: {
      marginBottom: '2.5rem',
    },
    formGroup: {
      position: 'relative',
      marginBottom: '2rem',
    },
    formInput: {
      width: '100%',
      padding: '1.4rem 1.4rem 1.4rem 3.5rem',
      background: 'rgba(245, 245, 245, 0.1)',
      border: '1px solid rgba(212, 175, 55, 0.3)',
      borderRadius: '15px',
      color: '#F5F5F5',
      fontSize: '1.1rem',
      transition: 'all 0.3s ease',
      fontFamily: "'Playfair Display', serif",
      backdropFilter: 'blur(10px)',
    },
    inputIcon: {
      position: 'absolute',
      left: '1.2rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#D4AF37',
      fontSize: '1.3rem',
      width: '24px',
      textAlign: 'center',
    },
    authButton: {
      width: '100%',
      padding: '1.4rem',
      background: 'linear-gradient(135deg, #D4AF37, #F7E7CE)',
      color: '#1C1C1C',
      border: 'none',
      borderRadius: '15px',
      fontSize: '1.2rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontFamily: "'Playfair Display', serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.8rem',
      position: 'relative',
      overflow: 'hidden',
      marginTop: '1rem',
      letterSpacing: '1px',
    },
    buttonSpinner: {
      width: '22px',
      height: '22px',
      border: '3px solid transparent',
      borderTop: '3px solid #1C1C1C',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    securityFeatures: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
      borderTop: '1px solid rgba(212, 175, 55, 0.3)',
      paddingTop: '2.5rem',
      marginTop: '2rem',
    },
    feature: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      color: '#F5F5F5',
      opacity: 0.9,
      fontSize: '0.95rem',
      transition: 'all 0.3s ease',
      padding: '0.8rem',
      borderRadius: '10px',
      background: 'rgba(255, 255, 255, 0.05)',
    },
    featureIcon: {
      fontSize: '1.2rem',
      width: '24px',
      textAlign: 'center',
    },
    adminAccessNote: {
      textAlign: 'center',
      marginTop: '2rem',
      padding: '1.5rem',
      background: 'rgba(1, 68, 33, 0.2)',
      borderRadius: '12px',
      border: '1px solid rgba(1, 68, 33, 0.4)',
    },
    adminNoteText: {
      color: '#F5F5F5',
      opacity: 0.8,
      fontSize: '0.9rem',
      margin: 0,
      lineHeight: 1.5,
    },
    demoCredentials: {
      color: '#D4AF37',
      fontSize: '0.9rem',
      textAlign: 'center',
      background: 'rgba(212, 175, 55, 0.1)',
      padding: '1rem',
      borderRadius: '8px',
      border: '1px solid rgba(212, 175, 55, 0.3)',
      marginTop: '1rem',
    },
  };

  return (
    <div style={styles.container}>
      {/* Global CSS as style tag */}
      <style>
        {`
          /* ADD HOVER EFFECT FOR BACK BUTTON */
          .back-button-hover:hover {
            background: rgba(28, 28, 28, 0.9) !important;
            border-color: #D4AF37 !important;
            transform: translateX(-5px) !important;
            box-shadow: 0 10px 25px rgba(212, 175, 55, 0.3) !important;
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
              opacity: 0.4;
            }
            50% {
              transform: translateY(-25px) rotate(180deg);
              opacity: 0.8;
            }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(60px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .form-input:focus {
            outline: none;
            border-color: #D4AF37 !important;
            background: rgba(245, 245, 245, 0.15) !important;
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15) !important;
            transform: translateY(-3px) !important;
          }

          .auth-button:hover:not(.loading)::before {
            left: 100%;
          }

          .auth-button:hover:not(.loading) {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(212, 175, 55, 0.5);
          }

          .auth-button:active {
            transform: translateY(-1px);
          }

          .feature:hover {
            opacity: 1;
            color: #D4AF37;
            transform: translateY(-2px);
            background: rgba(212, 175, 55, 0.1);
          }

          @media (max-width: 768px) {
            .brand-title { font-size: 3rem; }
            .admin-auth-card { padding: 2.5rem; margin: 1rem; }
            .security-features { grid-template-columns: 1fr; }
            .brand-logo { flex-direction: column; gap: 1rem; }
            .auth-title { font-size: 2.2rem; }
            .back-button { top: 20px; left: 20px; padding: 0.8rem 1.2rem; font-size: 1rem; }
          }

          @media (max-width: 480px) {
            .brand-title { font-size: 2.5rem; }
            .admin-auth-card { padding: 2rem; }
            .auth-title { font-size: 2rem; }
            .form-input { padding: 1.2rem 1.2rem 1.2rem 3rem; }
            .back-button { top: 15px; left: 15px; padding: 0.7rem 1rem; font-size: 0.9rem; }
          }
        `}
      </style>

      {/* ADD BACK TO HOME BUTTON HERE */}
      <Link 
        to="/" 
        style={styles.backButton}
        className="back-button-hover"
      >
        <span style={{ fontSize: '1.3rem' }}>←</span>
        Back to Home
      </Link>

      {/* Background Slideshow */}
      <div style={styles.background}>
        <div style={styles.slideshowContainer}>
          {slides.map((slide, index) => (
            <div
              key={index}
              style={{
                ...styles.slide,
                ...(index === currentSlide ? styles.activeSlide : {}),
                backgroundImage: `url(${slide})`
              }}
            >
              <div style={styles.slideOverlay}></div>
            </div>
          ))}
        </div>
        
        {/* Luxury Floating Elements */}
        <div style={styles.luxuryElements}>
          <div style={{...styles.floatingElement, width: '120px', height: '120px', top: '15%', left: '8%', animationDelay: '0s', borderColor: 'rgba(212, 175, 55, 0.5)'}}></div>
          <div style={{...styles.floatingElement, width: '180px', height: '180px', top: '65%', right: '8%', animationDelay: '2s', borderColor: 'rgba(1, 68, 33, 0.4)'}}></div>
          <div style={{...styles.floatingElement, width: '100px', height: '100px', bottom: '15%', left: '15%', animationDelay: '4s', borderColor: 'rgba(75, 28, 47, 0.4)'}}></div>
          <div style={{...styles.floatingElement, width: '140px', height: '140px', top: '25%', right: '15%', animationDelay: '6s', borderColor: 'rgba(0, 31, 63, 0.4)'}}></div>
        </div>
      </div>
      
      {/* Center Aligned Form */}
      <div style={styles.centerContainer}>
        <div style={styles.contentWrapper}>
          {/* Luxury Brand Header */}
          <div style={styles.luxuryHeader}>
            <div style={styles.brandLogo}>
              <div style={styles.logoIcon}>SFH</div>
              <h1 style={styles.brandTitle}>SriluFashionHub</h1>
            </div>
            <p style={styles.brandTagline}>Administrative Excellence</p>
          </div>

          {/* Admin Auth Card */}
          <div style={styles.authCard}>
            <div style={styles.authCardBefore}></div>
            <div style={styles.authHeader}>
              <h2 style={styles.authTitle}>
                <span style={styles.adminIcon}>⚡</span>
                Admin Portal
              </h2>
              <p style={styles.authSubtitle}>
                Secure access to store management dashboard
              </p>
            </div>

            {error && (
              <div style={styles.errorMessage}>
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.authForm}>
              <div style={styles.formGroup}>
                <input
                  type="email"
                  name="email"
                  placeholder="Admin Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={styles.formInput}
                  className="form-input"
                />
                <span style={styles.inputIcon}>👑</span>
              </div>

              <div style={styles.formGroup}>
                <input
                  type="password"
                  name="password"
                  placeholder="Admin Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={styles.formInput}
                  className="form-input"
                  minLength="6"
                />
                <span style={styles.inputIcon}>🔐</span>
              </div>

              <button 
                type="submit" 
                style={{
                  ...styles.authButton,
                  ...(loading ? { opacity: 0.7, cursor: 'not-allowed', transform: 'none' } : {})
                }}
                disabled={loading}
                className="auth-button"
              >
                {loading ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🚀</span>
                    Access Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div style={styles.demoCredentials}>
              <strong>Demo Credentials:</strong><br />
              Email: admin@srilufashionhub.com<br />
              Password: SriluF@sh1on@2024!
            </div>

            {/* Security Features */}
            <div style={styles.securityFeatures}>
              <div style={styles.feature} className="feature">
                <span style={styles.featureIcon}>🔒</span>
                <span>Encrypted Connection</span>
              </div>
              <div style={styles.feature} className="feature">
                <span style={styles.featureIcon}>📊</span>
                <span>Real-time Analytics</span>
              </div>
              <div style={styles.feature} className="feature">
                <span style={styles.featureIcon}>🛡️</span>
                <span>Secure Access</span>
              </div>
              <div style={styles.feature} className="feature">
                <span style={styles.featureIcon}>📈</span>
                <span>Performance Metrics</span>
              </div>
            </div>

            {/* Admin Access Note */}
            <div style={styles.adminAccessNote}>
              <p style={styles.adminNoteText}>
                <span style={{color: '#D4AF37', fontWeight: 600}}>Note:</span> This portal is restricted to authorized personnel only. 
                All activities are monitored and logged for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;