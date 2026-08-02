import React from 'react';

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, gap: '20px' }}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="admin-card" style={{ height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="skeleton-loader" style={{ width: '40%', height: '14px' }} />
          <div className="skeleton-loader" style={{ width: '70%', height: '28px' }} />
          <div className="skeleton-loader" style={{ width: '50%', height: '12px' }} />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#141417', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      {Array(rows).fill(0).map((_, rIdx) => (
        <div key={rIdx} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
          {Array(cols).fill(0).map((_, cIdx) => (
            <div key={cIdx} className="skeleton-loader" style={{ flex: 1, height: '24px' }} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default { CardSkeleton, TableSkeleton };
