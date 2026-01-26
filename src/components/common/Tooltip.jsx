/**
 * Tooltip Component
 * Simple tooltip for help text
 */

import React, { useState } from 'react';

const Tooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="tooltip"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {children || <span className="tooltip-icon">?</span>}

      {isVisible && (
        <span
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
            whiteSpace: 'nowrap',
            zIndex: 'var(--z-tooltip)',
            boxShadow: 'var(--shadow-lg)',
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
