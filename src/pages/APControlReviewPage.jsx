/**
 * AP (Accounts Payable) Control Review Page
 * Verifies supplier banking and financial details before system setup
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button, NoticeBox, ApprovalStamp, Checkbox, Textarea, SignatureSection, Input, CheckIcon, XIcon, WarningIcon, ClockIcon, DocumentIcon, DownloadIcon, LockIcon, CircleXIcon, VerificationBadge } from '../components/common';
import { formatDate, formatCurrency } from '../utils/helpers';
import { formatFieldValue, formatSupplierType, formatServiceTypes, formatEmployeeCount } from '../utils/formatters';
import SupplierFormPDF from '../components/pdf/SupplierFormPDF';
import { closeAlembaOnCompletion, sendRejectionNotification } from '../services/notificationService';

const ReviewItem = ({ label, value, highlight, raw = false, badge }) => {
  if (!value && value !== 0) return null;

  // Format the value unless raw is true (for pre-formatted values)
  const displayValue = raw ? value : formatFieldValue(value);

  return (
    <div style={{ display: 'flex', marginBottom: 'var(--space-8)' }}>
      <div style={{ fontWeight: 'var(--font-weight-medium)', minWidth: '200px', color: 'var(--color-text-secondary)' }}>
        {label}:
      </div>
      <div style={{
        color: 'var(--color-text)',
        fontWeight: highlight ? 'var(--font-weight-semibold)' : 'normal',
        backgroundColor: highlight ? '#FFF9E6' : 'transparent',
        padding: highlight ? '2px 8px' : '0',
        paddingLeft: highlight ? '8px' : '16px',
        borderRadius: highlight ? 'var(--radius-sm)' : '0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {displayValue}
        {badge}
      </div>
    </div>
  );
};

// CRN Status Badge Component
const CRNStatusBadge = ({ crn, verificationData }) => {
  if (!crn) return null;

  // Get company status from verification data
  const companyStatus = verificationData?.status || null;

  // Companies House URL
  const companiesHouseUrl = `https://find-and-update.company-information.service.gov.uk/company/${crn.replace(/\s/g, '').toUpperCase()}`;

  // Wrap badge in link to Companies House
  const badge = <VerificationBadge companyStatus={companyStatus} size="small" showLabel={true} />;

  return (
    <a
      href={companiesHouseUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', cursor: 'pointer' }}
      title="View on Companies House (opens in new tab)"
    >
      {badge}
    </a>
  );
};

const ReviewCard = ({ title, children, highlight }) => {
  return (
    <div
      style={{
        padding: 'var(--space-24)',
        borderRadius: 'var(--radius-base)',
        border: highlight ? '2px solid var(--color-warning)' : '2px solid var(--color-border)',
        marginBottom: 'var(--space-16)',
        backgroundColor: highlight ? '#FFF9E6' : 'var(--color-surface)',
      }}
    >
      <h4 style={{ margin: '0 0 var(--space-16) 0', color: 'var(--nhs-blue)' }}>
        {title}
      </h4>
      <div>{children}</div>
    </div>
  );
};

const APControlReviewPage = ({
  submission: propSubmission,
  setSubmission: propSetSubmission,
  readOnly = false
}) => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  // Use props if provided (from SecureReviewPage), otherwise use local state
  const [localSubmission, setLocalSubmission] = useState(null);
  const submission = propSubmission || localSubmission;
  const setSubmission = propSetSubmission || setLocalSubmission;
  const [loading, setLoading] = useState(!propSubmission);
  const [bankDetailsVerified, setBankDetailsVerified] = useState(false);
  const [companyDetailsVerified, setCompanyDetailsVerified] = useState(false);
  const [vatVerified, setVatVerified] = useState(false);
  const [cisVerified, setCisVerified] = useState(false);
  const [insuranceVerified, setInsuranceVerified] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [supplierNumber, setSupplierNumber] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionSection, setShowRejectionSection] = useState(false);
  const [actionType, setActionType] = useState(null); // null, 'complete', 'reject'

  // Function to get full submission with ALL authorisations for PDF
  const getFullSubmissionForPDF = () => {
    // Try different localStorage key formats
    let storedSubmission = localStorage.getItem(`submission_${submissionId}`);

    if (!storedSubmission) {
      storedSubmission = localStorage.getItem(`submission-${submissionId}`);
    }

    if (!storedSubmission) {
      storedSubmission = localStorage.getItem(submissionId);
    }

    const currentSubmission = storedSubmission ? JSON.parse(storedSubmission) : submission;

    // Ensure formData structure exists with proper fallbacks
    const formData = currentSubmission?.formData || {};
    const companyNameFallback = formData?.section4?.companyName
      || formData?.companyName
      || currentSubmission?.companyName
      || supplierName
      || 'Unknown Company';

    // Get existing AP review from localStorage/state, or build from current form state
    const existingApReview = currentSubmission?.apControlReview || submission?.apControlReview;
    const apControlReviewForPDF = existingApReview ? {
      ...existingApReview,
      // Override with current state values if they exist
      supplierName: supplierName || existingApReview.supplierName || companyNameFallback,
      supplierNumber: supplierNumber || existingApReview.supplierNumber || '',
      signature: signatureName || existingApReview.signature || existingApReview.signatureName || '',
      date: signatureDate || existingApReview.date || new Date().toISOString().split('T')[0],
    } : {
      supplierName: supplierName || companyNameFallback,
      supplierNumber: supplierNumber || '',
      decision: 'approved',
      signature: signatureName || '',
      date: signatureDate || new Date().toISOString().split('T')[0],
      bankDetailsVerified,
      companyDetailsVerified,
      vatVerified,
      cisVerified,
      insuranceVerified,
      notes,
      submittedAt: new Date().toISOString()
    };

    const fullSubmission = {
      ...currentSubmission,
      formData: {
        ...formData,
        // Ensure all section data is present
        section1: formData?.section1 || {},
        section2: formData?.section2 || {},
        section3: formData?.section3 || {},
        section4: {
          ...(formData?.section4 || {}),
          companyName: companyNameFallback,
        },
        section5: formData?.section5 || {},
        section6: formData?.section6 || {},
        section7: formData?.section7 || {},
      },
      // Preserve all authorisation reviews
      pbpReview: currentSubmission?.pbpReview || null,
      procurementReview: currentSubmission?.procurementReview || null,
      opwReview: currentSubmission?.opwReview || null,
      contractDrafter: currentSubmission?.contractDrafter || null,
      // Include AP review with proper signature
      apControlReview: apControlReviewForPDF,
      // Include supplier number at root level for PDF cover page
      supplierNumber: supplierNumber || existingApReview?.supplierNumber || '',
      // Uploads
      uploadedFiles: currentSubmission?.uploadedFiles || currentSubmission?.uploads || {},
    };

    return fullSubmission;
  };

  // Handle document preview
  const handlePreviewDocument = (file) => {
    if (!file) {
      alert('No document available to preview');
      return;
    }

    // Check multiple possible locations for the base64 data
    const base64Data = file.base64 || file.data || file.content;

    if (!base64Data) {
      console.error('No base64 data found in file:', file);
      alert('Document data not available for preview. The file may need to be re-uploaded.');
      return;
    }

    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Please allow popups to preview documents');
      return;
    }

    // Determine file type from MIME type or name
    const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    const isImage = file.type?.startsWith('image/') || file.name?.match(/\.(png|jpg|jpeg|gif)$/i);

    if (isPDF) {
      // For PDFs, create an iframe
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${file.name || 'Document Preview'}</title>
            <style>
              body { margin: 0; padding: 0; height: 100vh; }
              iframe { width: 100%; height: 100%; border: none; }
            </style>
          </head>
          <body>
            <iframe src="${base64Data}"></iframe>
          </body>
        </html>
      `);
    } else if (isImage) {
      // For images, display directly
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${file.name || 'Image Preview'}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f3f4f6;
              }
              img {
                max-width: 95%;
                max-height: 95vh;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              }
            </style>
          </head>
          <body>
            <img src="${base64Data}" alt="${file.name || 'Preview'}" />
          </body>
        </html>
      `);
    } else {
      newWindow.close();
      alert('Preview not available for this file type');
    }

    newWindow.document.close();
  };

  useEffect(() => {
    // Skip localStorage loading if submission provided via props
    if (propSubmission) {
      // Pre-fill supplier name from form data
      if (propSubmission.formData?.companyName) {
        setSupplierName(propSubmission.formData.companyName);
      }

      // Pre-fill if already verified
      if (propSubmission.apControlReview) {
        setBankDetailsVerified(propSubmission.apControlReview.bankDetailsVerified);
        setCompanyDetailsVerified(propSubmission.apControlReview.companyDetailsVerified);
        setVatVerified(propSubmission.apControlReview.vatVerified || false);
        setCisVerified(propSubmission.apControlReview.cisVerified || false);
        setInsuranceVerified(propSubmission.apControlReview.insuranceVerified || false);
        setNotes(propSubmission.apControlReview.notes || '');
        setSupplierName(propSubmission.apControlReview.supplierName || propSubmission.formData?.companyName || '');
        setSupplierNumber(propSubmission.apControlReview.supplierNumber || '');
        setAdditionalInfo(propSubmission.apControlReview.additionalInfo || '');
      }
      setLoading(false);
      return;
    }
    // Load submission from localStorage
    const submissionData = localStorage.getItem(`submission_${submissionId}`);

    if (submissionData) {
      try {
        const parsed = JSON.parse(submissionData);
        setSubmission(parsed);

        // Pre-fill supplier name from form data
        if (parsed.formData?.companyName) {
          setSupplierName(parsed.formData.companyName);
        }

        // Pre-fill if already verified
        if (parsed.apControlReview) {
          setBankDetailsVerified(parsed.apControlReview.bankDetailsVerified);
          setCompanyDetailsVerified(parsed.apControlReview.companyDetailsVerified);
          setVatVerified(parsed.apControlReview.vatVerified || false);
          setCisVerified(parsed.apControlReview.cisVerified || false);
          setInsuranceVerified(parsed.apControlReview.insuranceVerified || false);
          setNotes(parsed.apControlReview.notes || '');
          setSupplierName(parsed.apControlReview.supplierName || parsed.formData?.companyName || '');
          setSupplierNumber(parsed.apControlReview.supplierNumber || '');
          setAdditionalInfo(parsed.apControlReview.additionalInfo || '');
        }
      } catch (error) {
        console.error('Error parsing submission:', error);
      }
    }

    setLoading(false);
  }, [submissionId, propSubmission]);

  const handleSubmitVerification = async () => {
    if (!signatureName.trim()) {
      alert('Please provide your digital signature (full name)');
      return;
    }

    if (!signatureDate) {
      alert('Please select a date for your signature');
      return;
    }

    if (!bankDetailsVerified) {
      alert('Bank details verification is required');
      return;
    }

    if (!companyDetailsVerified) {
      alert('Company details verification is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Load fresh from localStorage to get any updates
      const currentSubmission = JSON.parse(localStorage.getItem(`submission_${submissionId}`)) || submission;

      const completedTimestamp = new Date().toISOString();

      // Update submission with AP review
      const updatedSubmission = {
        ...currentSubmission, // Use fresh data from localStorage
        // Add AP review (using apControlReview to match workflow expectations)
        apControlReview: {
          bankDetailsVerified,
          companyDetailsVerified,
          vatVerified,
          cisVerified,
          insuranceVerified,
          notes,
          supplierName,
          supplierNumber,
          signature: signatureName,
          date: signatureDate,
          decision: 'approved',
          reviewedBy: 'AP Control Team', // In real app, this would come from auth
          reviewedAt: completedTimestamp,
          verified: true, // CRITICAL: workflow checks for this field
          completedAt: completedTimestamp, // Workflow checks for this
        },
        // Update workflow status - CRITICAL for RequesterResponsePage workflow display
        currentStage: 'complete', // Move to final stage
        finalStatus: 'complete', // Mark as complete
        vendorNumber: supplierNumber, // Assign vendor number
        completedAt: completedTimestamp, // Record completion date
        apStatus: 'verified', // Legacy status field
      };

      // Save back to localStorage
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = submissions.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        submissions[index].apStatus = 'verified';
        submissions[index].currentStage = 'complete';
        submissions[index].finalStatus = 'complete';
        submissions[index].vendorNumber = supplierNumber;
        submissions[index].completedAt = completedTimestamp;
        localStorage.setItem('all_submissions', JSON.stringify(submissions));
      }

      setSubmission(updatedSubmission);

      // Auto-download complete PDF after a short delay to ensure state is updated
      setTimeout(() => {
        const downloadLink = document.getElementById('ap-complete-pdf-download');
        if (downloadLink) {
          downloadLink.click();
        }
      }, 1000);

      alert('AP Verification Complete! The complete PDF has been downloaded. In production, this will also be emailed to the requester.');
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!signatureName.trim()) {
      alert('Please provide your digital signature (full name)');
      return;
    }

    const confirmReject = window.confirm(
      'Are you sure you want to reject this supplier request?\n\n' +
      'This action will notify the requester and close the request.'
    );

    if (!confirmReject) return;

    setIsSubmitting(true);

    try {
      // Load fresh from localStorage
      const currentSubmission = JSON.parse(localStorage.getItem(`submission_${submissionId}`)) || submission;

      // Build AP rejection data
      const apControlReviewData = {
        decision: 'rejected',
        rejectionReason,
        signature: signatureName,
        date: signatureDate,
        reviewedBy: 'AP Control Team',
        reviewedAt: new Date().toISOString(),
      };

      // Update submission with rejection
      const updatedSubmission = {
        ...currentSubmission,
        apControlReview: apControlReviewData,
        status: 'Rejected_AP',
        currentStage: 'Rejected',
      };

      // Save to localStorage
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = submissions.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        submissions[index].status = 'rejected';
        submissions[index].rejectedBy = 'AP Control';
        localStorage.setItem('all_submissions', JSON.stringify(submissions));
      }

      // Send rejection notification
      const supplierName = currentSubmission?.formData?.companyName ||
        currentSubmission?.formData?.section4?.companyName ||
        'Unknown Supplier';
      const requesterEmail = currentSubmission?.formData?.nhsEmail ||
        currentSubmission?.formData?.section1?.nhsEmail;
      const requesterName = `${currentSubmission?.formData?.firstName || currentSubmission?.formData?.section1?.firstName || ''} ${currentSubmission?.formData?.lastName || currentSubmission?.formData?.section1?.lastName || ''}`.trim();
      const alembaReference = currentSubmission?.alembaReference;

      if (requesterEmail) {
        sendRejectionNotification({
          submissionId,
          requesterEmail,
          requesterName,
          supplierName,
          rejectedBy: signatureName,
          rejectedByRole: 'AP Control',
          rejectionReason,
          rejectionDate: new Date().toISOString(),
          alembaReference,
        });
      }

      // Close Alemba ticket if exists
      if (alembaReference) {
        closeAlembaOnCompletion({
          alembaReference,
          submissionId,
          supplierName,
          vendorNumber: null,
          completedBy: signatureName,
        });
      }

      setSubmission(updatedSubmission);
      alert('Supplier request has been rejected. The requester has been notified.');
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Failed to reject submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-32)', textAlign: 'center' }}>
        <div className="loading" style={{ width: '48px', height: '48px', margin: '0 auto' }} />
        <p style={{ marginTop: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          Loading submission...
        </p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div style={{ padding: 'var(--space-32)' }}>
        <NoticeBox type="error">
          <h3>Submission Not Found</h3>
          <p>The submission ID "{submissionId}" could not be found.</p>
          <Button onClick={() => navigate('/')} style={{ marginTop: 'var(--space-16)' }}>
            Return to Form
          </Button>
        </NoticeBox>
      </div>
    );
  }

  // Check if any previous stage has rejected the submission - block access if so
  const pbpRejected = submission.pbpReview?.decision === 'rejected';
  const procurementRejected = submission.procurementReview?.decision === 'rejected';
  const opwRejected = submission.opwReview?.decision === 'rejected';

  if (pbpRejected || procurementRejected || opwRejected) {
    const rejectedBy = pbpRejected ? 'PBP' : procurementRejected ? 'Procurement' : 'OPW Panel';
    const rejectionData = pbpRejected ? submission.pbpReview : procurementRejected ? submission.procurementReview : submission.opwReview;

    return (
      <div style={{ padding: 'var(--space-32)', maxWidth: '800px', margin: '0 auto' }}>
        <NoticeBox type="error">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircleXIcon size={24} color="#dc2626" />
            Submission Rejected by {rejectedBy}
          </h3>
          <p>This submission was rejected at the {rejectedBy} Review stage and cannot proceed to AP Control Verification.</p>
          <div style={{
            marginTop: 'var(--space-16)',
            padding: 'var(--space-16)',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 'var(--radius-base)'
          }}>
            <p style={{ margin: '0 0 var(--space-8) 0' }}><strong>Rejected by:</strong> {rejectionData?.signature || rejectionData?.reviewedBy || `${rejectedBy} Reviewer`}</p>
            <p style={{ margin: '0 0 var(--space-8) 0' }}><strong>Date:</strong> {rejectionData?.date ? formatDate(rejectionData.date) : 'Not recorded'}</p>
            <p style={{ margin: 0 }}><strong>Reason:</strong> {rejectionData?.rejectionReason || rejectionData?.finalComments || rejectionData?.comments || submission.approvalComments || 'No reason provided'}</p>
          </div>
          <p style={{ marginTop: 'var(--space-16)', marginBottom: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            The requester has been notified of this rejection and must address the issues before resubmitting.
          </p>
        </NoticeBox>
      </div>
    );
  }

  const formData = submission.formData;
  const isPreview = submission.isPreview === true;
  const apControlReview = submission.apControlReview;

  return (
    <div style={{ padding: 'var(--space-32)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-32)',
        gap: 'var(--space-24)',
      }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-8) 0', color: 'var(--nhs-blue)' }}>
            AP Control Review: Banking & Financial Verification
          </h1>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            <div>Submission ID: <strong>{submission.submissionId}</strong></div>
            <div>Submitted: {formatDate(submission.submissionDate)}</div>
            <div>Submitted by: {submission.submittedBy}</div>
            {isPreview && (
              <div style={{ color: 'var(--color-warning)', fontWeight: 'var(--font-weight-semibold)' }}>
                PREVIEW MODE - This is not a real submission
              </div>
            )}
          </div>
        </div>

        {/* Approval Stamp & Actions */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', alignItems: 'flex-end' }}>
          {apControlReview && (
            <ApprovalStamp
              status={apControlReview.decision === 'rejected' ? 'rejected' : apControlReview.decision === 'approved' || apControlReview.status === 'verified' ? 'approved' : 'pending'}
              date={apControlReview.date || apControlReview.reviewedAt}
              approver={apControlReview.signature || apControlReview.reviewedBy}
              size="large"
            />
          )}
          {/* Download PDF button - only show if AP review not yet complete */}
          {!apControlReview && (
            <PDFDownloadLink
              document={<SupplierFormPDF submission={getFullSubmissionForPDF()} />}
              fileName={`NHS-Supplier-Form-${submission?.formData?.companyName?.replace(/\s+/g, '_') || 'Supplier'}-${new Date().toISOString().split('T')[0]}.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline" disabled={loading}>
                  {loading ? 'Generating...' : <><DocumentIcon size={16} style={{ marginRight: '4px' }} /> Download PDF</>}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Terminal State Notice - Completed_Payroll (No Oracle supplier record needed) */}
      {submission.status === 'Completed_Payroll' && (
        <NoticeBox
          type="info"
          style={{ marginBottom: 'var(--space-24)', backgroundColor: '#fffbeb', borderColor: '#f59e0b' }}
        >
          <h4 style={{ margin: '0 0 var(--space-8) 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e' }}>
            <WarningIcon size={20} color="#f59e0b" />
            Terminal State: Completed (Payroll)
          </h4>
          <p style={{ margin: '0 0 var(--space-8) 0', color: '#78350f' }}>
            This submission has been completed by the OPW Panel and <strong>does not require AP Control verification</strong>.
          </p>
          <p style={{ margin: 0, color: '#78350f', fontWeight: 'var(--font-weight-semibold)' }}>
            ⚠️ <strong>DO NOT create an Oracle supplier record.</strong> This worker should be processed via NHS payroll (ESR) by HR/Payroll.
          </p>
        </NoticeBox>
      )}

      {/* AP Review Status */}
      {apControlReview && (
        <NoticeBox
          type={apControlReview.decision === 'rejected' ? 'error' : 'success'}
          style={{ marginBottom: 'var(--space-24)' }}
        >
          {apControlReview.decision === 'rejected' ? (
            <>
              <strong>AP Control Decision: Rejected</strong>
              <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                <strong>Rejected by:</strong> {apControlReview.signature || apControlReview.reviewedBy}
              </p>
              <p style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
                <strong>Date:</strong> {formatDate(apControlReview.date || apControlReview.reviewedAt)}
              </p>
              <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                <strong>Rejection Reason:</strong> {apControlReview.rejectionReason}
              </p>
            </>
          ) : (
            <>
              <strong>AP Verification Complete</strong>
              <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                Verified by {apControlReview.signature || apControlReview.reviewedBy} on {formatDate(apControlReview.date || apControlReview.reviewedAt)}
              </p>
              {apControlReview.supplierName && (
                <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                  <strong>Supplier Name:</strong> {apControlReview.supplierName}
                </p>
              )}
              {apControlReview.supplierNumber && (
                <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                  <strong>Supplier Number:</strong> {apControlReview.supplierNumber}
                </p>
              )}
              {apControlReview.notes && (
                <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                  <strong>Notes:</strong> {apControlReview.notes}
                </p>
              )}
            </>
          )}
        </NoticeBox>
      )}

      {/* Download Complete PDF Section - Only show if AP review exists */}
      {apControlReview && (
        <div className="ap-download-section">
          <div className="download-card">
            <div className="download-info">
              <h4>Complete Supplier Form with All Authorisations</h4>
              <p>Download the full supplier form PDF including all authorisation signatures from PBP, Procurement, OPW Panel (if applicable), and AP Control.</p>
            </div>
            <PDFDownloadLink
              document={<SupplierFormPDF submission={getFullSubmissionForPDF()} isAPControlPDF={true} />}
              fileName={`NHS-Supplier-Form-${submission?.formData?.companyName?.replace(/\s+/g, '_') || 'Supplier'}-COMPLETE-${new Date().toISOString().split('T')[0]}.pdf`}
            >
              {({ loading, error }) => (
                <button className="btn-download-complete" disabled={loading}>
                  {loading ? (
                    <><ClockIcon size={16} style={{ marginRight: '4px' }} /> Generating PDF...</>
                  ) : (
                    <><DownloadIcon size={16} style={{ marginRight: '4px' }} /> Download Complete PDF with All Authorisations</>
                  )}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      )}

      {/* Conflict of Interest Warning */}
      {formData.supplierConnection === 'yes' && formData.connectionDetails && (
        <div style={{
          marginBottom: 'var(--space-16)',
          padding: 'var(--space-16)',
          backgroundColor: '#fef3c7',
          borderRadius: 'var(--radius-base)',
          border: '2px solid #f59e0b',
        }}>
          <h4 style={{ margin: '0 0 var(--space-8) 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><WarningIcon size={18} color="#b45309" /> Conflict of Interest Declared</span>
          </h4>
          <p style={{ margin: '0 0 var(--space-8) 0', color: '#92400e', fontWeight: 'var(--font-weight-medium)' }}>
            The requester has declared a connection to this supplier:
          </p>
          <p style={{ margin: 0, color: '#92400e', backgroundColor: '#fffbeb', padding: 'var(--space-12)', borderRadius: 'var(--radius-sm)' }}>
            {formData.connectionDetails}
          </p>
        </div>
      )}

      {/* Supplier Details */}
      <ReviewCard title="Supplier Details" highlight>
        <ReviewItem label="Company Name" value={formData.companyName?.toUpperCase()} highlight raw />
        {formData.tradingName && <ReviewItem label="Trading Name" value={formData.tradingName?.toUpperCase()} raw />}
        <ReviewItem label="Supplier Type" value={formatSupplierType(formData.supplierType)} raw />
        {formData.crn && formData.supplierType === 'limited_company' && (
          <ReviewItem
            label="CRN"
            value={formData.crn}
            highlight
            badge={<CRNStatusBadge crn={formData.crn} verificationData={formData.crnVerification} />}
          />
        )}
        {formData.crnCharity && formData.supplierType === 'charity' && (
          <ReviewItem
            label="CRN"
            value={formData.crnCharity}
            highlight
            badge={<CRNStatusBadge crn={formData.crnCharity} verificationData={formData.crnVerification} />}
          />
        )}
        {formData.charityNumber && <ReviewItem label="Charity Number" value={formData.charityNumber} />}
        <ReviewItem label="Registered Address" value={formData.registeredAddress?.toUpperCase()} />
        <ReviewItem label="City" value={formData.city?.toUpperCase()} />
        <ReviewItem label="Postcode" value={formData.postcode?.toUpperCase()} />
        <ReviewItem label="Contact Name" value={formData.contactName?.toUpperCase()} />
        <ReviewItem label="Contact Email" value={formData.contactEmail} highlight raw />
        <ReviewItem label="Contact Phone" value={formData.contactPhone} />
        {formData.website && <ReviewItem label="Website" value={formData.website} />}
      </ReviewCard>

      {/* Bank Details */}
      <ReviewCard title="Bank Details & Payment Information" highlight>
        <ReviewItem label="Overseas Supplier" value={formData.overseasSupplier} />

        {formData.overseasSupplier === 'yes' ? (
          <>
            {formData.iban && <ReviewItem label="IBAN" value={formData.iban} highlight />}
            {formData.swiftCode && <ReviewItem label="SWIFT Code" value={formData.swiftCode} highlight />}
            {formData.bankRouting && <ReviewItem label="Bank Routing Number" value={formData.bankRouting} />}
          </>
        ) : (
          <>
            {formData.nameOnAccount && <ReviewItem label="Name on Account" value={formData.nameOnAccount} highlight />}
            {formData.sortCode && <ReviewItem label="Sort Code" value={formData.sortCode} highlight />}
            {formData.accountNumber && <ReviewItem label="Account Number" value={formData.accountNumber} highlight />}
          </>
        )}

        <ReviewItem label="Letterhead Available" value={formData.letterheadAvailable} />

        {formData.letterheadAvailable === 'yes' && submission.uploadedFiles?.letterhead && (
          <div style={{
            marginTop: 'var(--space-12)',
            padding: 'var(--space-12)',
            backgroundColor: '#d1fae5',
            borderRadius: 'var(--radius-base)',
            border: '1px solid var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-12)',
          }}>
            <div style={{ flex: 1 }}>
              <strong><CheckIcon size={14} style={{ marginRight: '4px' }} /> Letterhead with Bank Details:</strong> {submission.uploadedFiles.letterhead.name}
            </div>
            <Button
              variant="outline"
              onClick={() => handlePreviewDocument(submission.uploadedFiles.letterhead)}
              style={{ fontSize: 'var(--font-size-sm)', padding: '6px 12px' }}
            >
              Preview
            </Button>
          </div>
        )}
      </ReviewCard>

      {/* Accounts Contact Details */}
      {formData.accountsAddressSame === 'no' && (
        <ReviewCard title="Accounts Department Contact">
          <ReviewItem label="Accounts Address" value={formData.accountsAddress} />
          <ReviewItem label="City" value={formData.accountsCity} />
          <ReviewItem label="Postcode" value={formData.accountsPostcode} />
          <ReviewItem label="Phone" value={formData.accountsPhone} />
          <ReviewItem label="Email" value={formData.accountsEmail} raw />
        </ReviewCard>
      )}

      {/* VAT & Tax Information */}
      <ReviewCard title="VAT & Tax Information" highlight>
        <ReviewItem label="VAT Registered" value={formData.vatRegistered} />
        {formData.vatRegistered === 'yes' && formData.vatNumber && (
          <ReviewItem label="VAT Number" value={formData.vatNumber} highlight />
        )}

        <ReviewItem label="CIS Registered" value={formData.cisRegistered} />
        {formData.cisRegistered === 'yes' && formData.utrNumber && (
          <ReviewItem label="UTR Number" value={formData.utrNumber} highlight />
        )}

        <ReviewItem label="GHX/DUNS Known" value={formData.ghxDunsKnown} />
        {formData.ghxDunsKnown === 'yes' && formData.ghxDunsNumber && (
          <ReviewItem label="GHX/DUNS Number" value={formData.ghxDunsNumber} />
        )}
      </ReviewCard>

      {/* Insurance Information */}
      <ReviewCard title="Insurance Information" highlight>
        <ReviewItem label="Public Liability Insurance" value={formData.publicLiability} />
        {formData.publicLiability === 'yes' && (
          <>
            {formData.plCoverage && <ReviewItem label="Coverage Amount" value={formatCurrency(formData.plCoverage)} highlight />}
            {formData.plExpiry && <ReviewItem label="Expiry Date" value={formatDate(formData.plExpiry)} highlight />}
          </>
        )}

        {formData.professionalIndemnity === 'yes' && (
          <>
            {formData.piCoverage && <ReviewItem label="PI Coverage" value={formatCurrency(formData.piCoverage)} />}
            {formData.piExpiry && <ReviewItem label="PI Expiry" value={formatDate(formData.piExpiry)} />}
          </>
        )}
      </ReviewCard>

      {/* Financial Context */}
      <ReviewCard title="Financial Context">
        <ReviewItem label="Annual Value" value={formData.annualValue ? formatCurrency(formData.annualValue) : ''} />
        <ReviewItem label="Employee Count" value={formatEmployeeCount(formData.employeeCount)} raw />
        <ReviewItem label="Service Types" value={formatServiceTypes(formData.serviceType)} raw />
      </ReviewCard>

      {/* Section 7: Final Acknowledgement */}
      <ReviewCard title="Section 7: Final Acknowledgement" highlight>
        <ReviewItem
          label="Final Acknowledgement"
          value={formData.finalAcknowledgement ? 'Confirmed - All information is accurate and complete' : 'Not confirmed'}
        />
      </ReviewCard>

      {/* Previous Authorisations Section */}
      {(submission.procurementReview || submission.opwReview) && (
        <div style={{
          marginTop: 'var(--space-32)',
          padding: 'var(--space-24)',
          backgroundColor: '#f0f7ff',
          borderRadius: 'var(--radius-base)',
          border: '2px solid var(--nhs-blue)',
        }}>
          <h3 style={{ margin: '0 0 var(--space-16) 0', color: 'var(--nhs-blue)' }}>
            Previous Authorisations
          </h3>

          {/* PBP Review */}
          {submission.pbpReview && (
            <div style={{
              padding: 'var(--space-16)',
              backgroundColor: 'white',
              borderRadius: 'var(--radius-base)',
              marginBottom: 'var(--space-16)',
              border: '1px solid var(--color-border)',
            }}>
              <h4 style={{ margin: '0 0 var(--space-12) 0', color: 'var(--nhs-blue)', fontSize: 'var(--font-size-base)' }}>
                Procurement Business Partner
              </h4>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <p style={{ marginBottom: 'var(--space-8)' }}>
                  <strong>Decision:</strong>{' '}
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: submission.pbpReview.decision === 'approved' ? '#22c55e' : submission.pbpReview.decision === 'rejected' ? '#ef4444' : '#f59e0b',
                    color: 'white',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-xs)',
                  }}>
                    {submission.pbpReview.decision?.toUpperCase()}
                  </span>
                </p>
                {(submission.pbpReview.finalComments || submission.pbpReview.comments) && (
                  <p style={{ marginBottom: 'var(--space-8)' }}>
                    <strong>Comments:</strong> {submission.pbpReview.finalComments || submission.pbpReview.comments}
                  </p>
                )}
                <div style={{
                  marginTop: 'var(--space-12)',
                  paddingTop: 'var(--space-12)',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}>
                  <span>
                    <strong>Signed by:</strong>{' '}
                    {submission.pbpReview.signature ||
                     submission.pbpReview.signatureName ||
                     submission.pbpReview.approver ||
                     submission.pbpReview.reviewerName ||
                     'Not recorded'}
                  </span>
                  <span>
                    <strong>Date:</strong>{' '}
                    {formatDate(submission.pbpReview.date ||
                     submission.pbpReview.signatureDate ||
                     submission.pbpReview.approvalDate ||
                     submission.pbpReview.reviewDate)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Procurement Review */}
          {submission.procurementReview && (
            <div style={{
              padding: 'var(--space-16)',
              backgroundColor: 'white',
              borderRadius: 'var(--radius-base)',
              marginBottom: 'var(--space-16)',
              border: '1px solid var(--color-border)',
            }}>
              <h4 style={{ margin: '0 0 var(--space-12) 0', color: 'var(--nhs-blue)', fontSize: 'var(--font-size-base)' }}>
                Procurement
              </h4>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                <p style={{ marginBottom: 'var(--space-8)' }}>
                  <strong>Classification:</strong>{' '}
                  {submission.procurementReview.supplierClassification === 'standard' ? 'Standard Supplier' : 'Potential OPW/IR35'}
                </p>
                <p style={{ marginBottom: 'var(--space-8)' }}>
                  <strong>Decision:</strong>{' '}
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: submission.procurementReview.decision === 'approved' ? '#22c55e' : submission.procurementReview.decision === 'rejected' ? '#ef4444' : '#f59e0b',
                    color: 'white',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-xs)',
                  }}>
                    {submission.procurementReview.decision?.toUpperCase()}
                  </span>
                </p>
                {submission.procurementReview.comments && (
                  <p style={{ marginBottom: 'var(--space-8)' }}>
                    <strong>Comments:</strong> {submission.procurementReview.comments}
                  </p>
                )}
                <div style={{
                  marginTop: 'var(--space-12)',
                  paddingTop: 'var(--space-12)',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}>
                  <span>
                    <strong>Signed by:</strong>{' '}
                    {submission.procurementReview.signature ||
                     submission.procurementReview.signatureName ||
                     submission.procurementReview.approver ||
                     'Not recorded'}
                  </span>
                  <span>
                    <strong>Date:</strong>{' '}
                    {formatDate(submission.procurementReview.date ||
                     submission.procurementReview.signatureDate ||
                     submission.procurementReview.approvalDate)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* OPW Review & Contract Agreement - Combined in one box */}
          {submission.procurementReview?.supplierClassification === 'opw_ir35' && submission.opwReview && (
            <div style={{
              padding: 'var(--space-16)',
              backgroundColor: 'white',
              borderRadius: 'var(--radius-base)',
              border: '1px solid var(--color-border)',
            }}>
              {/* OPW Panel Section */}
              <h4 style={{ margin: '0 0 var(--space-12) 0', color: 'var(--nhs-blue)', fontSize: 'var(--font-size-base)' }}>
                OPW Panel Assessment
              </h4>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                {/* Worker Classification */}
                <p style={{ marginBottom: 'var(--space-8)' }}>
                  <strong>Worker Classification:</strong>{' '}
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: submission.opwReview.workerClassification === 'sole_trader' ? '#3b82f6' : '#8b5cf6',
                    color: 'white',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-xs)',
                  }}>
                    {submission.opwReview.workerClassification === 'sole_trader' ? 'SOLE TRADER' : 'INTERMEDIARY'}
                  </span>
                </p>

                {/* Sole Trader Path - Employment Status */}
                {submission.opwReview.workerClassification === 'sole_trader' && submission.opwReview.employmentStatus && (
                  <>
                    <p style={{ marginBottom: 'var(--space-8)' }}>
                      <strong>Employment Status:</strong>{' '}
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: submission.opwReview.employmentStatus === 'employed' ? '#dc2626' : '#22c55e',
                        color: 'white',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-size-xs)',
                      }}>
                        {submission.opwReview.employmentStatus === 'employed' ? 'EMPLOYED (ESR/Payroll)' : 'SELF-EMPLOYED'}
                      </span>
                    </p>
                    {submission.opwReview.employmentStatus === 'employed' && (
                      <div style={{
                        marginTop: 'var(--space-12)',
                        padding: 'var(--space-12)',
                        backgroundColor: '#fef2f2',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #fecaca'
                      }}>
                        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: '#991b1b' }}>
                          ⚠️ <strong>Payroll Route:</strong> Worker classified as employed. Must be paid via NHS payroll (ESR).
                          No Oracle supplier record required.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Intermediary Path - IR35 Status */}
                {submission.opwReview.workerClassification === 'intermediary' && submission.opwReview.ir35Determination && (
                  <>
                    <p style={{ marginBottom: 'var(--space-8)' }}>
                      <strong>IR35 Status:</strong>{' '}
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: submission.opwReview.ir35Determination === 'outside' ? '#22c55e' : '#dc2626',
                        color: 'white',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-size-xs)',
                      }}>
                        {submission.opwReview.ir35Determination === 'inside' ? 'INSIDE IR35 (Payroll)' : 'OUTSIDE IR35'}
                      </span>
                    </p>

                    {/* SDS Tracking - Only for Inside IR35 */}
                    {submission.opwReview.ir35Determination === 'inside' && submission.opwReview.sdsTracking && (
                      <div style={{
                        marginTop: 'var(--space-12)',
                        padding: 'var(--space-12)',
                        backgroundColor: '#fef2f2',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #fecaca'
                      }}>
                        <p style={{ margin: '0 0 var(--space-8) 0', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: '#991b1b' }}>
                          Status Determination Statement (SDS) Tracking:
                        </p>
                        {submission.opwReview.sdsTracking.sdsIssued && (
                          <>
                            <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-xs)', color: '#7f1d1d' }}>
                              • <strong>SDS Issued:</strong> {formatDate(submission.opwReview.sdsTracking.sdsIssuedDate)}
                            </p>
                            {submission.opwReview.sdsTracking.sdsResponseReceived ? (
                              <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-xs)', color: '#7f1d1d' }}>
                                • <strong>Response Received:</strong> {formatDate(submission.opwReview.sdsTracking.sdsResponseDate)} ✓
                              </p>
                            ) : (
                              <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-xs)', color: '#7f1d1d' }}>
                                • <strong>Response Status:</strong> Awaiting response
                                {submission.opwReview.sdsTracking.daysSinceIssued !== undefined &&
                                  ` (${submission.opwReview.sdsTracking.daysSinceIssued} days elapsed${submission.opwReview.sdsTracking.daysSinceIssued > 14 ? ' - OVERDUE' : ''})`
                                }
                              </p>
                            )}
                          </>
                        )}
                        <p style={{ margin: 'var(--space-8) 0 0 0', fontSize: 'var(--font-size-xs)', color: '#991b1b' }}>
                          ⚠️ <strong>Payroll Route:</strong> Inside IR35 determination. Must be paid via NHS payroll (ESR).
                          No Oracle supplier record required.
                        </p>
                      </div>
                    )}

                    {/* Outside IR35 - Contract Required */}
                    {submission.opwReview.ir35Determination === 'outside' && submission.opwReview.contractRequired === 'yes' && (
                      <div style={{
                        marginTop: 'var(--space-12)',
                        padding: 'var(--space-12)',
                        backgroundColor: '#f0fdf4',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #86efac'
                      }}>
                        <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: '#166534' }}>
                          ✓ <strong>Contract Required:</strong> Agreement must be approved by Contract Drafter before AP verification.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Rationale/Comments */}
                {submission.opwReview.rationale && (
                  <p style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>
                    <strong>Rationale:</strong> {submission.opwReview.rationale}
                  </p>
                )}

                {/* Signature */}
                <div style={{
                  marginTop: 'var(--space-12)',
                  paddingTop: 'var(--space-12)',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}>
                  <span>
                    <strong>Signed by:</strong>{' '}
                    {submission.opwReview.signature ||
                     submission.opwReview.signatureName ||
                     submission.opwReview.approver ||
                     'Not recorded'}
                  </span>
                  <span>
                    <strong>Date:</strong>{' '}
                    {formatDate(submission.opwReview.date ||
                     submission.opwReview.signatureDate ||
                     submission.opwReview.approvalDate)}
                  </span>
                </div>
              </div>

              {/* Contract Agreement Section - within the same box */}
              {submission.contractDrafter && submission.contractDrafter.decision === 'approved' && (
                <div style={{
                  marginTop: 'var(--space-16)',
                  paddingTop: 'var(--space-16)',
                  borderTop: '1px dashed var(--color-border)',
                }}>
                  <h4 style={{ margin: '0 0 var(--space-12) 0', color: 'var(--nhs-blue)', fontSize: 'var(--font-size-base)' }}>
                    Contract Agreement
                  </h4>
                  <div style={{ fontSize: 'var(--font-size-sm)' }}>
                    <p style={{ marginBottom: 'var(--space-8)' }}>
                      <strong>Status:</strong>{' '}
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-size-xs)',
                      }}>
                        APPROVED
                      </span>
                    </p>
                    {submission.contractDrafter.templateUsed && (
                      <p style={{ marginBottom: 'var(--space-8)' }}>
                        <strong>Agreement Type:</strong> {submission.contractDrafter.templateUsed}
                      </p>
                    )}
                    {submission.contractDrafter.finalizedAgreement && (
                      <p style={{ marginBottom: 'var(--space-8)' }}>
                        <strong>Final Document:</strong> {submission.contractDrafter.finalizedAgreement.name}
                      </p>
                    )}
                    <div style={{
                      marginTop: 'var(--space-12)',
                      paddingTop: 'var(--space-12)',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)',
                    }}>
                      <span>
                        <strong>Approved by:</strong>{' '}
                        {submission.contractDrafter.digitalSignature ||
                         submission.contractDrafter.decidedBy ||
                         'Not recorded'}
                      </span>
                      <span>
                        <strong>Date:</strong>{' '}
                        {formatDate(submission.contractDrafter.signedAt ||
                         submission.contractDrafter.decidedAt ||
                         submission.contractDrafter.lastUpdated)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Uploaded Documents Section */}
      <div className="section-card" style={{ marginTop: 'var(--space-32)' }}>
        <h3 style={{ margin: '0 0 var(--space-8) 0', color: 'var(--nhs-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005EB8" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          Uploaded Documents
        </h3>
        <p className="section-description" style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-16)' }}>
          All documents uploaded during the submission process:
        </p>

        <div className="documents-grid">
          {/* Letterhead with Bank Details */}
          {(submission?.uploads?.letterhead || submission?.uploadedFiles?.letterhead) && (
            <div className="document-card">
              <div className="document-icon" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: '#eff6ff',
                borderRadius: '8px',
                color: '#005EB8',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>PDF</div>
              <div className="document-info">
                <h4>Letterhead with Bank Details</h4>
                <p className="file-name">
                  {submission?.uploads?.letterhead?.name ||
                   submission?.uploadedFiles?.letterhead?.name ||
                   'letterhead.pdf'}
                </p>
                <p className="upload-date">Section 2: Pre-screening</p>
              </div>
              <div className="document-actions">
                <button
                  className="btn-preview"
                  onClick={() => handlePreviewDocument(
                    submission?.uploads?.letterhead || submission?.uploadedFiles?.letterhead
                  )}
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* Procurement Approval Document */}
          {(submission?.uploads?.procurementApproval || submission?.uploadedFiles?.procurementApproval) && (
            <div className="document-card">
              <div className="document-icon" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: '#eff6ff',
                borderRadius: '8px',
                color: '#005EB8',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>PDF</div>
              <div className="document-info">
                <h4>Procurement Approval Document</h4>
                <p className="file-name">
                  {submission?.uploads?.procurementApproval?.name ||
                   submission?.uploadedFiles?.procurementApproval?.name ||
                   'procurement-approval.pdf'}
                </p>
                <p className="upload-date">Section 2: Pre-screening</p>
              </div>
              <div className="document-actions">
                <button
                  className="btn-preview"
                  onClick={() => handlePreviewDocument(
                    submission?.uploads?.procurementApproval || submission?.uploadedFiles?.procurementApproval
                  )}
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* CEST Form */}
          {(submission?.uploads?.cestForm || submission?.uploadedFiles?.cestForm) && (
            <div className="document-card">
              <div className="document-icon" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: '#eff6ff',
                borderRadius: '8px',
                color: '#005EB8',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>PDF</div>
              <div className="document-info">
                <h4>CEST Form</h4>
                <p className="file-name">
                  {submission?.uploads?.cestForm?.name ||
                   submission?.uploadedFiles?.cestForm?.name ||
                   'cest-form.pdf'}
                </p>
                <p className="upload-date">Section 2: Pre-screening</p>
              </div>
              <div className="document-actions">
                <button
                  className="btn-preview"
                  onClick={() => handlePreviewDocument(
                    submission?.uploads?.cestForm || submission?.uploadedFiles?.cestForm
                  )}
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* Finalized Contract Agreement */}
          {submission?.contractDrafter?.finalizedAgreement && (
            <div className="document-card">
              <div className="document-icon" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: '#dcfce7',
                borderRadius: '8px',
                color: '#059669',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {submission.contractDrafter.finalizedAgreement.type === 'application/pdf' ? 'PDF' : 'DOC'}
              </div>
              <div className="document-info">
                <h4>Finalized Contract Agreement</h4>
                <p className="file-name">
                  {submission.contractDrafter.finalizedAgreement.name}
                </p>
                <p className="upload-date">
                  Approved by: {submission.contractDrafter.digitalSignature || submission.contractDrafter.decidedBy || 'Contract Drafter'}
                  {' • '}
                  {formatDate(submission.contractDrafter.signedAt || submission.contractDrafter.decidedAt)}
                </p>
              </div>
              <div className="document-actions">
                <button
                  className="btn-preview"
                  onClick={() => handlePreviewDocument(submission.contractDrafter.finalizedAgreement)}
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* Identity Document - Passport Photo (AP Control can view for verification) */}
          {(submission?.uploads?.passportPhoto ||
            submission?.uploadedFiles?.passportPhoto) && (
            <div className="document-card">
              <div className="document-icon"><DocumentIcon size={24} color="#005EB8" /></div>
              <div className="document-info">
                <h4>Passport Photo</h4>
                <p className="file-name">{submission?.uploadedFiles?.passportPhoto?.name || 'Passport Photo Page'}</p>
                <p className="upload-date" style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <WarningIcon size={14} /> Confidential - AP Control Access Only
                  </span>
                </p>
              </div>
              <div className="document-actions">
                <button
                  className="btn-preview"
                  onClick={() => handlePreviewDocument(
                    submission?.uploadedFiles?.passportPhoto || submission?.uploads?.passportPhoto
                  )}
                  style={{
                    padding: '8px 16px',
                    fontSize: 'var(--font-size-sm)',
                    backgroundColor: 'white',
                    border: '2px solid var(--nhs-blue)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--nhs-blue)',
                    cursor: 'pointer',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* Identity Document - Driving Licence Front (AP Control can view for verification) */}
          {(submission?.uploads?.licenceFront ||
            submission?.uploadedFiles?.licenceFront ||
            submission?.uploads?.drivingLicenceFront ||
            submission?.uploadedFiles?.drivingLicenceFront) && (
            <div className="document-card">
              <div className="document-icon"><DocumentIcon size={24} color="#005EB8" /></div>
              <div className="document-info">
                <h4>Driving Licence (Front)</h4>
                <p className="file-name">
                  {submission?.uploadedFiles?.licenceFront?.name || 
                   submission?.uploadedFiles?.drivingLicenceFront?.name || 
                   'Driving Licence Front'}
                </p>
                <p className="upload-date" style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <WarningIcon size={14} /> Confidential - AP Control Access Only
                  </span>
                </p>
              </div>
              <div className="document-actions">
                <button
                  className="btn-preview"
                  onClick={() => handlePreviewDocument(
                    submission?.uploadedFiles?.licenceFront || 
                    submission?.uploadedFiles?.drivingLicenceFront ||
                    submission?.uploads?.licenceFront ||
                    submission?.uploads?.drivingLicenceFront
                  )}
                  style={{
                    padding: '8px 16px',
                    fontSize: 'var(--font-size-sm)',
                    backgroundColor: 'white',
                    border: '2px solid var(--nhs-blue)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--nhs-blue)',
                    cursor: 'pointer',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* Identity Document - Driving Licence Back (AP Control can view for verification) */}
          {(submission?.uploads?.licenceBack ||
            submission?.uploadedFiles?.licenceBack ||
            submission?.uploads?.drivingLicenceBack ||
            submission?.uploadedFiles?.drivingLicenceBack) && (
            <div className="document-card">
              <div className="document-icon"><DocumentIcon size={24} color="#005EB8" /></div>
              <div className="document-info">
                <h4>Driving Licence (Back)</h4>
                <p className="file-name">
                  {submission?.uploadedFiles?.licenceBack?.name || 
                   submission?.uploadedFiles?.drivingLicenceBack?.name || 
                   'Driving Licence Back'}
                </p>
                <p className="upload-date" style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <WarningIcon size={14} /> Confidential - AP Control Access Only
                  </span>
                </p>
              </div>
              <div className="document-actions">
                <button
                  className="btn-preview"
                  onClick={() => handlePreviewDocument(
                    submission?.uploadedFiles?.licenceBack || 
                    submission?.uploadedFiles?.drivingLicenceBack ||
                    submission?.uploads?.licenceBack ||
                    submission?.uploads?.drivingLicenceBack
                  )}
                  style={{
                    padding: '8px 16px',
                    fontSize: 'var(--font-size-sm)',
                    backgroundColor: 'white',
                    border: '2px solid var(--nhs-blue)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--nhs-blue)',
                    cursor: 'pointer',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* No documents message */}
          {!submission?.uploads && !submission?.uploadedFiles && (
            <p className="no-documents">No documents were uploaded with this submission.</p>
          )}
        </div>
      </div>

      {/* AP Verification Checklist */}
      {!apControlReview && (
        <div style={{
          marginTop: 'var(--space-32)',
          padding: 'var(--space-24)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-base)',
          border: '2px solid var(--color-border)',
        }}>
          <h4 style={{ margin: '0 0 var(--space-16) 0', color: 'var(--nhs-blue)' }}>
            AP Verification Checklist
          </h4>

          <NoticeBox type="warning" style={{ marginBottom: 'var(--space-16)' }}>
            <strong>Verification Required:</strong>
            <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
              Please verify all banking and financial details against supporting documentation before approving this supplier for system setup.
              All mandatory items must be checked before submission.
            </p>
          </NoticeBox>

          {/* Supplier Details Fields */}
          <div style={{
            padding: 'var(--space-16)',
            backgroundColor: '#f0f7ff',
            borderRadius: 'var(--radius-base)',
            border: '1px solid var(--nhs-blue)',
            marginBottom: 'var(--space-24)',
          }}>
            <h4 style={{ margin: '0 0 var(--space-16) 0', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--nhs-blue)' }}>
              Supplier Setup Information
            </h4>

            <Input
              label="Supplier Name"
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Verify and edit supplier name if needed"
              required
              style={{ marginBottom: 'var(--space-16)' }}
            />

            <Input
              label="Supplier Number (assigned by AP)"
              type="text"
              value={supplierNumber}
              onChange={(e) => setSupplierNumber(e.target.value)}
              placeholder="e.g., SUP-12345"
              required
              style={{ marginBottom: 'var(--space-16)' }}
            />
          </div>

          <div style={{ marginBottom: 'var(--space-24)' }}>
            <Checkbox
              label="Bank details verified against letterhead or bank statement"
              checked={bankDetailsVerified}
              onChange={setBankDetailsVerified}
              required
              style={{ marginBottom: 'var(--space-12)' }}
            />

            <Checkbox
              label="Company details verified (name, address, registration numbers)"
              checked={companyDetailsVerified}
              onChange={setCompanyDetailsVerified}
              required
              style={{ marginBottom: 'var(--space-12)' }}
            />

            {/* VAT Verification - Only show if VAT registered */}
            {submission?.formData?.vatRegistered === 'yes' && submission?.formData?.vatNumber && (
              <Checkbox
                label="VAT number verified"
                checked={vatVerified}
                onChange={setVatVerified}
                style={{ marginBottom: 'var(--space-12)' }}
              />
            )}

            {/* CIS/UTR Verification - Only show if CIS registered */}
            {submission?.formData?.cisRegistered === 'yes' && submission?.formData?.utrNumber && (
              <Checkbox
                label="CIS/UTR number verified"
                checked={cisVerified}
                onChange={setCisVerified}
                style={{ marginBottom: 'var(--space-12)' }}
              />
            )}

            {/* Insurance Verification - Only show if has insurance */}
            {submission?.formData?.publicLiability === 'yes' && submission?.formData?.plCoverage && (
              <Checkbox
                label="Insurance details verified (coverage and expiry dates)"
                checked={insuranceVerified}
                onChange={setInsuranceVerified}
                style={{ marginBottom: 'var(--space-12)' }}
              />
            )}
          </div>

          <Textarea
            label="Additional Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add any notes about the verification process, discrepancies found, or special instructions..."
            maxLength={500}
            showCharCount
            style={{ marginBottom: 'var(--space-16)' }}
          />

          {/* Initial Action Buttons - Only shown before decision */}
          {!actionType && (
            <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-24)' }}>
              <Button
                variant="primary"
                onClick={() => setActionType('complete')}
                disabled={!bankDetailsVerified || !companyDetailsVerified}
                style={{ backgroundColor: 'var(--color-success)' }}
              >
                Complete AP Verification
              </Button>
              <Button
                variant="danger"
                onClick={() => setActionType('reject')}
              >
                Reject Request
              </Button>
              <Button
                variant="outline"
                onClick={() => window.close()}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Rejection Section - Shown when reject action is selected */}
          {actionType === 'reject' && (
            <div style={{
              marginTop: 'var(--space-16)',
              padding: 'var(--space-16)',
              border: '2px solid var(--color-danger)',
              borderRadius: 'var(--radius-base)',
              backgroundColor: '#fff5f5'
            }}>
              <h4 style={{ margin: '0 0 var(--space-12) 0', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CircleXIcon size={20} />
                Reject This Request
              </h4>
              <p style={{ margin: '0 0 var(--space-12) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                If bank details cannot be verified or there are compliance issues, provide a rejection reason below.
              </p>
              <Textarea
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Explain why this supplier request is being rejected (e.g., bank details do not match, invalid account number, VAT number mismatch, failed compliance checks)..."
                style={{ marginBottom: 'var(--space-12)' }}
                required
              />
            </div>
          )}

          {/* Digital Signature Section - Only shown after action is selected */}
          {actionType && (
            <>
              <SignatureSection
                signatureName={signatureName}
                signatureDate={signatureDate}
                onSignatureChange={({ signatureName: name, signatureDate: date }) => {
                  setSignatureName(name);
                  setSignatureDate(date);
                }}
              />

              {/* Confirmation Buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-16)' }}>
                <Button
                  variant={actionType === 'reject' ? 'danger' : 'primary'}
                  onClick={actionType === 'reject' ? handleReject : handleSubmitVerification}
                  disabled={
                    isSubmitting ||
                    !signatureName.trim() ||
                    (actionType === 'reject' && !rejectionReason.trim())
                  }
                  style={actionType === 'complete' ? { backgroundColor: 'var(--color-success)' } : undefined}
                >
                  {isSubmitting
                    ? (actionType === 'reject' ? 'Rejecting...' : 'Submitting...')
                    : (actionType === 'reject' ? 'Confirm Rejection' : 'Confirm AP Verification')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionType(null);
                    setRejectionReason('');
                    setSignatureName('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden PDF Download Link for auto-download after verification */}
      <PDFDownloadLink
        id="ap-complete-pdf-download"
        document={
          <SupplierFormPDF
            formData={submission?.formData}
            uploadedFiles={submission?.uploadedFiles || {}}
            submissionId={submission?.submissionId}
            submissionDate={submission?.submissionDate}
            submission={{
              ...submission,
              pbpReview: submission?.pbpReview || null,
              procurementReview: submission?.procurementReview || null,
              opwReview: submission?.opwReview || null,
              contractDrafter: submission?.contractDrafter || null,
              apControlReview: submission?.apControlReview || {
                decision: 'verified',
                supplierName: supplierName,
                supplierNumber: supplierNumber,
                signature: signatureName,
                date: signatureDate,
                bankDetailsVerified,
                companyDetailsVerified,
              },
            }}
          />
        }
        fileName={`Supplier_Form_COMPLETE_${submission?.alembaReference || submission?.submissionId || 'unknown'}.pdf`}
        style={{ display: 'none' }}
      >
        {({ loading }) => null}
      </PDFDownloadLink>

      {/* Back Button */}
      <div style={{ marginTop: 'var(--space-32)', textAlign: 'center' }}>
        <Button variant="outline" onClick={() => window.close()}>
          Close Preview
        </Button>
      </div>
    </div>
  );
};

export default APControlReviewPage;
