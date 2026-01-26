/**
 * Textarea Component
 * Multi-line text input with character counter
 */

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

const Textarea = ({
  label,
  name,
  placeholder,
  value = '',
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  maxLength,
  rows = 4,
  showCharCount = false,
  className,
  minCharWarning, // Destructure to prevent passing to DOM
  ...props
}) => {
  const [charCount, setCharCount] = useState(value.length);
  const showMinCharWarning = minCharWarning && charCount > 0 && charCount < minCharWarning;

  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setCharCount(newValue.length);
    if (onChange) {
      onChange(e);
    }
  };

  const getCharCountClass = () => {
    if (!maxLength) return '';
    const percentage = (charCount / maxLength) * 100;
    if (percentage >= 100) return 'error';
    if (percentage >= 90) return 'warning';
    return '';
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        className={clsx('form-control', error && 'error', className)}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />

      {/* Error and character count on SAME ROW */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '4px'
      }}>
        <span
          id={`${name}-error`}
          className="error-message"
          role="alert"
          style={{
            color: '#dc2626',
            fontSize: '0.85rem',
            visibility: (error || showMinCharWarning) ? 'visible' : 'hidden'
          }}
        >
          {error || (showMinCharWarning ? `Please provide more detail (minimum ${minCharWarning} characters)` : 'Placeholder')}
        </span>
        {(showCharCount || maxLength) && (
          <span className={clsx('char-counter', getCharCountClass())} style={{ color: '#6b7280', fontSize: '0.85rem' }}>
            {charCount}{maxLength ? ` / ${maxLength}` : ''} characters
          </span>
        )}
      </div>
    </div>
  );
};

export default Textarea;
