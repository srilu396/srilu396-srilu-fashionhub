import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical } from 'lucide-react';

const ActionMenu = ({ items = [] }) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [menuStyles, setMenuStyles] = useState({});
  
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = Math.min(items.length * 42 + 16, 280);
    const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
    
    const menuWidth = 190;
    let rightPos = window.innerWidth - rect.right;
    if (rect.right - menuWidth < 8) {
      rightPos = Math.max(8, window.innerWidth - rect.left - menuWidth);
    }

    setMenuStyles({
      position: 'fixed',
      top: openUpward ? 'auto' : `${rect.bottom + 6}px`,
      bottom: openUpward ? `${window.innerHeight - rect.top + 6}px` : 'auto',
      right: `${Math.max(8, rightPos)}px`,
      zIndex: 99999
    });
  }, [items.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        closeMenu();
      }
    };

    if (open) {
      updatePosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) {
      setFocusedIndex(0);
      const timer = setTimeout(() => {
        if (itemRefs.current[0]) itemRefs.current[0].focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (open) {
      closeMenu();
    } else {
      updatePosition();
      setOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeMenu();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (focusedIndex + 1) % items.length;
      setFocusedIndex(nextIndex);
      if (itemRefs.current[nextIndex]) itemRefs.current[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (focusedIndex - 1 + items.length) % items.length;
      setFocusedIndex(prevIndex);
      if (itemRefs.current[prevIndex]) itemRefs.current[prevIndex].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (items[focusedIndex] && items[focusedIndex].onClick) {
        closeMenu();
        items[focusedIndex].onClick();
      }
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        style={{
          background: open ? 'var(--admin-gold-muted, rgba(212, 175, 55, 0.18))' : 'transparent',
          border: '1px solid var(--admin-border-gold, rgba(212, 175, 55, 0.25))',
          color: open ? 'var(--admin-gold, #D4AF37)' : 'var(--admin-text-secondary, #A0A0AB)',
          cursor: 'pointer',
          padding: '8px 12px',
          minWidth: '36px',
          minHeight: '36px',
          borderRadius: 'var(--radius-sm, 8px)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          marginRight: '2px',
          boxShadow: open ? '0 0 12px rgba(212, 175, 55, 0.2)' : 'none'
        }}
        title="More Actions"
        aria-label="Actions menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          style={{
            ...menuStyles,
            backgroundColor: 'var(--admin-dropdown-bg)',
            border: '1px solid var(--admin-border-gold)',
            borderRadius: '12px',
            boxShadow: 'var(--admin-shadow-lg)',
            minWidth: '190px',
            padding: '6px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              ref={el => itemRefs.current[idx] = el}
              type="button"
              role="menuitem"
              tabIndex={focusedIndex === idx ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                closeMenu();
                if (item.onClick) item.onClick(e);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 14px',
                background: 'none',
                border: 'none',
                color: item.danger ? 'var(--admin-danger)' : 'var(--admin-text-primary)',
                fontSize: '0.84rem',
                fontWeight: '600',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                setFocusedIndex(idx);
                e.currentTarget.style.backgroundColor = item.danger 
                  ? 'var(--admin-danger-bg)' 
                  : 'var(--admin-gold-muted)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'none';
              }}
              onFocus={(e) => {
                setFocusedIndex(idx);
                e.currentTarget.style.backgroundColor = item.danger 
                  ? 'var(--admin-danger-bg)' 
                  : 'var(--admin-gold-muted)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;

