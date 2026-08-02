import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Drawer = ({ isOpen, onClose, title, subtitle, children, width = '520px' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={styles.overlay} onClick={onClose}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{ ...styles.drawerCard, width }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={styles.header}>
              <div>
                {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
                <h3 style={styles.title}>{title}</h3>
              </div>
              <button onClick={onClose} style={styles.closeBtn} aria-label="Close drawer">
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={styles.body}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  drawerCard: {
    height: '100%',
    backgroundColor: '#141419',
    borderLeft: '1px solid rgba(212, 175, 55, 0.25)',
    boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '24px 28px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#0E0E12'
  },
  subtitle: {
    fontSize: '11px',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600',
    display: 'block',
    marginBottom: '4px'
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '20px',
    fontWeight: '700',
    color: '#F9F6F0',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#A0A0AB',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease, background-color 0.2s ease'
  },
  body: {
    flex: 1,
    padding: '28px',
    overflowY: 'auto'
  }
};

export default Drawer;
