import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  value: externalValue,
  onChange,
  onSearch,
  placeholder = 'Search products, orders, customers...',
  width = '440px',
  debounceMs = 300,
  className = ''
}) => {
  const [internalValue, setInternalValue] = useState(externalValue || '');

  useEffect(() => {
    setInternalValue(externalValue || '');
  }, [externalValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSearch) {
        onSearch(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onSearch]);

  const handleChange = (e) => {
    const val = e.target.value;
    setInternalValue(val);
    if (onChange) {
      onChange(e);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    if (onChange) {
      onChange({ target: { value: '' } });
    }
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div 
      className={`search-bar-root ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: width,
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Search 
        size={16} 
        style={{
          position: 'absolute',
          left: '16px',
          color: 'var(--admin-text-muted, #6B7280)',
          pointerEvents: 'none',
          transition: 'color 0.2s ease'
        }} 
      />
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 40px 10px 42px',
          backgroundColor: 'var(--admin-input-bg)',
          border: '1px solid var(--admin-border-gold)',
          borderRadius: '24px',
          color: 'var(--admin-text-primary)',
          fontSize: '0.86rem',
          fontFamily: "var(--font-sans, 'Sora', sans-serif)",
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--admin-shadow-sm)'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--admin-gold, #D4AF37)';
          e.target.style.boxShadow = '0 0 0 3px var(--admin-gold-muted, rgba(212, 175, 55, 0.15))';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--admin-border-gold, rgba(212, 175, 55, 0.25))';
          e.target.style.boxShadow = 'var(--admin-shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.04))';
        }}
      />
      
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '14px',
            background: 'none',
            border: 'none',
            color: 'var(--admin-text-muted, #6B7280)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'color 0.2s ease'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
