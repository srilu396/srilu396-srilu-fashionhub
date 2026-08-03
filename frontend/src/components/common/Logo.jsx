import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({
  variant = 'full', // 'full' | 'compact' | 'mark'
  size = 'md',      // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  mode = 'auto',    // 'auto' | 'gold' | 'dark' | 'light'
  subtitle = 'FASHIONHUB',
  to,
  className = '',
  style = {}
}) => {
  // Size multipliers
  const sizeMap = {
    xs: { mark: 26, font: '0.95rem', sub: '9px', gap: '8px' },
    sm: { mark: 36, font: '1.25rem', sub: '10px', gap: '10px' },
    md: { mark: 46, font: '1.55rem', sub: '11px', gap: '12px' },
    lg: { mark: 56, font: '1.85rem', sub: '12px', gap: '14px' },
    xl: { mark: 72, font: '2.35rem', sub: '14px', gap: '18px' }
  };

  const currentSize = typeof size === 'number' 
    ? { mark: size, font: `${size * 0.035}rem`, sub: '10px', gap: '10px' }
    : sizeMap[size] || sizeMap.md;

  // Color modes
  const getColorModeStyles = () => {
    switch (mode) {
      case 'gold':
        return {
          titleColor: 'var(--admin-gold)',
          subColor: 'var(--admin-text-muted)',
          iconGradientId: 'logo-gold-grad'
        };
      case 'light':
        return {
          titleColor: 'var(--admin-text-primary)',
          subColor: 'var(--admin-text-secondary)',
          iconGradientId: 'logo-light-grad'
        };
      case 'dark':
        return {
          titleColor: 'var(--admin-text-primary)',
          subColor: 'var(--admin-text-secondary)',
          iconGradientId: 'logo-dark-grad'
        };
      case 'auto':
      default:
        return {
          titleColor: 'var(--admin-text-primary)',
          subColor: 'var(--admin-gold)',
          iconGradientId: 'logo-auto-grad'
        };
    }
  };

  const themeColors = getColorModeStyles();

  // Vector Monogram Crown SVG Icon
  const LogoMarkSVG = (
    <svg
      width={currentSize.mark}
      height={currentSize.mark}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-label="SRILU Brand Crest"
    >
      <defs>
        <linearGradient id={themeColors.iconGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5C158" />
          <stop offset="50%" stopColor="#B07D3A" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hexagonal Luxury Crown Frame */}
      <polygon
        points="50,4 92,26 92,74 50,96 8,74 8,26"
        fill="url(#logo-auto-grad)"
        fillOpacity="0.08"
        stroke={`url(#${themeColors.iconGradientId})`}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Inner Geometric Diamond */}
      <polygon
        points="50,14 82,50 50,86 18,50"
        fill="none"
        stroke={`url(#${themeColors.iconGradientId})`}
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />

      {/* Styled Monogram "S" Serif Motif */}
      <path
        d="M62 34 C62 26, 42 26, 40 35 C38 44, 62 43, 60 55 C58 67, 36 67, 36 58"
        stroke={`url(#${themeColors.iconGradientId})`}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="62" cy="33" r="2.5" fill={`url(#${themeColors.iconGradientId})`} />
      <circle cx="36" cy="59" r="2.5" fill={`url(#${themeColors.iconGradientId})`} />
    </svg>
  );

  const LogoContent = (
    <div
      className={`srilu-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
        textDecoration: 'none',
        userSelect: 'none',
        ...style
      }}
    >
      {LogoMarkSVG}

      {variant !== 'mark' && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div
            style={{
              fontFamily: "var(--font-serif, 'Playfair Display', serif)",
              fontSize: currentSize.font,
              fontWeight: 800,
              letterSpacing: '1.5px',
              color: themeColors.titleColor,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}
          >
            SRILU
          </div>

          {variant === 'full' && subtitle && (
            <span
              style={{
                fontFamily: "var(--font-sans, 'Sora', sans-serif)",
                fontSize: currentSize.sub,
                fontWeight: 700,
                letterSpacing: '2px',
                color: themeColors.subColor,
                textTransform: 'uppercase',
                marginTop: '2px',
                whiteSpace: 'nowrap'
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none' }}>
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
};

export default Logo;
