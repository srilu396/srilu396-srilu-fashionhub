import React from 'react';
import './DashboardSkeletons.css';

export const CategorySkeletonRow = ({ count = 5 }) => {
  return (
    <div className="category-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="category-skeleton-card skeleton-pulse">
          <div style={{ flex: 1 }} />
          <div className="product-skeleton-line-long skeleton-pulse" style={{ background: 'rgba(255,255,255,0.4)', margin: '0 auto 8px' }} />
          <div className="product-skeleton-line-short skeleton-pulse" style={{ background: 'rgba(255,255,255,0.3)', margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
};

export const ProductSkeletonGrid = ({ count = 6 }) => {
  return (
    <div className="product-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-skeleton-card">
          <div className="product-skeleton-img skeleton-pulse" />
          <div className="product-skeleton-line-long skeleton-pulse" />
          <div className="product-skeleton-line-short skeleton-pulse" />
          <div className="product-skeleton-footer">
            <div className="product-skeleton-price skeleton-pulse" />
            <div className="product-skeleton-btn skeleton-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};
