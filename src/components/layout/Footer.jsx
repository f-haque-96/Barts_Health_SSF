/**
 * Footer Component
 * Updated: Mar 2026 - CI compliance
 * Simple footer with copyright
 */

import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>© {currentYear} Barts Health NHS Trust. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
