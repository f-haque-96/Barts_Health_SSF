/**
 * NoticeBox Component
 * Informational notice boxes with different types
 */

import React from 'react';
import clsx from 'clsx';
import { InfoIcon, WarningIcon, CircleXIcon, CircleCheckIcon } from './Icons';

const NoticeBox = ({
  type = 'info', // 'info' | 'warning' | 'error' | 'success'
  children,
  className,
  ...props
}) => {
  const iconColors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    success: '#22c55e',
  };

  const IconComponent = {
    info: InfoIcon,
    warning: WarningIcon,
    error: CircleXIcon,
    success: CircleCheckIcon,
  }[type];

  return (
    <div
      className={clsx('notice-box', `notice-box--${type}`, className)}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <IconComponent size={20} color={iconColors[type]} />
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
};

export default NoticeBox;
