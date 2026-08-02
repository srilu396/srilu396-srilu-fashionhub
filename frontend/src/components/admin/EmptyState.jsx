import React from 'react';

const EmptyState = ({
  title = 'No Records Found',
  description = 'There are currently no items to display matching your criteria.',
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.iconCircle}>
        {icon || (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>

      <h3 style={styles.title}>{title}</h3>
      <p style={styles.description}>{description}</p>

      {actionLabel && onAction && (
        <button onClick={onAction} style={styles.actionBtn}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backgroundColor: '#141417',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px'
  },
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '18px',
    fontWeight: '600',
    color: '#F9F6F0',
    margin: '0 0 8px 0'
  },
  description: {
    fontSize: '13px',
    color: '#A0A0AB',
    maxWidth: '360px',
    margin: '0 0 20px 0',
    lineHeight: '1.5'
  },
  actionBtn: {
    padding: '10px 20px',
    backgroundColor: '#D4AF37',
    color: '#0D0D0E',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default EmptyState;
