import React from 'react';

const statusStyles = {
  // Order & Product & User status mappings
  active: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)', label: 'Active' },
  completed: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)', label: 'Completed' },
  delivered: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)', label: 'Delivered' },
  paid: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)', label: 'Paid' },

  pending: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)', label: 'Pending' },
  processing: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.3)', label: 'Processing' },
  upcoming: { bg: 'rgba(59, 130, 246, 0.12)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)', label: 'Upcoming' },
  shipped: { bg: 'rgba(139, 92, 246, 0.12)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.3)', label: 'Shipped' },
  
  inactive: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9CA3AF', border: 'rgba(107, 114, 128, 0.3)', label: 'Inactive' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)', label: 'Cancelled' },
  expired: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)', label: 'Expired' },
  out_of_stock: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)', label: 'Out of Stock' },
  low_stock: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)', label: 'Low Stock' },
  in_stock: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)', label: 'In Stock' }
};

const StatusBadge = ({ status = 'active', customLabel }) => {
  const normalizedKey = String(status).toLowerCase().replace(/\s+/g, '_');
  const style = statusStyles[normalizedKey] || {
    bg: 'rgba(212, 175, 55, 0.12)',
    text: '#D4AF37',
    border: 'rgba(212, 175, 55, 0.3)',
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
