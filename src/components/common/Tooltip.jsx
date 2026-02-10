/**
 * Tooltip Component
 * Accessible tooltip with mobile/touch and keyboard support
 * UI-03: Enhanced tooltips for better UX
 */

import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);

  // UI-03: Handle click outside to close tooltip on mobile
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  // UI-03: Toggle tooltip on click for mobile/touch devices
  const handleClick = (e) => {
    e.stopPropagation();
    setIsVisible((prev) => !prev);
  };

  return (
    <span
      ref={tooltipRef}
      className="tooltip"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={handleClick}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="button"
      aria-label="Show help text"
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
    >
      {children || <span className="tooltip-icon">?</span>}

      {isVisible && (
        <span
          role="tooltip"
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: 'var(--nhs-dark-grey)',
            color: 'white',
            fontSize: 'var(--font-size-sm)',
            borderRadius: 'var(--radius-base)',
            whiteSpace: 'normal',
            maxWidth: '300px',
            width: 'max-content',
            zIndex: 'var(--z-tooltip)',
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'none',
          }}
        >
          {content}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--nhs-dark-grey)',
            }}
          />
        </span>
      )}
    </span>
  );
};

export default Tooltip;
