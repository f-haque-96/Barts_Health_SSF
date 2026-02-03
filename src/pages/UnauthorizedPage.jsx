/**
 * Unauthorized Page
 * Shown when user is not authenticated
 */

import React from 'react';

const UnauthorizedPage = () => {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '100px auto',
      padding: '40px',
      textAlign: 'center'
    }}>
      <div style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '40px'
      }}>
        {/* NHS Logo placeholder */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          background: '#005EB8',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.5rem'
        }}>
          NHS
        </div>

        <h1 style={{
          color: '#dc2626',
          marginBottom: '16px',
          fontSize: '2rem'
        }}>
          Authentication Required
        </h1>

        <p style={{
          color: '#7f1d1d',
          marginBottom: '24px',
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}>
          You must be logged in to access this page.
        </p>

        <div style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            color: '#9a3412',
            fontSize: '0.95rem',
            margin: 0,
            lineHeight: '1.6'
          }}>
            <strong>Please ensure you are:</strong>
          </p>
          <ul style={{
            color: '#9a3412',
            fontSize: '0.95rem',
            margin: '8px 0 0 0',
            paddingLeft: '20px',
            textAlign: 'left'
          }}>
            <li>Connected to the Barts Health network (or VPN)</li>
            <li>Logged into WeShare/VerseOne</li>
            <li>Using an NHS Trust device or approved personal device</li>
          </ul>
        </div>

        <p style={{
          color: '#991b1b',
          fontSize: '0.9rem',
          marginBottom: '24px'
        }}>
          If you continue to experience issues, please contact IT Support.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: '#005EB8',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            Return to Home
          </a>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '14px 28px',
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retry Login
          </button>
        </div>
      </div>

      {/* Support Contact */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          <strong>Need Help?</strong><br />
          Contact IT Service Desk or email{' '}
          <a href="mailto:it.servicedesk@nhs.net" style={{ color: '#005EB8' }}>
            it.servicedesk@nhs.net
          </a>
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
