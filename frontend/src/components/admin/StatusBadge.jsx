import React from 'react';

const statusStyles = {
  // Order & Product & User status mappings
  active: { bg: 'var(--admin-success-bg)', text: 'var(--admin-success)', border: 'var(--admin-success)', label: 'Active' },
  completed: { bg: 'var(--admin-success-bg)', text: 'var(--admin-success)', border: 'var(--admin-success)', label: 'Completed' },
  delivered: { bg: 'var(--admin-success-bg)', text: 'var(--admin-success)', border: 'var(--admin-success)', label: 'Delivered' },
  paid: { bg: 'var(--admin-success-bg)', text: 'var(--admin-success)', border: 'var(--admin-success)', label: 'Paid' },

  pending: { bg: 'var(--admin-warning-bg)', text: 'var(--admin-warning)', border: 'var(--admin-warning)', label: 'Pending' },
  processing: { bg: 'var(--admin-info-bg)', text: 'var(--admin-info)', border: 'var(--admin-info)', label: 'Processing' },
  upcoming: { bg: 'var(--admin-info-bg)', text: 'var(--admin-info)', border: 'var(--admin-info)', label: 'Upcoming' },
  shipped: { bg: 'var(--admin-info-bg)', text: 'var(--admin-info)', border: 'var(--admin-info)', label: 'Shipped' },
  
  inactive: { bg: 'var(--admin-gold-muted)', text: 'var(--admin-text-muted)', border: 'var(--admin-border-subtle)', label: 'Inactive' },
  cancelled: { bg: 'var(--admin-danger-bg)', text: 'var(--admin-danger)', border: 'var(--admin-danger)', label: 'Cancelled' },
  expired: { bg: 'var(--admin-danger-bg)', text: 'var(--admin-danger)', border: 'var(--admin-danger)', label: 'Expired' },
  out_of_stock: { bg: 'var(--admin-danger-bg)', text: 'var(--admin-danger)', border: 'var(--admin-danger)', label: 'Out of Stock' },
  low_stock: { bg: 'var(--admin-warning-bg)', text: 'var(--admin-warning)', border: 'var(--admin-warning)', label: 'Low Stock' },
  in_stock: { bg: 'var(--admin-success-bg)', text: 'var(--admin-success)', border: 'var(--admin-success)', label: 'In Stock' }
};

const StatusBadge = ({ status = 'active', customLabel }) => {
  const normalizedKey = String(status).toLowerCase().replace(/\s+/g, '_');
  const style = statusStyles[normalizedKey] || {
    bg: 'var(--admin-gold-muted)',
    text: 'var(--admin-gold)',
    border: 'var(--admin-border-gold)',
    label: status
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      backgroundColor: style.bg,
      color: style.text,
      border: `1px solid ${style.border}`,
      whiteSpace: 'nowrap'
    }}>
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        backgroundColor: style.text
      }} />
      {customLabel || style.label}
    </span>
  );
};

export default StatusBadge;
