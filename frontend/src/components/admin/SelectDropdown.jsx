import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

const SelectDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select Category',
  label,
  searchable = true,
  required = false,
  error = false
}) => {
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setHighlightedIndex(0);
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
  }, [open, searchable]);

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(filterText.toLowerCase()))
    : options;

  const selectedOpt = options.find((opt) => String(opt.value) === String(value));

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % (filteredOptions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % (filteredOptions.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex].value);
        setOpen(false);
        setFilterText('');
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label style={styles.label}>
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          ...styles.triggerBtn,
          borderColor: error ? '#EF4444' : open ? '#D4AF37' : 'rgba(255, 255, 255, 0.12)'
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ color: selectedOpt ? '#F9F6F0' : '#A0A0AB', fontWeight: selectedOpt ? '600' : '400' }}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          style={{
            color: '#D4AF37',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {open && (
        <div style={styles.dropdownMenu} role="listbox">
          {searchable && options.length > 3 && (
            <div style={styles.searchWrapper}>
              <Search size={14} color="#A0A0AB" style={{ marginRight: '6px' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search..."
                style={styles.searchInput}
              />
            </div>
          )}
          <div style={styles.optionList}>
            {filteredOptions.length === 0 ? (
              <div style={styles.noOption}>No matching categories</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setFilterText('');
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    style={{
                      ...styles.optionItem,
                      backgroundColor: isSelected
                        ? 'rgba(212, 175, 55, 0.2)'
                        : isHighlighted
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'transparent',
                      color: isSelected ? '#D4AF37' : '#F9F6F0'
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} color="#D4AF37" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  label: {
    display: 'block',
    fontSize: '11px',
    color: '#D4AF37',
    fontWeight: '600',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  },
  triggerBtn: {
    width: '100%',
    padding: '11px 14px',
    backgroundColor: '#0D0D11',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: "'Sora', sans-serif",
    textAlign: 'left',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: '#141418',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '10px',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
    zIndex: 200,
    overflow: 'hidden'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0D0D11'
  },
  searchInput: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#F9F6F0',
    fontSize: '12px',
    outline: 'none',
    fontFamily: "'Sora', sans-serif"
  },
  optionList: {
    maxHeight: '200px',
    overflowY: 'auto'
  },
  optionItem: {
    padding: '10px 14px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  noOption: {
    padding: '14px',
    fontSize: '12px',
    color: '#A0A0AB',
    textAlign: 'center'
  }
};

export default SelectDropdown;
