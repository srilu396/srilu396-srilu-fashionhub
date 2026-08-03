import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md',         // 'sm' | 'md' | 'lg'
  icon = null,
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  style = {},
  className = '',
  to = null,
  title,
  ...props
}) => {
  const sizeStyles = {
    sm: {
      height: '34px',
      padding: '0 12px',
      fontSize: '12px',
      gap: '6px',
    },
    md: {
      height: '40px',
      padding: '0 18px',
      fontSize: '13px',
      gap: '8px',
    },
    lg: {
      height: '46px',
      padding: '0 24px',
      fontSize: '14px',
      gap: '10px',
    }
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--admin-gold)',
      color: 'var(--active-pill-text, #0A0A0D)',
      border: '1px solid var(--admin-gold)',
      boxShadow: 'var(--admin-shadow-sm)',
      fontWeight: '600',
    },
    secondary: {
      backgroundColor: 'var(--admin-gold-muted)',
      color: 'var(--admin-gold)',
      border: '1px solid var(--admin-border-gold)',
      boxShadow: 'none',
      fontWeight: '600',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--admin-text-primary)',
      border: '1px solid var(--admin-border-subtle)',
      boxShadow: 'none',
      fontWeight: '500',
    },
    danger: {
      backgroundColor: 'var(--admin-danger)',
      color: '#FFFFFF',
      border: '1px solid var(--admin-danger)',
      boxShadow: 'var(--admin-shadow-sm)',
      fontWeight: '600',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--admin-text-secondary)',
      border: '1px solid transparent',
      boxShadow: 'none',
      fontWeight: '500',
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;
  const currentVariant = variantStyles[variant] || variantStyles.primary;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm, 8px)',
    fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
    letterSpacing: '0.3px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    textDecoration: 'none',
    boxSizing: 'border-box',
    ...currentSize,
    ...currentVariant,
    ...style
  };

  const handleMouseEnter = (e) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translateY(-1px)';
      if (variant === 'primary') {
        e.currentTarget.style.backgroundColor = 'var(--admin-gold-dark, #C5A028)';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(212, 175, 55, 0.35)';
      } else if (variant === 'secondary') {
        e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.22)';
        e.currentTarget.style.borderColor = 'var(--admin-border-focus, rgba(212, 175, 55, 0.5))';
      } else if (variant === 'outline') {
        e.currentTarget.style.borderColor = 'var(--admin-border-gold, rgba(212, 175, 55, 0.4))';
        e.currentTarget.style.color = 'var(--admin-gold, #D4AF37)';
      } else if (variant === 'danger') {
        e.currentTarget.style.backgroundColor = '#DC2626';
      }
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.backgroundColor = currentVariant.backgroundColor;
      e.currentTarget.style.borderColor = currentVariant.border.split(' ')[2];
      e.currentTarget.style.color = currentVariant.color;
      e.currentTarget.style.boxShadow = currentVariant.boxShadow;
    }
  };

  const handleFocus = (e) => {
    if (!disabled) {
      e.currentTarget.style.boxShadow = '0 0 0 2px var(--admin-border-focus, rgba(212, 175, 55, 0.5))';
    }
  };

  const handleBlur = (e) => {
    if (!disabled) {
      e.currentTarget.style.boxShadow = currentVariant.boxShadow;
    }
  };

  if (to) {
    return (
      <Link
        to={to}
        title={title}
        style={baseStyle}
        className={`admin-btn admin-btn-${variant} ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={baseStyle}
      className={`admin-btn admin-btn-${variant} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
