/**
 * Protected Route Component
 * Wraps routes that require authentication and/or specific roles
 *
 * CRITICAL: This is the frontend guard. The API must also enforce access control.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({
  children,
  requiredRole,
  requiredRoles,
  fallback,
  redirectTo = '/unauthorized'
}) => {
  const { user, loading, hasRole, hasAnyRole, isAuthenticated } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#005EB8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{
          marginTop: '16px',
          color: '#6b7280',
          fontSize: '1rem'
        }}>
          Verifying access...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated - redirect to unauthorized or use fallback
  if (!isAuthenticated) {
    if (fallback) return fallback;
    return <Navigate to={redirectTo} replace />;
  }

  // Check single required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <AccessDeniedPage
        message="You do not have the required role to access this page."
        userEmail={user?.email}
      />
    );
  }

  // Check multiple required roles (user needs at least one)
  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <AccessDeniedPage
        message="You do not have permission to access this page."
        userEmail={user?.email}
      />
    );
  }

  return children;
};

/**
 * Access Denied Component
 * Shown when user is authenticated but lacks required role
 */
const AccessDeniedPage = ({ message, userEmail }) => {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '100px auto',
      padding: '40px',
      textAlign: 'center',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '12px'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        margin: '0 auto 24px',
        background: '#fee2e2',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>

      <h1 style={{
        color: '#dc2626',
        marginBottom: '16px',
        fontSize: '1.75rem',
        fontWeight: '600'
      }}>
        Access Denied
      </h1>

      <p style={{
        color: '#7f1d1d',
        marginBottom: '24px',
        fontSize: '1rem',
        lineHeight: '1.6'
      }}>
        {message}
      </p>

      {userEmail && (
        <p style={{
          color: '#991b1b',
          fontSize: '0.875rem',
          marginBottom: '8px'
        }}>
          Logged in as: <strong>{userEmail}</strong>
        </p>
      )}

      <p style={{
        color: '#991b1b',
        fontSize: '0.875rem',
        marginBottom: '32px'
      }}>
        If you believe this is an error, please contact the Procurement team or IT Support.
      </p>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a
          href="/"
          style={{
            padding: '12px 24px',
            background: '#005EB8',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '500',
            display: 'inline-block'
          }}
        >
          Return to Home
        </a>
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '12px 24px',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;
