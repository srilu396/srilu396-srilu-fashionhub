import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './ShoppingSelect.css';

const ShoppingSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select option',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className={`shopping-select-container ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      ref={selectRef}
    >
      <button
        type="button"
        className="shopping-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="select-label-wrap">
          {label && <span className="select-prefix-label">{label}:</span>}
          <span className="select-current-value">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown size={15} className={`select-chevron ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="shopping-select-dropdown" role="listbox">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <div
                key={option.value}
                className={`shopping-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={isSelected}
              >
                <span className="option-label-text">{option.label}</span>
                {isSelected && <Check size={14} className="option-check-icon" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShoppingSelect;
