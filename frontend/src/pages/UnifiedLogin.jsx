import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, Mail, User, Sparkles, ArrowLeft, Eye, EyeOff, 
  CheckCircle2, KeyRound, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './UnifiedLogin.css';

const FASHION_IMAGES = [
  {
    url: 'https://i.pinimg.com/736x/e8/42/8b/e8428b9adc8993510dd1e14aa485ca06.jpg',
    tag: 'HAUTE COUTURE 2026',
    quote: 'Elegance is not standing out, but being remembered.'
  },
  {
    url: 'https://i.pinimg.com/474x/10/c1/da/10c1dad00f2ce98aacb318e1d3ed897d.jpg',
    tag: 'GENTLEMEN ATELIER',
    quote: 'Refined craftsmanship for the modern icon.'
  },
  {
    url: 'https://i.pinimg.com/736x/17/43/78/174378e153f70bab6cfab3331cc33693.jpg',
    tag: 'INDIAN HERITAGE LUXURY',
    quote: 'Bespoke designs crafted with passion & precision.'
  }
];

const UnifiedLogin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginAdmin, loginUser } = useAuth();

  // Active Mode: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('login');
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Ensure admin dark/light mode attribute does not pollute auth page
    document.documentElement.removeAttribute('data-theme');

    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'signup') {
      setActiveTab('signup');
    } else if (params.get('tab') === 'login') {
      setActiveTab('login');
    }
  }, [location]);

  // Preload fashion images and run continuous cross-fade slideshow
  useEffect(() => {
    FASHION_IMAGES.forEach((img) => {
      const preload = new Image();
      preload.src = img.url;
    });

    const timer = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % FASHION_IMAGES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setForgotModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot Password State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Reset Code & Password, 3: Success Animation
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

    if (activeTab === 'signup') {
      // Validate confirm password
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        setLoading(false);
        return;
      }

      // Handle Registration
      try {
        const res = await fetch(`${API_BASE}/api/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username || formData.email.split('@')[0],
            email: formData.email,
            password: formData.password
          })
        });

        const data = await res.json();

        if (data.success && data.token && data.user) {
          setSuccessMsg('Account created successfully! Redirecting...');
          setTimeout(() => {
            loginUser(data.user, data.token);
            navigate('/user/dashboard');
          }, 800);
        } else {
          setError(data.message || 'Registration failed. Please check your details.');
        }
      } catch (err) {
        console.error('Registration error:', err);
        setError('Unable to connect to server. Please check network connection.');
      } finally {
        setLoading(false);
      }
    } else {
      // Handle Login
      try {
        const res = await fetch(`${API_BASE}/api/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await res.json();

        if (data.success && data.token && data.user) {
          const userRole = data.user.role;
          setSuccessMsg('Welcome back! Redirecting...');
          
          setTimeout(() => {
            if (userRole === 'admin') {
              loginAdmin(data.user, data.token);
              navigate('/admin/dashboard');
            } else {
              loginUser(data.user, data.token);
              navigate('/user/dashboard');
            }
          }, 800);
        } else {
          setError(data.message || 'Invalid email or password.');
        }
      } catch (err) {
        console.error('Login error:', err);
        setError('Unable to connect to server. Please check network connection.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Forgot Password step 1: Request code
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isAdmin || res.status === 403) {
          setForgotError(data.message || 'Admin password reset requires main administrator authorization.');
        } else {
          setForgotError(data.message || 'Failed to generate reset code.');
        }
        return;
      }

      setForgotSuccess(`Reset code sent to ${forgotEmail}. Reset Code: ${data.resetToken}`);
      setResetToken(data.resetToken || '');
      setForgotStep(2);
    } catch (err) {
      console.error('Forgot password error:', err);
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password step 2: Reset Password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (newPassword !== forgotConfirmPassword) {
      setForgotError('New Password and Confirm Password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    setForgotLoading(true);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const res = await fetch(`${API_BASE}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          token: resetToken,
          newPassword: newPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        setForgotStep(3); // Transition to luxury success animation screen
      } else {
        setForgotError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const currentImage = FASHION_IMAGES[imageIndex];

  return (
    <div className="auth-page-root">
      {/* Background ambient glow */}
      <div className="auth-glow-top" />
      <div className="auth-glow-bottom" />

      {/* Return Button */}
      <Link to="/" className="auth-back-btn">
        <ArrowLeft size={16} />
        <span>Return to Storefront</span>
      </Link>

      {/* Main Luxury Split Panel */}
      <div className="auth-main-container">
        {/* LEFT COLUMN: Editorial Visual Panel */}
        <div className="auth-left-col">
          <div className="auth-editorial-wrapper">
            {/* Double Champagne Outer & Inner Borders */}
            <div className="auth-gallery-outer-border" />
            <div className="auth-gallery-inner-border" />
            
            {/* Main Architectural Cathedral Gallery Image Frame */}
            <div className="auth-image-frame">
              {/* Corner Gold Accent Art */}
              <div className="auth-corner-accent top-left" />
              <div className="auth-corner-accent top-right" />
              <div className="auth-corner-accent bottom-left" />
              <div className="auth-corner-accent bottom-right" />

              {/* Smooth Cross-Fading Fashion Image Stack (Zero Blank Flash) */}
              {FASHION_IMAGES.map((img, idx) => (
                <motion.img
                  key={idx}
                  src={img.url}
                  alt="SRILU Luxury Fashion"
                  className="auth-fashion-image"
                  initial={false}
                  animate={{ 
                    opacity: idx === imageIndex ? 1 : 0, 
                    scale: idx === imageIndex ? 1 : 1.06 
                  }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    zIndex: idx === imageIndex ? 2 : 1
                  }}
                />
              ))}
              <div className="auth-image-overlay" />

              {/* Top Luxury Branding Header */}
              <div className="auth-editorial-header">
                <div className="auth-eyebrow-wrapper">
                  <span className="auth-eyebrow-diamond">✦</span>
                  <span className="auth-brand-eyebrow">PARIS • MUMBAI • NEW YORK</span>
                  <span className="auth-eyebrow-diamond">✦</span>
                </div>
                <h2 className="auth-brand-tagline">
                  Haute Couture.<br />
                  <span className="auth-tagline-gold">Redefined Elegance.</span>
                </h2>
                <p className="auth-brand-description">
                  Crafted for those who set the rhythm of the room with quiet confidence.
                </p>
              </div>

              {/* Bottom Glass Quote & Trust Card */}
              <div className="auth-quote-card">
                <div className="auth-quote-tag-row">
                  <span className="auth-image-tag">{currentImage.tag}</span>
                  <div className="auth-dots-indicator">
                    {FASHION_IMAGES.map((_, idx) => (
                      <span
                        key={idx}
                        className={`auth-dot ${idx === imageIndex ? 'active' : ''}`}
                        onClick={() => setImageIndex(idx)}
                      />
                    ))}
                  </div>
                </div>
                <p className="auth-quote-text">"{currentImage.quote}"</p>
                <div className="auth-trust-statement">
                  <ShieldCheck size={15} style={{ color: '#D4AF37' }} />
                  <span>SRILU Bespoke Atelier • Couture Privé</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Luxury Form Card (Narrow Restraint) */}
        <div className="auth-right-col">
          <div className="auth-form-card">
            {/* Header */}
            <div className="auth-brand-header">
              <div className="auth-logo-badge">
                <span>S</span>
              </div>
              <h1 className="auth-title">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="auth-subtitle">
                {activeTab === 'login' 
                  ? 'Sign in to continue your journey.' 
                  : 'Join our private couture atelier.'}
              </p>
            </div>

            {/* Tab Bar */}
            <div className="auth-tab-bar">
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
              >
                Create Account
              </button>
            </div>

            {/* Notifications */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="auth-alert-error"
              >
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="auth-alert-success"
              >
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="auth-form-stack">
              {activeTab === 'signup' && (
                <>
                  <div className="auth-grid-2col">
                    <div className="auth-input-group">
                      <label className="auth-label">First Name</label>
                      <div className="auth-input-wrapper">
                        <User size={16} className="auth-input-icon" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Sophia"
                          required
                          className="auth-input"
                        />
                      </div>
                    </div>
                    <div className="auth-input-group">
                      <label className="auth-label">Last Name</label>
                      <div className="auth-input-wrapper">
                        <User size={16} className="auth-input-icon" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Laurent"
                          required
                          className="auth-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-label">Username</label>
                    <div className="auth-input-wrapper">
                      <Sparkles size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="sophia_laurent"
                        required
                        className="auth-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="auth-input-group">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label className="auth-label">Password</label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setForgotModalOpen(true); setForgotStep(1); setForgotError(''); setForgotSuccess(''); }}
                      className="auth-forgot-link"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    required
                    className="auth-input"
                    style={{ paddingRight: '40px' }}
                    autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-eye-btn"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {activeTab === 'signup' && (
                <div className="auth-input-group">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••••••"
                      required
                      className="auth-input"
                      style={{ paddingRight: '40px' }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="auth-eye-btn"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
              >
                <span>
                  {loading 
                    ? (activeTab === 'signup' ? 'Creating Account...' : 'Authenticating...') 
                    : (activeTab === 'signup' ? 'Create Account' : 'Sign In')}
                </span>
                <ArrowRight size={16} />
              </button>

              {/* Switch Prompt Footer */}
              <div className="auth-switch-prompt">
                {activeTab === 'login' ? (
                  <>
                    <span>Don't have an account?</span>
                    <button
                      type="button"
                      className="auth-switch-btn"
                      onClick={() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
                    >
                      Create Account
                    </button>
                  </>
                ) : (
                  <>
                    <span>Already have an account?</span>
                    <button
                      type="button"
                      className="auth-switch-btn"
                      onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="auth-modal-backdrop" onClick={() => setForgotModalOpen(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <h3 className="auth-modal-title">
                {forgotStep === 1 ? 'Password Recovery' : (forgotStep === 2 ? 'Set New Password' : 'Account Security Updated')}
              </h3>
              <button onClick={() => setForgotModalOpen(false)} className="auth-modal-close">×</button>
            </div>

            {forgotError && <div className="auth-alert-error">{forgotError}</div>}
            {forgotSuccess && <div className="auth-alert-success">{forgotSuccess}</div>}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequest} className="auth-form-stack">
                <p className="auth-modal-desc">
                  Enter your registered email address to receive password reset instructions.
                </p>
                <div className="auth-input-group">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="auth-input"
                    />
                  </div>
                </div>
                <button type="submit" disabled={forgotLoading} className="auth-submit-btn">
                  {forgotLoading ? 'Verifying Account...' : 'Send Reset Code'}
                </button>
              </form>
            ) : forgotStep === 2 ? (
              <form onSubmit={handleResetSubmit} className="auth-form-stack">
                <p className="auth-modal-desc">
                  Enter the 6-digit reset code along with your new password.
                </p>
                <div className="auth-input-group">
                  <label className="auth-label">6-Digit Reset Code</label>
                  <div className="auth-input-wrapper">
                    <KeyRound size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="123456"
                      required
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">New Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showForgotNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={6}
                      className="auth-input"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                      className="auth-eye-btn"
                      aria-label="Toggle password visibility"
                    >
                      {showForgotNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">Confirm New Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showForgotConfirmPass ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      minLength={6}
                      className="auth-input"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                      className="auth-eye-btn"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showForgotConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {forgotConfirmPassword && (
                    <span style={{ fontSize: '11px', marginTop: '4px', color: newPassword === forgotConfirmPassword ? '#10B981' : '#EF4444' }}>
                      {newPassword === forgotConfirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                    </span>
                  )}
                </div>

                <button type="submit" disabled={forgotLoading} className="auth-submit-btn">
                  {forgotLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            ) : (
              /* Step 3: Success Animation Screen */
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10B981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}>
                  <CheckCircle2 size={36} color="#10B981" />
                </div>
                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F9F6F0', margin: '0 0 8px 0' }}>
                  Password Reset Successful
                </h4>
                <p style={{ fontSize: '13px', color: '#A0A0AB', margin: '0 0 20px 0' }}>
                  Your account security credentials have been updated. You may now sign in with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotStep(1);
                    setForgotEmail('');
                    setResetToken('');
                    setNewPassword('');
                    setForgotConfirmPassword('');
                    setActiveTab('login');
                  }}
                  className="auth-submit-btn"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedLogin;
