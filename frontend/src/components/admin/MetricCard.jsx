import React from 'react';
import Tooltip from './Tooltip';

const MetricCard = ({ title, value, change, changeType = 'positive', icon, subtitle, tooltipText }) => {
  const isPositive = changeType === 'positive';
  
  return (
    <div style={styles.card} className="admin-card-metric">
      <div style={styles.topRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={styles.title}>{title}</span>
          {tooltipText && <Tooltip text={tooltipText} />}
        </div>
        {icon && <div style={styles.iconContainer}>{icon}</div>}
      </div>

      <div style={styles.valueRow}>
        <span style={styles.value}>{value}</span>
      </div>

      <div style={styles.bottomRow}>
        {change && (
          <span style={{
            ...styles.changeBadge,
            backgroundColor: isPositive ? 'var(--admin-success-bg)' : 'var(--admin-danger-bg)',
            color: isPositive ? 'var(--admin-success)' : 'var(--admin-danger)',
            borderColor: isPositive ? 'var(--admin-success)' : 'var(--admin-danger)'
          }}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
        )}
        {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'var(--admin-card-bg)',
    border: '1px solid var(--admin-border-gold)',
    borderRadius: '12px',
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--admin-shadow-sm)',
    boxSizing: 'border-box'
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  title: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--admin-text-muted)'
  },
  iconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'var(--admin-gold-muted)',
    color: 'var(--admin-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--admin-border-subtle)'
  },
  valueRow: {
    marginBottom: '12px'
  },
  value: {
    fontSize: '26px',
    fontWeight: '700',
    color: 'var(--admin-text-primary)',
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    letterSpacing: '0.5px'
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  changeBadge: {
    padding: '3px 10px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '600',
    border: '1px solid'
  },
  subtitle: {
    fontSize: '11px',
    color: 'var(--admin-text-muted)'
  }
};

export default MetricCard;
