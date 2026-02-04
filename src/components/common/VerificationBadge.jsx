/**
 * VerificationBadge Component
 * Displays verification status for CRN-verified companies
 */

import React from 'react';
import { CheckIcon, WarningIcon } from './Icons';
import './VerificationBadge.css';

const VerificationBadge = ({ companyStatus, size = 'medium', showLabel = true }) => {
  // Determine if company is verified (active)
  const isVerified = companyStatus && companyStatus.toLowerCase() === 'active';

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const badgeClass = isVerified ? 'verification-badge verified' : 'verification-badge needs-verification';
  const sizeClass = `badge-${size}`;

  return (
    <div className={`${badgeClass} ${sizeClass}`}>
      {isVerified ? (
        <>
          <CheckIcon size={size === 'small' ? 12 : size === 'large' ? 18 : 14} color="#059669" />
          {showLabel && <span>Verified</span>}
        </>
      ) : (
        <>
          <WarningIcon size={size === 'small' ? 12 : size === 'large' ? 18 : 14} color="#d97706" />
          {showLabel && <span>Verification Needed</span>}
        </>
      )}
      {companyStatus && (
        <small className="company-status">({formatStatus(companyStatus)})</small>
      )}
    </div>
  );
};

export default VerificationBadge;
