import React from 'react';

const LoadingSkeleton = ({ type = 'table', rows = 5 }) => {
  if (type === 'card') {
    return (
      <div style={{
        backgroundColor: 'var(--admin-card-bg)',
        border: '1px solid var(--admin-border-subtle)',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div className="skeleton-loader" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
        <div className="skeleton-loader" style={{ width: '60%', height: '24px', borderRadius: '4px' }} />
        <div className="skeleton-loader" style={{ width: '30%', height: '12px', borderRadius: '4px' }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="skeleton-loader" style={{
          height: '46px',
          width: '100%',
          borderRadius: '6px'
        }} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
