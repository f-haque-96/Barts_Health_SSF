/**
 * Input Component
 * Text input with label, error handling, and validation support
 */

import React from 'react';
import clsx from 'clsx';
import Tooltip from './Tooltip';

const Input = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  className,
  tooltip,
  maxLength,
  ...props
}) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
          {tooltip && <Tooltip content={tooltip} />}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        className={clsx('form-control', error && 'error', className)}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />

      {error && (
        <span id={`${name}-error`} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
