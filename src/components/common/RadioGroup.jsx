/**
 * RadioGroup Component
 * Radio button group with NHS styling
 */

import React from 'react';
import clsx from 'clsx';

const RadioGroup = ({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  horizontal = false,
  className,
  ...props
}) => {
  const handleChange = (optionValue) => {
    if (!disabled) {
      onChange(optionValue);
    }
  };

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      <div
        className={clsx(
          'radio-group',
          horizontal && 'horizontal',
          className
        )}
        role="radiogroup"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const optionTooltip = typeof option === 'object' ? option.tooltip : undefined;
          const isChecked = value === optionValue;

          // If option has a tooltip, wrap in tooltip container
          if (optionTooltip) {
            return (
              <div key={optionValue} className="radio-option-with-tooltip">
                <label className={clsx('radio-label', disabled && 'disabled')}>
                  <input
                    type="radio"
                    name={name}
                    value={optionValue}
                    checked={isChecked}
                    onChange={() => handleChange(optionValue)}
                    disabled={disabled}
                    {...props}
                  />
                  <span className="radio-text">{optionLabel}</span>
                </label>
                <div className="radio-tooltip">{optionTooltip}</div>
              </div>
            );
          }

          // Regular option without tooltip
          return (
            <label
              key={optionValue}
              className={clsx('radio-label', disabled && 'disabled')}
            >
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={isChecked}
                onChange={() => handleChange(optionValue)}
                disabled={disabled}
                {...props}
              />
              <span className="radio-text">{optionLabel}</span>
            </label>
          );
        })}
      </div>

      {error && (
        <span id={`${name}-error`} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default RadioGroup;
