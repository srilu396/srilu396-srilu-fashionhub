import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action? This step cannot be reversed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
  icon: ModalIcon
}) => {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // User Refinement 5: Focus moves to Cancel button automatically when opened
      setTimeout(() => cancelBtnRef.current?.focus(), 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header Badge */}
        <div style={{
          ...styles.iconBadge,
          backgroundColor: danger ? 'var(--admin-danger-bg)' : 'var(--admin-gold-muted)',
          borderColor: danger ? 'var(--admin-danger)' : 'var(--admin-border-gold)',
          color: danger ? 'var(--admin-danger)' : 'var(--admin-gold)'
        }}>
          {ModalIcon ? <ModalIcon size={24} /> : <AlertTriangle size={24} />}
        </div>

        <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Modal Title & Body */}
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.body}>{message}</p>

        {/* Action Buttons */}
        <div style={styles.footer}>
          <button 
            ref={cancelBtnRef}
            type="button"
            onClick={onClose} 
            style={styles.cancelBtn} 
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...styles.confirmBtn,
              backgroundColor: danger ? 'var(--admin-danger)' : 'var(--admin-gold)',
              color: danger ? '#FFFFFF' : 'var(--active-pill-text)'
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
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
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 'var(--z-modal, 9999)',
    padding: '20px'
  },
  modal: {
    position: 'relative',
    backgroundColor: 'var(--admin-modal-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '440px',
    padding: '32px 28px',
    boxShadow: 'var(--admin-shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  iconBadge: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  closeBtn: {
    position: 'absolute',
    top: '18px',
    right: '18px',
    background: 'none',
    border: 'none',
    color: 'var(--admin-text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease'
  },
  title: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontSize: '1.35rem',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    margin: '0 0 8px 0',
    letterSpacing: '-0.3px'
  },
  body: {
    fontSize: '0.86rem',
    color: 'var(--admin-text-secondary)',
    lineHeight: '1.5',
    margin: '0 0 24px 0',
    fontWeight: '300'
  },
  footer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: 'auto'
  },
  cancelBtn: {
    flex: 1,
    padding: '11px 18px',
    backgroundColor: 'var(--admin-input-bg)',
    border: '1px solid var(--admin-input-border)',
    borderRadius: '30px',
    color: 'var(--admin-text-primary)',
    fontSize: '0.85rem',
    fontWeight: '600',
    fontFamily: "var(--font-sans, 'Sora', sans-serif)",
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  confirmBtn: {
    flex: 1,
    padding: '11px 18px',
    border: 'none',
    borderRadius: '30px',
    fontSize: '0.85rem',
    fontWeight: '700',
    fontFamily: "var(--font-sans, 'Sora', sans-serif)",
    cursor: 'pointer',
    boxShadow: 'var(--admin-shadow-sm)',
    transition: 'all 0.2s ease'
  }
};

export default ConfirmationModal;
