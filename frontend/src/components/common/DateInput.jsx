import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * Modern DateInput component with guaranteed DD/MM/YYYY presentation
 * Stores ISO 'YYYY-MM-DD' values for backend compatibility
 */
export const DateInput = ({
  value = '',
  onChange,
  required = false,
  disabled = false,
  placeholder = 'DD/MM/YYYY',
  className = '',
  min,
  max,
  id,
  name
}) => {
  const inputRef = useRef(null);

  // Format ISO 'YYYY-MM-DD' to display 'DD/MM/YYYY'
  const formatDisplayDate = (isoString) => {
    if (!isoString) return '';
    const parts = isoString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return isoString;
  };

  const handleContainerClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      try {
        if (typeof inputRef.current.showPicker === 'function') {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
          inputRef.current.click();
        }
      } catch {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`relative flex items-center bg-white border border-slate-200 rounded-xl cursor-pointer transition-all hover:border-slate-300 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 ${
        disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Visual Formatted Display (DD/MM/YYYY) */}
      <div className="flex-1 px-3 py-2 text-xs select-none">
        {value ? (
          <span className="font-semibold text-slate-800 font-mono tracking-wide">
            {formatDisplayDate(value)}
          </span>
        ) : (
          <span className="text-slate-400 font-mono text-[11px]">{placeholder}</span>
        )}
      </div>

      <div className="pr-3 text-slate-400 pointer-events-none shrink-0">
        <Calendar className="w-4 h-4" />
      </div>

      {/* Real HTML5 native input (hidden visually but active for picker & forms) */}
      <input
        ref={inputRef}
        type="date"
        id={id}
        name={name}
        lang="en-GB"
        value={value || ''}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-auto cursor-pointer"
        tabIndex={0}
      />
    </div>
  );
};
