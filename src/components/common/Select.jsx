/**
 * Select Component
 * Dropdown select with label and error handling
 * React 19: ref is a regular prop - no forwardRef needed
 */

import React from 'react';
import clsx from 'clsx';

const Select = ({
  label,
  name,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  className,
  ref,
  ...props
}) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        className={clsx('form-control', error && 'error', className)}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        ref={ref}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option
            key={typeof option === 'string' ? option : option.value}
            value={typeof option === 'string' ? option : option.value}
            disabled={option.disabled}
          >
            {typeof option === 'string' ? option : option.label}
          </option>
        ))}
      </select>

      {error && (
        <span id={`${name}-error`} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;
