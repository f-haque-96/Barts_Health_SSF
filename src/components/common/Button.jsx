/**
 * Button Component
 * Reusable button with multiple variants following NHS design system
 */

import React from 'react';
import clsx from 'clsx';

const Button = ({
  children,
  variant = 'primary',
  size = 'base',
  type = 'button',
  disabled = false,
  loading = false,
  icon,
  onClick,
  className,
  ...props
}) => {
  const buttonClasses = clsx(
    'btn',
    `btn--${variant}`,
    size !== 'base' && `btn--${size}`,
    className
  );

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="loading" />}
      {icon && !loading && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
