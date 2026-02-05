/**
 * RejectionBanner Component
 * Displays rejection notice to requester when their submission was rejected
 * Shows flagging warning and provides "Submit Another Supplier" button
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon } from './Icons';
import Button from './Button';
import './RejectionBanner.css';

const RejectionBanner = ({ rejection, onDismiss, onSubmitAnother }) => {
  const navigate = useNavigate();

  if (!rejection) return null;

  const {
    submissionId,
    rejectedBy,
    rejectedByRole,
    rejectionReason,
    rejectionDate,
    supplierName,
  } = rejection;

  return (
    <div className="rejection-banner-overlay">
      <div className="rejection-banner">
        <div className="rejection-banner-header">
          <div className="rejection-banner-title">
            <XIcon size={24} color="#dc2626" />
            <h2>Submission Rejected by {rejectedByRole}</h2>
          </div>
          <button
            className="rejection-banner-close"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        <div className="rejection-banner-body">
          <p className="rejection-banner-message">
            Your submission for <strong>{supplierName}</strong> was rejected at the{' '}
            {rejectedByRole} Review stage and cannot proceed further.
          </p>

          <div className="rejection-details">
            <div className="rejection-detail-row">
              <span className="rejection-label">Rejected by:</span>
              <span className="rejection-value">{rejectedBy}</span>
            </div>
            <div className="rejection-detail-row">
              <span className="rejection-label">Date:</span>
              <span className="rejection-value">
                {new Date(rejectionDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="rejection-detail-row">
              <span className="rejection-label">Reason:</span>
              <span className="rejection-value">{rejectionReason}</span>
            </div>
          </div>

          <div className="rejection-warning">
            <strong>⚠ Supplier Flagged:</strong> This supplier has been flagged in our system.
            If you attempt to set up this supplier or a similar supplier in the future, it will be
            detected and may require additional justification or approval.
          </div>

          <p className="rejection-next-steps">
            Please review the feedback above and address the issues identified before attempting to
            resubmit. If you have questions, contact the Procurement Helpdesk.
          </p>

          <div className="rejection-banner-actions">
            <Button
              variant="secondary"
              onClick={() => navigate(`/respond/${submissionId}`)}
            >
              View Full Details
            </Button>
            <Button variant="primary" onClick={onSubmitAnother}>
              Submit Another Supplier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectionBanner;
