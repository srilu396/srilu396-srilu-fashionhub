import React from 'react';
import { ChevronDown } from 'lucide-react';
import './SectionCurveDivider.css';

/**
 * Reusable Section Curve Divider Component
 * Creates an elegant luxury curved wave divider with a golden stroke and optional center chevron scroll button.
 */
const SectionCurveDivider = ({
  showButton = true,
  buttonAction = 'scroll',
  curveColor = 'url(#gold-curve-grad)',
  background = 'transparent',
  nextSectionClass = 'shop-by-category',
  className = ''
}) => {
  const handleClick = () => {
    if (buttonAction === 'none') return;
    if (buttonAction === 'scroll' && nextSectionClass) {
      const target = document.getElementById(nextSectionClass) || document.querySelector(`.${nextSectionClass}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={`section-curve-divider-root ${className}`} style={{ background }}>
      <svg
        className="curve-divider-svg"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gold-curve-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E8C08A" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#C98E5C" />
          </linearGradient>
          <filter id="gold-curve-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#C98E5C" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Lower section fill shape */}
        <path
          d="M 0,40 Q 360,85 720,40 T 1440,40 L 1440,80 L 0,80 Z"
          fill="var(--bg-cream, #FDF9F3)"
        />

        {/* Golden Stroke Wave Line */}
        <path
          d="M 0,40 Q 360,85 720,40 T 1440,40"
          fill="none"
          stroke={curveColor}
          strokeWidth="3"
          filter="url(#gold-curve-shadow)"
        />
      </svg>

      {showButton && (
        <div className="curve-center-button-wrap">
          <button
            className="curve-chevron-btn"
            onClick={handleClick}
            title="Scroll to Next Section"
            aria-label="Scroll Down"
          >
            <ChevronDown size={22} className="chevron-icon" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SectionCurveDivider;
