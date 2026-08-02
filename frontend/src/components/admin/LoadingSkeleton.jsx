import React from 'react';

const LoadingSkeleton = ({ type = 'table', rows = 5 }) => {
  if (type === 'card') {
    return (
      <div style={{
        backgroundColor: '#141417',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ width: '40%', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px' }} />
        <div style={{ width: '60%', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px' }} />
        <div style={{ width: '30%', height: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} style={{
          height: '46px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '6px'
        }} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
