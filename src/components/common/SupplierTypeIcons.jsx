/**
 * Supplier Type Icons
 * Professional line-style SVG icons for supplier type cards
 */

import React from 'react';

// Limited Company - Office Building Icon
export const LimitedCompanyIcon = ({ size = 48, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9v.01" />
    <path d="M9 12v.01" />
    <path d="M9 15v.01" />
    <path d="M9 18v.01" />
  </svg>
);

// Charity/Non-Profit - Heart Icon
export const CharityIcon = ({ size = 48, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

// Sole Trader - Person with Briefcase Icon
export const SoleTraderIcon = ({ size = 48, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Person */}
    <circle cx="12" cy="7" r="3" />
    <path d="M12 10c-4 0-6 2-6 5v1h12v-1c0-3-2-5-6-5z" />
    {/* Briefcase below */}
    <rect x="8" y="17" width="8" height="5" rx="1" />
    <path d="M10 17v-1a2 2 0 0 1 4 0v1" />
  </svg>
);

// Public Sector - Government Building with Columns Icon
export const PublicSectorIcon = ({ size = 48, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21h18" />
    <path d="M4 21V10l8-6 8 6v11" />
    <path d="M6 21V13" />
    <path d="M10 21V13" />
    <path d="M14 21V13" />
    <path d="M18 21V13" />
    <path d="M12 4v3" />
    <path d="M4 10h16" />
  </svg>
);

// Icon map for easy access
export const SupplierIcons = {
  limited_company: LimitedCompanyIcon,
  charity: CharityIcon,
  sole_trader: SoleTraderIcon,
  public_sector: PublicSectorIcon,
};

// Helper component to render icon by type
export const SupplierIcon = ({ type, size = 48, color }) => {
  const IconComponent = SupplierIcons[type];
  return IconComponent ? <IconComponent size={size} color={color} /> : null;
};
