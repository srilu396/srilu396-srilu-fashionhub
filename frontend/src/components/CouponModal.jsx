import React, { useState } from 'react';
import CouponForm from './admin/CouponForm';
import { couponAPI } from '../utils/api';

const CouponModal = ({ coupon, onClose, onSave, isEditing = true }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (formData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (isEditing && coupon) {
        await couponAPI.updateCoupon(coupon._id || coupon.id, formData);
      } else {
        await couponAPI.createCoupon(formData);
      }
      onSave();
    } catch (err) {
      console.error('Error saving coupon:', err);
      setErrorMsg(err.message || 'Error saving coupon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <span style={styles.modalMeta}>PROMOTIONS ENGINE</span>
            <h2 style={styles.modalTitle}>{isEditing ? 'Edit Coupon Rules' : 'Create Promotional Coupon'}</h2>
          </div>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        {errorMsg && (
          <div style={styles.errorBanner}>
            {errorMsg}
          </div>
        )}

        <div style={styles.modalBody}>
          <CouponForm
            initialData={coupon}
            isEditing={isEditing}
            onSubmit={handleSubmit}
            onCancel={onClose}
            loading={loading}
            submitText={isEditing ? 'Save Coupon Rules' : 'Create Coupon'}
            showCancel={true}
          />
        </div>
      </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
    animation: 'fadeIn 0.2s ease-out'
  },
  modalContent: {
    backgroundColor: 'var(--admin-modal-bg, var(--admin-card-bg))',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '920px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '28px',
    boxShadow: 'var(--admin-shadow-lg)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--admin-border-subtle)'
  },
  modalMeta: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--admin-gold)',
    fontWeight: '700',
    display: 'block',
    marginBottom: '2px'
  },
  modalTitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-secondary)',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0 8px',
    transition: 'color 0.2s ease'
  },
  errorBanner: {
    padding: '12px 16px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#EF4444',
    fontSize: '13px',
    marginBottom: '20px'
  },
  modalBody: {
    marginTop: '8px'
  }
};

export default CouponModal;