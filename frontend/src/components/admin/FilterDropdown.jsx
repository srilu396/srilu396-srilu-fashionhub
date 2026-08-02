import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

const FilterDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  label = '',
  searchable = true,
  width = '220px',
  icon: HeaderIcon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm('');
      setFocusedIndex(-1);
    }
  }, [isOpen, searchable]);

  const filteredOptions = options.filter(opt =>
    (opt.label || opt.name || String(opt.value || ''))
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  const handleSelect = (opt) => {
    if (onChange) {
      onChange(opt.value);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setFocusedIndex(prev => (prev + 1) % filteredOptions.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[focusedIndex]);
        e.preventDefault();
      }
    }
  };

  return (
    <div
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: width,
        boxSizing: 'border-box'
      }}
    >
      {label && (
        <label style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--admin-text-muted)',
          marginBottom: '6px'
        }}>
          {label}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
          border: isOpen ? '1px solid var(--admin-gold)' : '1px solid var(--admin-border-gold)',
          borderRadius: '24px',
          color: 'var(--admin-text-primary)',
          fontSize: '0.85rem',
          fontFamily: "var(--font-sans, 'Sora', sans-serif)",
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.25s ease',
          boxShadow: isOpen ? 'var(--admin-gold-glow)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {HeaderIcon && <HeaderIcon size={14} style={{ color: 'var(--admin-gold)', flexShrink: 0 }} />}
          {selectedOption?.icon && (
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {selectedOption.icon}
            </span>
          )}
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: selectedOption ? 'var(--admin-text-primary)' : 'var(--admin-text-muted)',
            fontWeight: '500'
          }}>
            {selectedOption ? (selectedOption.label || selectedOption.name) : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--admin-gold)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
            flexShrink: 0,
            marginLeft: '6px'
          }}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border-gold)',
            borderRadius: '14px',
            padding: '8px',
            boxShadow: 'var(--admin-shadow-lg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            maxHeight: '260px',
            overflowY: 'auto',
            animation: 'fadeIn 0.15s ease-out forwards'
          }}
        >
          {/* Search box within dropdown */}
          {searchable && options.length > 5 && (
            <div style={{
              position: 'relative',
              marginBottom: '6px',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--admin-border-subtle)'
            }}>
              <Search size={12} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--admin-text-muted)' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 28px',
                  backgroundColor: 'var(--input-bg)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--admin-text-primary)',
                  fontSize: '0.78rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Option Items */}
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '10px', fontSize: '0.8rem', color: 'var(--admin-text-muted)', textAlign: 'center' }}>
              No options found
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isFocused = idx === focusedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    color: isSelected ? 'var(--admin-gold)' : 'var(--admin-text-primary)',
                    backgroundColor: isSelected
                      ? 'var(--admin-gold-muted)'
                      : isFocused
                      ? 'var(--admin-card-hover)'
                      : 'transparent',
                    fontWeight: isSelected ? '600' : '400',
                    transition: 'all 0.15s ease',
                    marginBottom: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {opt.icon && <span style={{ display: 'flex' }}>{opt.icon}</span>}
                    <span>{opt.label || opt.name}</span>
                  </div>
                  {isSelected && <Check size={14} style={{ color: 'var(--admin-gold)' }} />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
