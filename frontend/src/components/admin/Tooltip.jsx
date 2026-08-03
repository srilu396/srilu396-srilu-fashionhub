import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';

const Tooltip = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [alignBottom, setAlignBottom] = useState(false);
  const containerRef = useRef(null);

  const checkPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    setAlignRight(windowWidth - rect.right < 160);
    setAlignBottom(rect.top < 100);
  }, []);

  const handleMouseEnter = () => {
    checkPosition();
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    checkPosition();
    setVisible(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setVisible(false);
      }
    };
    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [visible]);

  return (
    <div 
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label="Information tooltip"
    >
      {children || (
        <Info 
          size={14} 
          style={{ 
            color: '#D4AF37', 
            cursor: 'pointer', 
            marginLeft: '6px',
            opacity: 0.85,
            transition: 'opacity 0.2s ease, transform 0.2s ease'
          }} 
        />
      )}

      {visible && (
        <div style={{
          position: 'absolute',
          top: alignBottom ? 'calc(100% + 8px)' : 'auto',
          bottom: !alignBottom ? 'calc(100% + 8px)' : 'auto',
          right: alignRight ? '0px' : 'auto',
          left: !alignRight ? '50%' : 'auto',
          transform: !alignRight ? 'translateX(-50%)' : 'none',
          backgroundColor: 'var(--admin-modal-bg)',
          color: 'var(--admin-text-primary)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '400',
          lineHeight: '1.45',
          maxWidth: '220px',
          width: 'max-content',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          textAlign: 'left',
          boxShadow: 'var(--admin-shadow-md)',
          border: '1px solid var(--admin-border-gold)',
          zIndex: 'var(--z-tooltip, 10000)',
          pointerEvents: 'none',
          animation: 'tooltipFadeScale 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: alignBottom ? 'auto' : '100%',
            bottom: alignBottom ? '100%' : 'auto',
            right: alignRight ? '12px' : 'auto',
            left: !alignRight ? '50%' : 'auto',
            transform: !alignRight ? 'translateX(-50%)' : 'none',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: !alignBottom 
              ? 'rgba(212, 175, 55, 0.35) transparent transparent transparent' 
              : 'transparent transparent rgba(212, 175, 55, 0.35) transparent'
          }} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;


