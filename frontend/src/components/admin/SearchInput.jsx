import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

const SearchInput = ({ 
  value = '', 
  onChange, 
  onClear, 
  placeholder = 'Search records...', 
  loading = false,
  width = '360px' 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && value) {
      if (onClear) onClear();
      else if (onChange) onChange({ target: { value: '' } });
    }
  };

  return (
    <div style={{ position: 'relative', width, display: 'flex', alignItems: 'center' }}>
      <Search 
        size={15} 
        style={{ position: 'absolute', left: '16px', color: 'var(--admin-text-muted, #6B7280)', pointerEvents: 'none' }} 
      />

      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 38px 10px 42px',
          backgroundColor: 'var(--input-bg, rgba(255, 255, 255, 0.04))',
          border: '1px solid var(--admin-border-gold, rgba(212, 175, 55, 0.25))',
          borderRadius: '24px',
          color: 'var(--admin-text-primary, #F9F8F6)',
          fontSize: '13px',
          fontFamily: "var(--font-sans, 'Sora', sans-serif)",
          outline: 'none',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--admin-shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.04))'
        }}
      />

      {loading ? (
        <Loader2 
          size={14} 
          className="animate-spin" 
          style={{ position: 'absolute', right: '14px', color: 'var(--admin-gold, #D4AF37)' }} 
        />
      ) : value ? (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else if (onChange) onChange({ target: { value: '' } });
          }}
          style={{
            position: 'absolute',
            right: '14px',
            background: 'none',
            border: 'none',
            color: 'var(--admin-text-muted, #6B7280)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}
          title="Clear search (ESC)"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
};

export default SearchInput;
