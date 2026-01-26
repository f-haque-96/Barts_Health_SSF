/**
 * ApprovalStamp Component
 * Visual stamp for approval/rejection/pending status
 */

import React from 'react';

const ApprovalStamp = ({
  status = 'pending', // 'approved', 'rejected', 'pending'
  date = null,
  approver = null,
  size = 'medium', // 'small', 'medium', 'large'
  className = '',
}) => {
  const stampConfigs = {
    approved: {
      label: 'APPROVED',
      color: '#007F3B',
      bgColor: '#E8F5E9',
      borderColor: '#4CAF50',
      rotation: -5,
    },
    rejected: {
      label: 'REJECTED',
      color: '#DA291C',
      bgColor: '#FFEBEE',
      borderColor: '#D32F2F',
      rotation: 5,
    },
    pending: {
      label: 'PENDING REVIEW',
      color: '#FAE100',
      bgColor: '#FFFDE7',
      borderColor: '#FBC02D',
      rotation: 0,
    },
  };

  const sizeConfigs = {
    small: {
      width: '120px',
      height: '80px',
      fontSize: '14px',
      padding: '8px',
      borderWidth: '3px',
      metaFontSize: '8px',
    },
    medium: {
      width: '180px',
      height: '120px',
      fontSize: '20px',
      padding: '12px',
      borderWidth: '4px',
      metaFontSize: '10px',
    },
    large: {
      width: '240px',
      height: '160px',
      fontSize: '28px',
      padding: '16px',
      borderWidth: '5px',
      metaFontSize: '12px',
    },
  };

  const config = stampConfigs[status] || stampConfigs.pending;
  const sizeConfig = sizeConfigs[size] || sizeConfigs.medium;

  const stampStyle = {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: sizeConfig.width,
    height: sizeConfig.height,
    padding: sizeConfig.padding,
    backgroundColor: config.bgColor,
    border: `${sizeConfig.borderWidth} solid ${config.borderColor}`,
    borderRadius: '12px',
    transform: `rotate(${config.rotation}deg)`,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    opacity: 0.95,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    textAlign: 'center',
    userSelect: 'none',
  };

  const labelStyle = {
    fontSize: sizeConfig.fontSize,
    fontWeight: 'bold',
    color: config.color,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    lineHeight: 1.2,
    textShadow: `1px 1px 2px rgba(0, 0, 0, 0.1)`,
  };

  const metaStyle = {
    fontSize: sizeConfig.metaFontSize,
    color: config.color,
    marginTop: '4px',
    opacity: 0.8,
  };

  return (
    <div className={`approval-stamp ${className}`} style={stampStyle}>
      <div style={labelStyle}>{config.label}</div>
      {date && (
        <div style={metaStyle}>
          {new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      )}
      {approver && (
        <div style={metaStyle}>{approver}</div>
      )}
    </div>
  );
};

export default ApprovalStamp;
