/**
 * Secure Review Page Wrapper
 * Fetches submission data with authorization checks before rendering child components
 *
 * CRITICAL: This ensures data is only shown after auth verification
 */

import React, { useState, useEffect, cloneElement } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import storage from '../../services/StorageProvider';

const SecureReviewPage = ({
  children,
  requiredRole,
  loadingComponent,
  errorComponent
}) => {
  const { submissionId, id } = useParams();
  const { user, hasRole, canAccessSubmission, loading: authLoading } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use either submissionId or id from params
  const actualId = submissionId || id;

  useEffect(() => {
    const fetchSubmission = async () => {
      // Wait for auth to complete
      if (authLoading) return;

      try {
        // First check role if required
        if (requiredRole && !hasRole(requiredRole)) {
          setError({
            type: 'ACCESS_DENIED',
            message: 'You do not have the required role to access this page.'
          });
          setLoading(false);
          return;
        }

        // Fetch submission
        const data = await storage.getSubmission(actualId);

        if (!data) {
          setError({
            type: 'NOT_FOUND',
            message: 'Submission not found.'
          });
          setLoading(false);
          return;
        }

        // Check if user can access this specific submission
        if (!canAccessSubmission(data)) {
          setError({
            type: 'ACCESS_DENIED',
            message: 'You do not have permission to view this submission.'
          });
          setLoading(false);
          return;
        }

        setSubmission(data);
      } catch (err) {
        console.error('Failed to fetch submission:', err);

        if (err.message === 'ACCESS_DENIED') {
          setError({
            type: 'ACCESS_DENIED',
            message: 'Access denied by server.'
          });
        } else if (err.message === 'UNAUTHORIZED') {
          setError({
            type: 'UNAUTHORIZED',
            message: 'Please log in to continue.'
          });
        } else {
          setError({
            type: 'ERROR',
            message: 'Failed to load submission. Please try again.'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [actualId, requiredRole, hasRole, canAccessSubmission, authLoading]);

  // Loading state
  if (loading || authLoading) {
    if (loadingComponent) return loadingComponent;

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#005EB8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '16px', color: '#6b7280' }}>
          Loading submission...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    if (errorComponent) return errorComponent;

    return (
      <div style={{
        maxWidth: '600px',
        margin: '80px auto',
        padding: '40px',
        textAlign: 'center'
      }}>
        {error.type === 'ACCESS_DENIED' && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '32px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h1 style={{ color: '#dc2626', marginBottom: '16px', fontSize: '1.5rem' }}>
              Access Denied
            </h1>
            <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>{error.message}</p>
            <p style={{ color: '#991b1b', fontSize: '0.875rem' }}>
              Reference: <strong>{actualId}</strong>
            </p>
            <p style={{ color: '#991b1b', fontSize: '0.875rem', marginTop: '8px' }}>
              If you need access, please contact the Procurement team.
            </p>
          </div>
        )}

        {error.type === 'NOT_FOUND' && (
          <div style={{
            background: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: '12px',
            padding: '32px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 16px',
              background: '#fef9c3',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h1 style={{ color: '#854d0e', marginBottom: '16px', fontSize: '1.5rem' }}>
              Submission Not Found
            </h1>
            <p style={{ color: '#78350f' }}>{error.message}</p>
            <p style={{ color: '#78350f', fontSize: '0.875rem', marginTop: '8px' }}>
              Reference: <strong>{actualId}</strong>
            </p>
          </div>
        )}

        {error.type === 'UNAUTHORIZED' && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '32px'
          }}>
            <h1 style={{ color: '#dc2626', marginBottom: '16px', fontSize: '1.5rem' }}>
              Authentication Required
            </h1>
            <p style={{ color: '#7f1d1d' }}>{error.message}</p>
            <p style={{ color: '#991b1b', fontSize: '0.875rem', marginTop: '8px' }}>
              Please ensure you are connected to the NHS network.
            </p>
          </div>
        )}

        {error.type === 'ERROR' && (
          <div style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '32px'
          }}>
            <h1 style={{ color: '#374151', marginBottom: '16px', fontSize: '1.5rem' }}>
              Error
            </h1>
            <p style={{ color: '#4b5563' }}>{error.message}</p>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a
            href="/"
            style={{
              padding: '12px 24px',
              background: '#005EB8',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            Return to Home
          </a>
          <button
            onClick={() => window.location.reload()}
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
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Clone children and pass submission, setSubmission, and user as props
  return cloneElement(children, {
    submission,
    setSubmission,
    user,
    submissionId: actualId
  });
};

export default SecureReviewPage;
