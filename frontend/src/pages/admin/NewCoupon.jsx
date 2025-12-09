import React, { useState, useEffect } from 'react';
import { couponAPI } from '../../utils/api';

const NewCoupon = () => {
  const [formData, setFormData] = useState({
    coupon_code: '',
    discount_type: 'percentage',
    discount_value: '',
    applicable_categories: [],
    min_cart_value: '',
    valid_from: '',
    valid_until: '',
    usage_limit_total: '',
    usage_limit_per_user: '1',
    active_status: true
  });

  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Set static categories
      const staticCategories = [
        { id: 1, name: "Dresses" },
        { id: 2, name: "Tops & Blouses" },
        { id: 3, name: "Jewelery" },
        { id: 4, name: "Footwear" },
        { id: 5, name: "Accessories" }
      ];
      setCategories(staticCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setMessage('❌ Failed to load categories');
      // Fallback to static categories
      const staticCategories = [
        { id: 1, name: "Dresses" },
        { id: 2, name: "Tops & Blouses" },
        { id: 3, name: "Jewelery" },
        { id: 4, name: "Footwear" },
        { id: 5, name: "Accessories" }
      ];
      setCategories(staticCategories);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, coupon_code: code });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await couponAPI.createCoupon(formData);
      setMessage('🎉 Coupon created successfully!');
      setFormData({
        coupon_code: '',
        discount_type: 'percentage',
        discount_value: '',
        applicable_categories: [],
        min_cart_value: '',
        valid_from: '',
        valid_until: '',
        usage_limit_total: '',
        usage_limit_per_user: '1',
        active_status: true
      });
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error creating coupon: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMultiSelect = (e, field) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, [field]: selected }));
  };

  return (
    <div style={styles.container}>
      {/* Animated Background Elements */}
      <div style={styles.animatedBackground}>
        <div style={styles.floatingOrbs}>
          <div style={styles.orb1}></div>
          <div style={styles.orb2}></div>
          <div style={styles.orb3}></div>
          <div style={styles.orb4}></div>
        </div>
        <div style={styles.particleContainer}>
          {[...Array(15)].map((_, i) => (
            <div key={i} style={styles.particle(i)}></div>
          ))}
        </div>
        <div style={styles.gradientOverlay}></div>
      </div>
      
      <div style={styles.glassContainer}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            <span style={styles.emoji}>🎫</span>
            <span style={styles.titleText}>Create New Coupon</span>
         </h1>
          <p style={styles.subtitle}>Design exclusive offers for your luxury fashion brand</p>
        </div>

        {message && (
          <div style={{
            ...styles.message,
            ...(message.includes('❌') ? styles.errorMessage : styles.successMessage)
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            {/* Coupon Code */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Coupon Code *</label>
              <div style={styles.codeInputGroup}>
                <input
                  type="text"
                  name="coupon_code"
                  value={formData.coupon_code}
                  onChange={handleChange}
                  placeholder="SUMMER25"
                  required
                  style={styles.input}
                />
                <button 
                  type="button" 
                  onClick={generateRandomCode}
                  style={styles.generateButton}
                  disabled={loading}
                >
                  🎲 Generate
                </button>
              </div>
            </div>

            {/* Discount Type */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Discount Type *</label>
              <select 
                name="discount_type" 
                value={formData.discount_type}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Discount Value *</label>
              <input
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                placeholder={formData.discount_type === 'percentage' ? '25' : '50'}
                min="0"
                max={formData.discount_type === 'percentage' ? '100' : ''}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Minimum Cart Value */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Minimum Cart Value</label>
              <input
                type="number"
                name="min_cart_value"
                value={formData.min_cart_value}
                onChange={handleChange}
                placeholder="0"
                min="0"
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Applicable Categories */}
            <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Applicable Categories</label>
              <select 
                multiple
                value={formData.applicable_categories}
                onChange={(e) => handleMultiSelect(e, 'applicable_categories')}
                style={{ ...styles.input, ...styles.multiSelect }}
                disabled={loading}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <small style={styles.helperText}>Hold Ctrl/Cmd to select multiple categories</small>
            </div>

            {/* Valid From */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Valid From *</label>
              <input
                type="datetime-local"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Valid Until */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Valid Until *</label>
              <input
                type="datetime-local"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Total Usage Limit */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Total Usage Limit</label>
              <input
                type="number"
                name="usage_limit_total"
                value={formData.usage_limit_total}
                onChange={handleChange}
                placeholder="Unlimited"
                min="0"
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Usage Per User */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Usage Per User</label>
              <input
                type="number"
                name="usage_limit_per_user"
                value={formData.usage_limit_per_user}
                onChange={handleChange}
                placeholder="1"
                min="1"
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.formActions}>
            <div style={styles.toggleGroup}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  name="active_status"
                  checked={formData.active_status}
                  onChange={handleChange}
                  style={styles.toggleInput}
                  disabled={loading}
                />
                <span style={formData.active_status ? styles.toggleSliderActive : styles.toggleSlider}></span>
                Active Status
              </label>
            </div>
            
            <button 
              type="submit" 
              style={{
                ...styles.createButton,
                ...(loading && styles.createButtonDisabled)
              }}
              disabled={loading}
            >
              {loading ? '⏳ Creating...' : '✨ Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: -1,
  },
  floatingOrbs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  orb1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatOrb1 8s ease-in-out infinite',
    filter: 'blur(40px)',
  },
  orb2: {
    position: 'absolute',
    top: '60%',
    right: '15%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(1, 68, 33, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatOrb2 12s ease-in-out infinite',
    filter: 'blur(50px)',
  },
  orb3: {
    position: 'absolute',
    bottom: '20%',
    left: '20%',
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(75, 28, 47, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatOrb3 10s ease-in-out infinite',
    filter: 'blur(35px)',
  },
  orb4: {
    position: 'absolute',
    top: '40%',
    right: '25%',
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(247, 231, 206, 0.05) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatOrb4 15s ease-in-out infinite',
    filter: 'blur(30px)',
  },
  particleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: (index) => ({
    position: 'absolute',
    width: `${Math.random() * 6 + 2}px`,
    height: `${Math.random() * 6 + 2}px`,
    background: `rgba(212, 175, 55, ${Math.random() * 0.3 + 0.1})`,
    borderRadius: '50%',
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    animation: `particleFloat ${Math.random() * 20 + 10}s linear infinite`,
    animationDelay: `${index * 0.5}s`,
  }),
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(28, 28, 28, 0.7) 0%, rgba(75, 28, 47, 0.3) 50%, rgba(212, 175, 55, 0.1) 100%)',
  },
  glassContainer: {
    background: 'rgba(28, 28, 28, 0.25)',
    backdropFilter: 'blur(25px)',
    border: '1px solid rgba(212, 175, 55, 0.15)',
    borderRadius: '24px',
    padding: '3rem',
    maxWidth: '1200px',
    margin: '0 auto',
    boxShadow: `
      0 25px 50px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.05)
    `,
    animation: 'glassEntrance 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem',
    color: '#F5F5F5',
    animation: 'slideDown 1s ease-out',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '3rem',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  emoji: {
    fontSize: '3rem',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
  },
  titleText: {
    background: 'linear-gradient(45deg, #D4AF37, #F7E7CE, #D4AF37)',
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'shimmer 3s ease-in-out infinite',
  },
  subtitle: {
    color: '#E5DCC3',
    fontSize: '1.2rem',
    opacity: '0.9',
    animation: 'fadeInUp 1s ease-out 0.3s both',
  },
  message: {
    padding: '1.2rem',
    borderRadius: '12px',
    marginBottom: '2rem',
    textAlign: 'center',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    animation: 'messageSlideIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    backdropFilter: 'blur(10px)',
  },
  successMessage: {
    background: 'linear-gradient(135deg, rgba(1, 68, 33, 0.3), rgba(0, 31, 63, 0.3))',
    color: '#F5F5F5',
    boxShadow: '0 8px 32px rgba(1, 68, 33, 0.3)',
  },
  errorMessage: {
    background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.3), rgba(75, 28, 47, 0.3))',
    color: '#F5F5F5',
    boxShadow: '0 8px 32px rgba(139, 0, 0, 0.3)',
  },
  form: {
    background: 'rgba(28, 28, 28, 0.4)',
    padding: '2.5rem',
    borderRadius: '20px',
    border: '1px solid rgba(212, 175, 55, 0.1)',
    animation: 'formSlideIn 1s ease-out 0.6s both',
    backdropFilter: 'blur(15px)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
    marginBottom: '2.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    animation: 'formFieldEntrance 0.8s ease-out',
  },
  label: {
    color: '#D4AF37',
    marginBottom: '0.8rem',
    fontWeight: '600',
    fontSize: '0.95rem',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  input: {
    background: 'rgba(245, 245, 245, 0.08)',
    border: '2px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '12px',
    padding: '1rem 1.2rem',
    color: '#F5F5F5',
    fontSize: '1rem',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    backdropFilter: 'blur(10px)',
  },
  multiSelect: {
    height: '140px',
    resize: 'vertical',
  },
  codeInputGroup: {
    display: 'flex',
    gap: '1rem',
  },
  generateButton: {
    background: 'linear-gradient(135deg, #D4AF37, #F7E7CE)',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    color: '#1C1C1C',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'relative',
    overflow: 'hidden',
  },
  helperText: {
    color: '#E5DCC3',
    fontSize: '0.85rem',
    marginTop: '0.8rem',
    opacity: '0.7',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '2.5rem',
    borderTop: '1px solid rgba(212, 175, 55, 0.15)',
    animation: 'fadeInUp 1s ease-out 0.8s both',
  },
  toggleGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    color: '#E5DCC3',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '1.1rem',
  },
  toggleInput: {
    display: 'none',
  },
  toggleSlider: {
    width: '60px',
    height: '30px',
    background: 'rgba(245, 245, 245, 0.1)',
    borderRadius: '30px',
    position: 'relative',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
  },
  toggleSliderActive: {
    width: '60px',
    height: '30px',
    background: 'rgba(212, 175, 55, 0.3)',
    borderRadius: '30px',
    position: 'relative',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    border: '1px solid rgba(212, 175, 55, 0.5)',
    boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
  },
  createButton: {
    background: 'linear-gradient(135deg, #014421, #001F3F, #014421)',
    backgroundSize: '200% 200%',
    border: 'none',
    borderRadius: '16px',
    padding: '1.2rem 2.5rem',
    color: '#F5F5F5',
    fontSize: '1.2rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    position: 'relative',
    overflow: 'hidden',
    animation: 'gradientShift 4s ease-in-out infinite',
  },
  createButtonDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed',
    transform: 'none !important',
  },
};

// Enhanced CSS Animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes floatOrb1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(50px, -30px) scale(1.1); }
    50% { transform: translate(20px, 40px) scale(0.9); }
    75% { transform: translate(-30px, -20px) scale(1.05); }
  }

  @keyframes floatOrb2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-60px, 20px) scale(1.15); }
    66% { transform: translate(40px, -40px) scale(0.85); }
  }

  @keyframes floatOrb3 {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(30px, -50px) rotate(180deg); }
  }

  @keyframes floatOrb4 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(-20px, 30px) scale(1.2); }
    50% { transform: translate(40px, -20px) scale(0.8); }
    75% { transform: translate(-40px, -30px) scale(1.1); }
  }

  @keyframes particleFloat {
    0% {
      transform: translateY(100vh) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100px) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes glassEntrance {
    from {
      opacity: 0;
      transform: translateY(50px) scale(0.95);
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      backdrop-filter: blur(25px);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

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

  @keyframes shimmer {
    0%, 100% {
      background-position: -200% center;
    }
    50% {
      background-position: 200% center;
    }
  }

  @keyframes messageSlideIn {
    from {
      opacity: 0;
      transform: translateX(-100px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  @keyframes formSlideIn {
    from {
      opacity: 0;
      transform: translateY(80px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes formFieldEntrance {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes gradientShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  /* Hover and Focus Effects */
  input:focus, select:focus {
    outline: none;
    border-color: #D4AF37 !important;
    box-shadow: 
      0 0 0 3px rgba(212, 175, 55, 0.2),
      0 8px 32px rgba(212, 175, 55, 0.1) !important;
    background: rgba(245, 245, 245, 0.12) !important;
    transform: translateY(-2px);
  }

  button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px rgba(212, 175, 55, 0.4);
  }

  .generate-button:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 30px rgba(212, 175, 55, 0.5);
  }

  .create-button:hover:not(:disabled) {
    transform: translateY(-4px);
    box-shadow: 
      0 20px 40px rgba(1, 68, 33, 0.4),
      0 0 0 1px rgba(212, 175, 55, 0.2);
  }

  /* Toggle Switch Animation */
  .toggle-slider:before, .toggle-slider-active:before {
    content: '';
    position: absolute;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #D4AF37, #F7E7CE);
    top: 1px;
    left: 1px;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .toggle-slider-active:before {
    transform: translateX(30px);
    box-shadow: 0 2px 12px rgba(212, 175, 55, 0.5);
  }

  /* Button Ripple Effect */
  button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  button:hover::after {
    width: 300px;
    height: 300px;
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    .glass-container {
      padding: 2rem 1.5rem;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .form-actions {
      flex-direction: column;
      gap: 1.5rem;
      align-items: stretch;
    }
    
    .code-input-group {
      flex-direction: column;
    }
    
    .title {
      font-size: 2.2rem;
    }
  }

  @media (max-width: 480px) {
    .glass-container {
      padding: 1.5rem 1rem;
    }
    
    .form {
      padding: 1.5rem;
    }
    
    .title {
      font-size: 1.8rem;
    }
    
    .create-button {
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }
  }
`;

document.head.appendChild(styleSheet);

export default NewCoupon;