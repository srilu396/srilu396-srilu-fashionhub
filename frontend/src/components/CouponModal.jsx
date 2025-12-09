import React, { useState, useEffect } from 'react';
import { couponAPI } from '../utils/api';

const CouponModal = ({ coupon, onClose, onSave, isEditing }) => {
  const [formData, setFormData] = useState({
    coupon_code: '',
    discount_type: 'percentage',
    discount_value: '',
    applicable_categories: [],
    applicable_products: [],
    min_cart_value: '',
    valid_from: '',
    valid_until: '',
    usage_limit_total: '',
    usage_limit_per_user: '1',
    active_status: true
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    if (coupon) {
      setFormData({
        ...coupon,
        valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : '',
        valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : ''
      });
    }
    fetchCategories();
    fetchProducts();
  }, [coupon]);

  useEffect(() => {
    if (formData.applicable_categories.length > 0) {
      const filtered = products.filter(product => 
        formData.applicable_categories.includes(product.category?.name)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [formData.applicable_categories, products]);

  const fetchCategories = async () => {
    try {
      const data = await couponAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await couponAPI.getProducts();
      setProducts(data.slice(0, 50));
      setFilteredProducts(data.slice(0, 50));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await couponAPI.updateCoupon(coupon._id, formData);
      } else {
        await couponAPI.createCoupon(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving coupon:', error);
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

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, coupon_code: code });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{isEditing ? 'Edit Coupon' : 'Create New Coupon'}</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.formGrid}>
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
                >
                  🎲 Generate
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Discount Type *</label>
              <select 
                name="discount_type" 
                value={formData.discount_type}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

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
              />
            </div>

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
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Applicable Categories</label>
              <select 
                multiple
                value={formData.applicable_categories}
                onChange={(e) => handleMultiSelect(e, 'applicable_categories')}
                style={{ ...styles.input, ...styles.multiSelect }}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Applicable Products</label>
              <select 
                multiple
                value={formData.applicable_products}
                onChange={(e) => handleMultiSelect(e, 'applicable_products')}
                style={{ ...styles.input, ...styles.multiSelect }}
              >
                {filteredProducts.map(product => (
                  <option key={product.id} value={product.title}>
                    {product.title} - ${product.price}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Valid From *</label>
              <input
                type="datetime-local"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Valid Until *</label>
              <input
                type="datetime-local"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

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
              />
            </div>

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
                />
                <span style={formData.active_status ? styles.toggleSliderActive : styles.toggleSlider}></span>
                Active Status
              </label>
            </div>
            
            <div style={styles.modalButtons}>
              <button type="button" onClick={onClose} style={styles.cancelButton}>
                Cancel
              </button>
              <button type="submit" style={styles.saveButton}>
                {isEditing ? 'Update' : 'Create'} Coupon
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        input:focus, select:focus {
          outline: none;
          border-color: #D4AF37 !important;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.3) !important;
        }

        .motion-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        .motion-scale-in {
          animation: scaleIn 0.3s ease-out;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95% !important;
          }
          
          .modal-form {
            padding: 1rem !important;
          }
          
          .form-grid {
            grid-template-columns: 1fr !important;
          }
          
          .form-actions {
            flex-direction: column !important;
            gap: 1rem !important;
            align-items: stretch !important;
          }
          
          .modal-buttons {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem',
    animation: 'fadeIn 0.3s ease-out',
  },
  modalContent: {
    background: 'rgba(28, 28, 28, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '2px solid rgba(212, 175, 55, 0.5)',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'scaleIn 0.3s ease-out',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
  },
  modalTitle: {
    color: '#D4AF37',
    fontFamily: "'Playfair Display', serif",
    margin: 0,
    fontSize: '1.8rem',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#E5DCC3',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: 0,
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  modalForm: {
    padding: '2rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    color: '#D4AF37',
    marginBottom: '0.5rem',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  input: {
    background: 'rgba(245, 245, 245, 0.1)',
    border: '2px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#F5F5F5',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  },
  multiSelect: {
    height: '100px',
    resize: 'vertical',
  },
  codeInputGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  generateButton: {
    background: 'linear-gradient(45deg, #D4AF37, #F7E7CE)',
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#1C1C1C',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '2rem',
    borderTop: '1px solid rgba(212, 175, 55, 0.2)',
  },
  toggleGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#E5DCC3',
    cursor: 'pointer',
    fontWeight: '500',
  },
  toggleInput: {
    display: 'none',
  },
  toggleSlider: {
    width: '50px',
    height: '25px',
    background: 'rgba(245, 245, 245, 0.2)',
    borderRadius: '25px',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  toggleSliderActive: {
    width: '50px',
    height: '25px',
    background: 'rgba(212, 175, 55, 0.3)',
    borderRadius: '25px',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  modalButtons: {
    display: 'flex',
    gap: '1rem',
  },
  cancelButton: {
    background: 'rgba(117, 117, 117, 0.3)',
    color: '#E5DCC3',
    border: '1px solid rgba(117, 117, 117, 0.5)',
    borderRadius: '10px',
    padding: '0.75rem 2rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  saveButton: {
    background: 'linear-gradient(45deg, #014421, #001F3F)',
    color: '#F5F5F5',
    border: '1px solid rgba(1, 68, 33, 0.5)',
    borderRadius: '10px',
    padding: '0.75rem 2rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

// Add toggle slider pseudo-element styles
const toggleStyle = `
  .toggle-slider:before, .toggle-slider-active:before {
    content: '';
    position: absolute;
    width: 21px;
    height: 21px;
    border-radius: 50%;
    background: #D4AF37;
    top: 2px;
    left: 2px;
    transition: all 0.3s ease;
  }

  .toggle-slider-active:before {
    transform: translateX(25px);
  }

  button:hover {
    transform: translateY(-2px);
  }

  .generate-button:hover {
    transform: translateY(-2px) scale(1.05);
  }

  .cancel-button:hover {
    background: rgba(117, 117, 117, 0.5);
  }

  .save-button:hover {
    background: linear-gradient(45deg, #001F3F, #014421);
    box-shadow: 0 5px 15px rgba(1, 68, 33, 0.4);
  }

  .close-button:hover {
    background: rgba(212, 175, 55, 0.2);
    color: #D4AF37;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = toggleStyle;
  document.head.append(style);
}

export default CouponModal;