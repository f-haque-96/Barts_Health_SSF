/**
 * Contract Drafter Page
 * Allows contract drafter to upload the signed contract after OPW/IR35 determination
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Input, CheckIcon } from '../components/common';
import { formatDate } from '../utils/helpers';
import './ContractDrafterPage.css';

const ContractDrafterPage = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contractFile, setContractFile] = useState(null);
  const [uploadedBy, setUploadedBy] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load submission from localStorage
    const submissionData = localStorage.getItem(`submission_${submissionId}`);

    if (submissionData) {
      try {
        const parsed = JSON.parse(submissionData);
        setSubmission(parsed);

        // Check if contract already uploaded
        if (parsed.contractDrafter) {
          setIsSubmitted(true);
        }
      } catch (error) {
        console.error('Error parsing submission:', error);
      }
    }

    setLoading(false);
  }, [submissionId]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate PDF
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }

      setContractFile({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });
    }
  };

  const handleSubmit = () => {
    if (!contractFile) {
      alert('Please upload the contract document');
      return;
    }

    if (!uploadedBy.trim()) {
      alert('Please provide your signature (full name)');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedSubmission = {
        ...submission,
        contractDrafter: {
          contract: contractFile,
          uploadedBy,
          signature: uploadedBy,
          date: signatureDate,
          submittedAt: new Date().toISOString(),
        },
      };

      // Save to localStorage
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = submissions.findIndex((s) => s.submissionId === submissionId);
      if (index !== -1) {
        submissions[index].contractDrafter = updatedSubmission.contractDrafter;
        localStorage.setItem('all_submissions', JSON.stringify(submissions));
      }

      setSubmission(updatedSubmission);
      setIsSubmitted(true);

      alert('Contract uploaded successfully! AP Control has been notified.');
    } catch (error) {
      console.error('Error uploading contract:', error);
      alert('Failed to upload contract. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="contract-drafter-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="contract-drafter-page">
        <div className="error-message">
          <h2>Submission Not Found</h2>
          <p>Could not find submission with ID: {submissionId}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted || submission.contractDrafter) {
    return (
      <div className="contract-drafter-page">
        <div className="success-message">
          <div className="success-icon"><CheckIcon size={32} color="white" /></div>
          <h2>Contract Submitted</h2>
          <p>The contract has been uploaded and sent to AP Control for final approval.</p>
          <div className="submission-details">
            <p>
              <strong>Uploaded by:</strong> {submission.contractDrafter.uploadedBy}
            </p>
            <p>
              <strong>Upload date:</strong> {formatDate(submission.contractDrafter.submittedAt)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-drafter-page">
      <header className="page-header">
        <h1>Contract Agreement Upload</h1>
        <div className="submission-ref">Reference: {submissionId}</div>
      </header>

      {/* IR35 Assessment Summary */}
      <section className="summary-section">
        <h2>IR35 Assessment Summary</h2>
        <div className="summary-card">
          <div className="summary-field">
            <label>Supplier:</label>
            <span>{submission.formData?.companyName}</span>
          </div>
          <div className="summary-field">
            <label>IR35 Status:</label>
            <span
              className={`status-badge ${submission.opwReview?.determination === 'outside' ? 'outside' : 'inside'}`}
            >
              {submission.opwReview?.determination === 'inside' ? 'Inside IR35' : 'Outside IR35'}
            </span>
          </div>
          <div className="summary-field">
            <label>OPW Panel Decision:</label>
            <span className="status-badge approved">APPROVED</span>
          </div>
          {submission.opwReview?.rationale && (
            <div className="summary-field full-width">
              <label>Rationale:</label>
              <p>{submission.opwReview.rationale}</p>
            </div>
          )}
        </div>
      </section>

      {/* Contract Upload */}
      <section className="upload-section">
        <h2>Upload Contract/Agreement</h2>
        <p className="section-description">
          Please upload the signed contract or agreement for this supplier engagement.
        </p>

        <div className="upload-area">
          <input type="file" accept=".pdf" onChange={handleFileUpload} id="contract-upload" />
          <label htmlFor="contract-upload" className="upload-label">
            {contractFile ? (
              <div className="file-selected">
                <span className="file-icon" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: '#eff6ff',
                  borderRadius: '6px',
                  color: '#005EB8',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>PDF</span>
                <div className="file-info">
                  <span className="file-name">{contractFile.name}</span>
                  <span className="file-size">({(contractFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              </div>
            ) : (
              <div className="upload-prompt">
                <span className="upload-icon">⬆️</span>
                <span>Click to upload contract (PDF only)</span>
              </div>
            )}
          </label>
        </div>
      </section>

      {/* Signature */}
      <section className="signature-section">
        <h2>Your Signature</h2>
        <div className="signature-fields">
          <Input
            label="Full Name (as signature) *"
            type="text"
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            placeholder="Type your full name"
            required
          />
          <Input
            label="Date *"
            type="date"
            value={signatureDate}
            onChange={(e) => setSignatureDate(e.target.value)}
            required
          />
        </div>
        <p className="signature-disclaimer">
          By typing your name, you confirm you have reviewed the IR35 assessment and are authorizing this
          contract/agreement.
        </p>
      </section>

      {/* Submit Button */}
      <div className="submit-section">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!contractFile || !uploadedBy.trim() || isSubmitting}
          style={{ fontSize: '1rem', padding: '12px 32px' }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Contract & Send to AP Control'}
        </Button>
      </div>
    </div>
  );
};

export default ContractDrafterPage;
