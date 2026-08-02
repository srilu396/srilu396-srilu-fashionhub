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
          backgroundColor: danger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(212, 175, 55, 0.12)',
          borderColor: danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(212, 175, 55, 0.3)',
          color: danger ? '#EF4444' : '#D4AF37'
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
              backgroundColor: danger ? '#DC2626' : '#C5A059',
              color: danger ? '#FFFFFF' : '#0D0D10'
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
    backgroundColor: 'rgba(5, 5, 8, 0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    position: 'relative',
    backgroundColor: '#141418',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '440px',
    padding: '32px 28px',
    boxShadow: '0 30px 70px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
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
    color: '#A0A0AB',
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
    color: '#F9F6F0',
    margin: '0 0 8px 0',
    letterSpacing: '-0.3px'
  },
  body: {
    fontSize: '0.86rem',
    color: '#A0A0AB',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '30px',
    color: '#F9F6F0',
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
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease'
  }
};

export default ConfirmationModal;
