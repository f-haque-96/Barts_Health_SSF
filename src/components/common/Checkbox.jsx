/**
 * Checkbox Component
 * Single checkbox or checkbox group
 */

import React from 'react';
import clsx from 'clsx';

const Checkbox = ({
  label,
  name,
  checked = false,
  onChange,
  error,
  required = false,
  disabled = false,
  className,
  children,
  ...props
}) => {
  return (
    <div className="form-group">
      <label
        className={clsx('checkbox-label', disabled && 'disabled', className)}
      >
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />
        <span className="checkbox-text">
          {label || children}
          {required && <span className="required-asterisk">*</span>}
        </span>
      </label>

      {error && (
        <span id={`${name}-error`} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Checkbox;
