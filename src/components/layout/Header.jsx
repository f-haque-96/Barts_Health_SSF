/**
 * Header Component
 * NHS header with Barts Health logo and form title
 */

import React from 'react';

const Header = () => {
  return (
    <header className="nhs-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">Supplier Setup Form</h1>
          <span className="version-badge">V6</span>
        </div>
        <div className="header-right">
          <img
            src="/barts-logo.png"
            alt="Barts Health NHS Trust Logo"
            className="nhs-logo-img"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
