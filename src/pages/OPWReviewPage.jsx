/**
 * OPW (Off-Payroll Working) Panel Review Page
 * Handles IR35 determination for sole trader suppliers
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button, NoticeBox, ApprovalStamp, Textarea, RadioGroup, SignatureSection, FileUpload, Input, CheckIcon, XIcon, WarningIcon, DocumentIcon, UploadIcon, CircleXIcon, VerificationBadge } from '../components/common';
import { formatDate } from '../utils/helpers';
import { formatYesNo, formatFieldValue, capitalizeWords, formatSupplierType, formatServiceCategory, formatUsageFrequency, formatServiceTypes } from '../utils/formatters';
import SupplierFormPDF from '../components/pdf/SupplierFormPDF';
import { sendApprovalNotification, notifyDepartment, sendRejectionNotification } from '../services/notificationService';

const ReviewItem = ({ label, value, raw = false, badge = null }) => {
  if (!value && value !== 0) return null;

  // Format the value unless raw is true
  const displayValue = raw ? value : formatFieldValue(value);

  return (
    <div style={{ display: 'flex', marginBottom: 'var(--space-8)' }}>
      <div style={{ fontWeight: 'var(--font-weight-medium)', minWidth: '200px', color: 'var(--color-text-secondary)' }}>
        {label}:
      </div>
      <div style={{ color: 'var(--color-text)', paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {displayValue}
        {badge}
      </div>
    </div>
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

const OPWReviewPage = ({
  submission: propSubmission,
  setSubmission: propSetSubmission,
  user,
  readOnly = false
}) => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  // Use props if provided (from SecureReviewPage), otherwise use local state
  const [localSubmission, setLocalSubmission] = useState(null);
  const submission = propSubmission || localSubmission;
  const setSubmission = propSetSubmission || setLocalSubmission;
  const [loading, setLoading] = useState(!propSubmission);
  const [ir35Determination, setIr35Determination] = useState(''); // 'inside' | 'outside'
  const [rationale, setRationale] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [contractFile, setContractFile] = useState(null);
  const [contractUploadedBy, setContractUploadedBy] = useState('');
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSelected, setActionSelected] = useState(false); // Track if user clicked proceed to sign

  // Phase 2: New OPW determination fields
  const [workerClassification, setWorkerClassification] = useState(''); // 'sole_trader' | 'intermediary'
  const [employmentStatus, setEmploymentStatus] = useState(''); // 'employed' | 'self_employed' (for sole traders)
  const [contractRequired, setContractRequired] = useState(''); // 'yes' | 'no'
  const [sdsIssued, setSdsIssued] = useState(false); // For Inside IR35 tracking
  const [sdsIssuedDate, setSdsIssuedDate] = useState('');
  const [sdsResponseReceived, setSdsResponseReceived] = useState(false);
  const [sdsResponseDate, setSdsResponseDate] = useState('');

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
      // Pre-fill if already determined
      if (propSubmission.opwReview) {
        setIr35Determination(propSubmission.opwReview.ir35Status);
        setRationale(propSubmission.opwReview.rationale || '');
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

        // Pre-fill if already determined
        if (parsed.opwReview) {
          setIr35Determination(parsed.opwReview.ir35Status);
          setRationale(parsed.opwReview.rationale || '');
        }
      } catch (error) {
        console.error('Error parsing submission:', error);
      }
    }

    setLoading(false);
  }, [submissionId, propSubmission]);

  // Automatically determine worker classification based on supplier type
  useEffect(() => {
    if (!submission || !submission.formData) return;

    const supplierType = submission.formData.supplierType;
    const soleTraderStatus = submission.formData.soleTraderStatus;

    // Determine classification based on supplier type and personal service status
    if (soleTraderStatus === 'yes' && (supplierType === 'sole_trader' || !supplierType)) {
      // Personal service sole trader = direct worker (not intermediary)
      setWorkerClassification('sole_trader');
    } else if (supplierType === 'limited_company' || supplierType === 'partnership') {
      // Limited Company or Partnership = intermediary
      setWorkerClassification('intermediary');
    } else if (supplierType === 'sole_trader' && soleTraderStatus === 'no') {
      // Sole trader NOT providing personal service = intermediary trading structure
      setWorkerClassification('intermediary');
    } else {
      // Charity, Public Sector, or unclear cases = treat as intermediary
      setWorkerClassification('intermediary');
    }
  }, [submission]);

  const handleSubmitDetermination = async () => {
    // Basic validation
    if (!signatureName.trim()) {
      alert('Please provide your digital signature (full name)');
      return;
    }

    if (!signatureDate) {
      alert('Please select a date for your signature');
      return;
    }

    // Validation for rejection
    if (ir35Determination === 'rejected') {
      if (!rejectionReason.trim()) {
        alert('Please provide a rejection reason');
        return;
      }

      const confirmReject = window.confirm(
        'Are you sure you want to reject this supplier request?\n\n' +
        'This action will notify the requester and close the request.'
      );

      if (!confirmReject) return;
    }

    // Path-specific validation
    if (workerClassification === 'sole_trader') {
      // Sole trader path: must select employment status
      if (!employmentStatus) {
        alert('Please indicate whether the worker is Employed or Self-Employed');
        return;
      }
    } else if (workerClassification === 'intermediary') {
      // Intermediary path: must select IR35 determination
      if (!ir35Determination) {
        alert('Please select an IR35 determination');
        return;
      }

      // Must provide rationale for inside/outside determinations
      if ((ir35Determination === 'inside' || ir35Determination === 'outside') && !rationale.trim()) {
        alert('Please provide a rationale for your determination');
        return;
      }

      // Must select contract required for both inside and outside
      if ((ir35Determination === 'inside' || ir35Determination === 'outside') && !contractRequired) {
        alert('Please indicate whether a contract is required');
        return;
      }

      // For Inside IR35, must track SDS if issued
      if (ir35Determination === 'inside' && sdsIssued && !sdsIssuedDate) {
        alert('Please provide the SDS issued date');
        return;
      }
    } else {
      alert('Unable to determine worker classification. Please contact support.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Load fresh from localStorage to get any updates
      const currentSubmission = JSON.parse(localStorage.getItem(`submission_${submissionId}`)) || submission;

      // Handle rejection case
      if (ir35Determination === 'rejected') {
        // Build OPW rejection data
        const opwReviewData = {
          decision: 'rejected',
          rejectionReason,
          signature: signatureName,
          date: signatureDate,
          reviewedBy: 'OPW Panel Member',
          reviewedAt: new Date().toISOString(),
        };

        // Update submission with rejection
        const updatedSubmission = {
          ...currentSubmission,
          opwReview: opwReviewData,
          status: 'Rejected_OPW',
          currentStage: 'Rejected',
        };

        // Save to localStorage
        localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

        // Update submissions list
        const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
        const index = submissions.findIndex(s => s.submissionId === submissionId);
        if (index !== -1) {
          submissions[index].status = 'rejected';
          submissions[index].rejectedBy = 'OPW Panel';
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
            rejectedByRole: 'OPW Panel',
            rejectionReason,
            rejectionDate: new Date().toISOString(),
            alembaReference,
          });
        }

        setSubmission(updatedSubmission);
        alert('Supplier request has been rejected. The requester has been notified.');
        setIsSubmitting(false);
        return;
      }

      // ========== NEW PHASE 2 LOGIC: SOLE TRADER VS INTERMEDIARY ROUTING ==========

      let opwReviewData = {};
      let updatedSubmission = {};
      let successMessage = '';

      // ===== PATH 1: SOLE TRADER (DIRECT WORKER) =====
      if (workerClassification === 'sole_trader') {
        opwReviewData = {
          workerClassification: 'sole_trader',
          employmentStatus,
          decision: 'approved',
          signature: signatureName,
          date: signatureDate,
          reviewedBy: 'OPW Panel Member',
          reviewedAt: new Date().toISOString(),
        };

        if (employmentStatus === 'employed') {
          // EMPLOYED SOLE TRADER → PAYROLL/ESR ROUTE (TERMINAL STATE)
          updatedSubmission = {
            ...currentSubmission,
            opwReview: opwReviewData,
            status: 'Completed_Payroll',
            currentStage: 'completed_payroll',
            outcomeRoute: 'payroll_esr',
            completedAt: new Date().toISOString(),
          };

          successMessage = 'OPW Determination Complete: EMPLOYED\n\n' +
            'This worker is employed and must be paid via NHS payroll (ESR).\n\n' +
            '⚠️ DO NOT create an Oracle supplier record.\n' +
            'The worker should be set up on ESR by HR/Payroll.\n\n' +
            'This supplier request is now complete.';

        } else if (employmentStatus === 'self_employed') {
          // SELF-EMPLOYED SOLE TRADER → CONTRACT (IF REQUIRED) OR AP CONTROL
          if (contractRequired === 'yes') {
            // Route to Contract Drafter
            updatedSubmission = {
              ...currentSubmission,
              opwReview: opwReviewData,
              status: 'Pending_Contract',
              currentStage: 'contract',
              outcomeRoute: 'oracle_ap',
              contractDrafter: {
                status: 'pending_review',
                ir35Status: 'self_employed',
                requiredTemplate: 'Sole Trader Agreement latest version 22.docx',
                assignedTo: 'peter.persaud@nhs.net',
              },
            };

            successMessage = 'OPW Determination Complete: SELF-EMPLOYED\n\n' +
              'This worker is self-employed and can be paid as a supplier.\n\n' +
              'Contract Required: YES\n' +
              'The request has been forwarded to the Contract Drafter for agreement negotiation.\n' +
              'After contract approval, an Oracle supplier record will be created.';
          } else {
            // Skip contract, route directly to AP Control
            updatedSubmission = {
              ...currentSubmission,
              opwReview: opwReviewData,
              status: 'Pending_AP',
              currentStage: 'ap',
              outcomeRoute: 'oracle_ap',
            };

            successMessage = 'OPW Determination Complete: SELF-EMPLOYED\n\n' +
              'This worker is self-employed and can be paid as a supplier.\n\n' +
              'Contract Required: NO\n' +
              'The request has been forwarded to AP Control for bank details verification.\n' +
              'An Oracle supplier record will be created upon AP approval.';
          }
        }
      }
      // ===== PATH 2: INTERMEDIARY (LIMITED COMPANY, PARTNERSHIP) =====
      else if (workerClassification === 'intermediary') {
        opwReviewData = {
          workerClassification: 'intermediary',
          ir35Status: ir35Determination,
          rationale,
          contractRequired,
          decision: 'approved',
          signature: signatureName,
          date: signatureDate,
          reviewedBy: 'OPW Panel Member',
          reviewedAt: new Date().toISOString(),
        };

        // Add SDS tracking if issued (for Inside IR35)
        if (ir35Determination === 'inside' && sdsIssued) {
          opwReviewData.sdsTracking = {
            sdsIssued: true,
            sdsIssuedDate,
            sdsResponseReceived,
            sdsResponseDate: sdsResponseDate || null,
            daysSinceIssued: sdsIssuedDate ? Math.floor((new Date() - new Date(sdsIssuedDate)) / (1000 * 60 * 60 * 24)) : 0,
          };
        }

        if (ir35Determination === 'inside') {
          // INSIDE IR35 → PAYROLL/ESR ROUTE (TERMINAL STATE)
          updatedSubmission = {
            ...currentSubmission,
            opwReview: opwReviewData,
            status: 'inside_ir35_sds_issued',
            currentStage: 'sds_issued',
            outcomeRoute: 'payroll_esr',
            completedAt: new Date().toISOString(),
          };

          successMessage = 'IR35 Determination: INSIDE IR35\n\n' +
            'This engagement falls inside IR35. The worker must be paid via NHS payroll (ESR).\n\n' +
            '⚠️ DO NOT create an Oracle supplier record.\n' +
            'The worker should be set up on ESR by HR/Payroll.\n\n' +
            (sdsIssued ? 'SDS has been issued and tracked.\n\n' : '') +
            'This supplier request is now complete.';

        } else if (ir35Determination === 'outside') {
          // OUTSIDE IR35 → CONTRACT (IF REQUIRED) OR AP CONTROL
          if (contractRequired === 'yes') {
            // Route to Contract Drafter
            updatedSubmission = {
              ...currentSubmission,
              opwReview: opwReviewData,
              status: 'Pending_Contract',
              currentStage: 'contract',
              outcomeRoute: 'oracle_ap',
              contractDrafter: {
                status: 'pending_review',
                ir35Status: 'outside',
                requiredTemplate: 'BartsConsultancyAgreement.1.2.docx',
                assignedTo: 'peter.persaud@nhs.net',
              },
            };

            successMessage = 'IR35 Determination: OUTSIDE IR35\n\n' +
              'This engagement falls outside IR35. The worker operates as a genuine business.\n\n' +
              'Contract Required: YES\n' +
              'The request has been forwarded to the Contract Drafter for agreement negotiation.\n' +
              'After contract approval, an Oracle supplier record will be created.';
          } else {
            // Skip contract, route directly to AP Control
            updatedSubmission = {
              ...currentSubmission,
              opwReview: opwReviewData,
              status: 'Pending_AP',
              currentStage: 'ap',
              outcomeRoute: 'oracle_ap',
            };

            successMessage = 'IR35 Determination: OUTSIDE IR35\n\n' +
              'This engagement falls outside IR35. The worker operates as a genuine business.\n\n' +
              'Contract Required: NO\n' +
              'The request has been forwarded to AP Control for bank details verification.\n' +
              'An Oracle supplier record will be created upon AP approval.';
          }
        }
      }

      // Save back to localStorage
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = submissions.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        submissions[index].status = updatedSubmission.status;
        submissions[index].currentStage = updatedSubmission.currentStage;
        // Store classification and routing info
        if (workerClassification === 'sole_trader') {
          submissions[index].employmentStatus = employmentStatus;
        } else {
          submissions[index].ir35Status = ir35Determination;
        }
        localStorage.setItem('all_submissions', JSON.stringify(submissions));
      }

      setSubmission(updatedSubmission);

      // Show success message
      alert(successMessage);
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContractUpload = async (fileData) => {
    // FileUpload component passes an object with {name, size, type, file, base64}
    if (fileData) {
      setContractFile(fileData);
    }
  };

  const handleSaveContract = async () => {
    if (!contractFile) {
      alert('Please upload a contract document');
      return;
    }

    if (!contractUploadedBy.trim()) {
      alert('Please enter the name of the person uploading the contract');
      return;
    }

    setIsSavingContract(true);

    try {
      // Load fresh from localStorage to get any updates
      const currentSubmission = JSON.parse(localStorage.getItem(`submission_${submissionId}`)) || submission;

      // Update submission with contract upload
      const updatedSubmission = {
        ...currentSubmission, // Use fresh data from localStorage
        // Add contract drafter info
        contractDrafter: {
          contract: contractFile,
          uploadedBy: contractUploadedBy,
          signature: contractUploadedBy,
          date: new Date().toISOString().split('T')[0],
          submittedAt: new Date().toISOString(),
        },
      };

      // Save back to localStorage
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = submissions.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        submissions[index].contractUploaded = true;
        localStorage.setItem('all_submissions', JSON.stringify(submissions));
      }

      setSubmission(updatedSubmission);

      alert('Contract uploaded successfully! This will now be sent to AP Control for final review.');
    } catch (error) {
      console.error('Error uploading contract:', error);
      alert('Failed to upload contract. Please try again.');
    } finally {
      setIsSavingContract(false);
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

  // Check if PBP or Procurement has rejected the submission - block access if so
  const pbpRejected = submission.pbpReview?.decision === 'rejected';
  const procurementRejected = submission.procurementReview?.decision === 'rejected';

  if (pbpRejected || procurementRejected) {
    const rejectedBy = pbpRejected ? 'PBP' : 'Procurement';
    const rejectionData = pbpRejected ? submission.pbpReview : submission.procurementReview;

    return (
      <div style={{ padding: 'var(--space-32)', maxWidth: '800px', margin: '0 auto' }}>
        <NoticeBox type="error">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircleXIcon size={24} color="#dc2626" />
            Submission Rejected by {rejectedBy}
          </h3>
          <p>This submission was rejected at the {rejectedBy} Review stage and cannot proceed to OPW Panel Review.</p>
          <div style={{
            marginTop: 'var(--space-16)',
            padding: 'var(--space-16)',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 'var(--radius-base)'
          }}>
            <p style={{ margin: '0 0 var(--space-8) 0' }}><strong>Rejected by:</strong> {rejectionData?.signature || rejectionData?.reviewedBy || `${rejectedBy} Reviewer`}</p>
            <p style={{ margin: '0 0 var(--space-8) 0' }}><strong>Date:</strong> {rejectionData?.date ? formatDate(rejectionData.date) : 'Not recorded'}</p>
            <p style={{ margin: 0 }}><strong>Reason:</strong> {rejectionData?.finalComments || rejectionData?.comments || submission.approvalComments || 'No reason provided'}</p>
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
  const opwReview = submission.opwReview;
  const isSoleTrader = formData.soleTraderStatus === 'yes';

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
            OPW Panel Review: IR35 Determination
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
          {opwReview && (
            <ApprovalStamp
              status={opwReview.decision === 'rejected' ? 'rejected' : (opwReview.ir35Status === 'outside' || opwReview.ir35Status === 'inside' || opwReview.employmentStatus === 'self_employed' || opwReview.employmentStatus === 'employed') ? 'approved' : 'pending'}
              date={opwReview.date || opwReview.reviewedAt}
              approver={opwReview.signature || opwReview.reviewedBy}
              size="large"
            />
          )}
          {/* Download PDF button - always available */}
          <PDFDownloadLink
            document={<SupplierFormPDF submission={submission} />}
            fileName={`NHS-Supplier-Form-${submission?.formData?.companyName?.replace(/\s+/g, '_') || 'Supplier'}-${new Date().toISOString().split('T')[0]}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" disabled={loading}>
                {loading ? 'Generating...' : <><DocumentIcon size={16} style={{ marginRight: '4px' }} /> Download PDF</>}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Warning if not sole trader */}
      {!isSoleTrader && (
        <NoticeBox type="warning" style={{ marginBottom: 'var(--space-24)' }}>
          <strong>Note:</strong> This supplier is not marked as a sole trader. IR35 determination may not be required.
          Personal Service Provider Status: <strong>{formData.soleTraderStatus || 'Not specified'}</strong>
        </NoticeBox>
      )}

      {/* OPW Review Status */}
      {opwReview && (
        <NoticeBox
          type={opwReview.decision === 'rejected' ? 'error'
            : (opwReview.employmentStatus === 'self_employed' || opwReview.ir35Status === 'outside') ? 'success'
            : 'error'}
          style={{ marginBottom: 'var(--space-24)' }}
        >
          {opwReview.decision === 'rejected' ? (
            <>
              <strong>OPW Panel Decision: Rejected</strong>
              <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                <strong>Rejected by:</strong> {opwReview.signature || opwReview.reviewedBy}
              </p>
              <p style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
                <strong>Date:</strong> {formatDate(opwReview.date || opwReview.reviewedAt)}
              </p>
              <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                <strong>Rejection Reason:</strong> {opwReview.rejectionReason}
              </p>
            </>
          ) : opwReview.workerClassification === 'sole_trader' ? (
            <>
              <strong>Employment Status: {opwReview.employmentStatus === 'self_employed' ? 'Self-Employed (Supplier Route)' : 'Employed (Payroll/ESR Route)'}</strong>
              <p style={{ marginTop: 'var(--space-8)', marginBottom: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Reviewed by {opwReview.signature || opwReview.reviewedBy} on {formatDate(opwReview.date || opwReview.reviewedAt)}
              </p>
            </>
          ) : (
            <>
              <strong>IR35 Determination: {opwReview.ir35Status === 'outside' ? 'Outside IR35 (Supplier Route)' : 'Inside IR35 (Payroll/ESR Route)'}</strong>
              {opwReview.rationale && (
                <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                  <strong>Rationale:</strong> {opwReview.rationale}
                </p>
              )}
              <p style={{ marginTop: 'var(--space-8)', marginBottom: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                Reviewed by {opwReview.signature || opwReview.reviewedBy} on {formatDate(opwReview.date || opwReview.reviewedAt)}
              </p>
            </>
          )}
        </NoticeBox>
      )}

      {/* SDS Status Tracking Panel (Read-Only) - Shows when Inside IR35 has been determined */}
      {opwReview && opwReview.ir35Status === 'inside' && opwReview.sdsTracking && (
        <ReviewCard title="SDS Status Tracking" highlight>
          <p style={{ margin: '0 0 var(--space-8) 0' }}><strong>Status:</strong> SDS Issued &mdash; Awaiting Intermediary Response</p>
          <p style={{ margin: '0 0 var(--space-8) 0' }}><strong>SDS Issued:</strong> {formatDate(opwReview.sdsTracking.sdsIssuedDate)}</p>
          {opwReview.sdsTracking.sdsResponseReceived ? (
            <p style={{ margin: '0 0 var(--space-8) 0' }}><strong>Response Received:</strong> {formatDate(opwReview.sdsTracking.sdsResponseDate)}</p>
          ) : (
            <p style={{ margin: '0 0 var(--space-8) 0' }}><strong>Response Deadline:</strong> {opwReview.sdsTracking.sdsIssuedDate ? formatDate(new Date(new Date(opwReview.sdsTracking.sdsIssuedDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()) : 'N/A'}</p>
          )}
          <p style={{ margin: '0 0 var(--space-16) 0' }}><strong>Sent To:</strong> {formData.contactEmail || formData.email || 'Supplier contact email'}</p>

          <NoticeBox type="info">
            The intermediary has 14 days from the SDS issue date to agree or disagree.
            If they disagree, the OPW Panel has 45 days to reconsider.
            Correspondence should happen via email to <strong>bartshealth.opwpanelbarts@nhs.net</strong>
          </NoticeBox>
        </ReviewCard>
      )}

      {/* Requester Information */}
      <ReviewCard title="Requester Information">
        <ReviewItem label="Name" value={`${formData.firstName || ''} ${formData.lastName || ''}`} />
        <ReviewItem label="Department" value={formData.department} />
        <ReviewItem label="NHS Email" value={formData.nhsEmail} raw />
      </ReviewCard>

      {/* Section 2: Pre-Screening */}
      <ReviewCard title="Section 2: Pre-Screening">
        <ReviewItem label="Supplier Connection" value={formData.supplierConnection} />
        {formData.supplierConnection === 'yes' && formData.connectionDetails && (
          <div style={{
            marginTop: 'var(--space-8)',
            padding: 'var(--space-12)',
            backgroundColor: '#fbf8ec',
            borderRadius: 'var(--radius-base)',
          }}>
            <strong style={{ color: '#b45309' }}>Connection Details:</strong>
            <p style={{ margin: 'var(--space-4) 0 0 0', color: '#92400e' }}>{formData.connectionDetails}</p>
          </div>
        )}
        <ReviewItem label="Letterhead Available" value={formData.letterheadAvailable} />
        <ReviewItem label="Service Category" value={formatServiceCategory(formData.serviceCategory)} raw />
        <ReviewItem label="Procurement Engaged" value={formData.procurementEngaged} />
        <ReviewItem label="Usage Frequency" value={formatUsageFrequency(formData.usageFrequency)} raw />
        {formData.justification && (
          <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-12)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-base)' }}>
            <strong>Justification:</strong>
            <p style={{ margin: 'var(--space-4) 0 0 0' }}>{formData.justification}</p>
          </div>
        )}
      </ReviewCard>

      {/* Section 3: Supplier Classification */}
      <ReviewCard title="Section 3: Supplier Classification">
        <ReviewItem label="Companies House Registered" value={formData.companiesHouseRegistered} />
        {formData.crn && formData.supplierType === 'limited_company' && (
          <ReviewItem
            label="Company Registration Number"
            value={formData.crn}
            badge={formData.crnVerification?.status && <VerificationBadge companyStatus={formData.crnVerification.status} size="small" />}
          />
        )}
        {formData.crnCharity && formData.supplierType === 'charity' && (
          <ReviewItem
            label="Company Registration Number"
            value={formData.crnCharity}
            badge={formData.crnVerification?.status && <VerificationBadge companyStatus={formData.crnVerification.status} size="small" />}
          />
        )}
        <ReviewItem label="Supplier Type" value={formatSupplierType(formData.supplierType)} raw />
        {(formData.supplierType === 'sole_trader' || formData.supplierType === 'individual') && (
          <>
            <ReviewItem label="ID Type" value={formData.idType === 'driving_licence' ? 'Driving Licence' : 'Passport'} raw />
            <ReviewItem label="ID Uploaded" value={formData.idUploaded ? 'Yes' : 'No'} raw />
          </>
        )}
      </ReviewCard>

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

      {/* Personal Service Status & Evidence */}
      <ReviewCard title="Personal Service Status & Evidence" highlight={isSoleTrader}>
        <ReviewItem label="Is the supplier providing a personal service?" value={formData.soleTraderStatus} />

        {isSoleTrader && (
          <>
            <div style={{ marginTop: 'var(--space-16)', padding: 'var(--space-12)', backgroundColor: '#FFF', borderRadius: 'var(--radius-base)', border: '1px solid var(--color-border)' }}>
              <strong>Required Documents:</strong>
              <ul style={{ marginTop: 'var(--space-8)', marginBottom: 0, paddingLeft: '20px' }}>
                <li>CEST Form: {submission.uploadedFiles?.cestForm ? <><CheckIcon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Uploaded</> : <><XIcon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Missing</>}</li>
              </ul>
            </div>
          </>
        )}
      </ReviewCard>

      {/* Service Details */}
      <ReviewCard title="Service Details">
        <ReviewItem label="Service Category" value={formatServiceCategory(formData.serviceCategory)} raw />
        <ReviewItem label="Service Types" value={formatServiceTypes(formData.serviceType)} raw />
        <ReviewItem label="Usage Frequency" value={formatUsageFrequency(formData.usageFrequency)} raw />
        {formData.serviceDescription && (
          <div style={{ marginTop: 'var(--space-12)', padding: 'var(--space-12)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-base)' }}>
            <strong>Service Description:</strong>
            <p style={{ margin: 'var(--space-8) 0 0 0' }}>{formData.serviceDescription}</p>
          </div>
        )}
        {formData.justification && (
          <div style={{ marginTop: 'var(--space-12)', padding: 'var(--space-12)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-base)' }}>
            <strong>Justification:</strong>
            <p style={{ margin: 'var(--space-8) 0 0 0' }}>{formData.justification}</p>
          </div>
        )}
      </ReviewCard>

      {/* Supplier Details */}
      <ReviewCard title="Supplier Details">
        <ReviewItem label="Company/Individual Name" value={formData.companyName} />
        <ReviewItem label="Contact Name" value={formData.contactName} />
        <ReviewItem label="Contact Email" value={formData.contactEmail} raw />
        <ReviewItem label="Contact Phone" value={formData.contactPhone} />
      </ReviewCard>

      {/* Section 6: Financial Information */}
      <ReviewCard title="Section 6: Financial & Accounts">
        <ReviewItem label="Overseas Supplier" value={formData.overseasSupplier} />

        {/* Bank Details Provided Badge */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #22c55e',
          backgroundColor: '#f0fdf4',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '12px',
          marginBottom: '12px',
        }}>
          <CheckIcon size={16} color="#22c55e" />
          <div>
            <strong style={{ color: '#166534' }}>
              {formData.overseasSupplier === 'yes' ? 'Overseas Bank Details Provided' : 'UK Bank Details Provided'}
            </strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
              Banking information has been submitted and will be verified by AP Control.
            </p>
          </div>
        </div>

        {formData.iban && <ReviewItem label="IBAN" value={formData.iban} />}
        <ReviewItem label="Accounts Address Same" value={formData.accountsAddressSame} />
        <ReviewItem label="GHX/DUNS Known" value={formData.ghxDunsKnown} />
        {formData.ghxDunsNumber && <ReviewItem label="GHX/DUNS Number" value={formData.ghxDunsNumber} />}
        <ReviewItem label="CIS Registered" value={formData.cisRegistered} />
        {formData.utrNumber && <ReviewItem label="UTR Number" value={formData.utrNumber} />}
        <ReviewItem label="VAT Registered" value={formData.vatRegistered} />
        {formData.vatNumber && <ReviewItem label="VAT Number" value={formData.vatNumber} />}
        <ReviewItem label="Public Liability Insurance" value={formData.publicLiability} />
        {formData.plCoverage && <ReviewItem label="Coverage" value={`£${formData.plCoverage?.toLocaleString()}`} />}
      </ReviewCard>

      {/* Uploaded Documents */}
      {submission.uploadedFiles && Object.keys(submission.uploadedFiles).length > 0 && (
        <ReviewCard title="Uploaded Documents">
          {Object.entries(submission.uploadedFiles).map(([fieldName, file]) => {
            const labels = {
              cestForm: 'CEST Form',
              passportPhoto: 'Passport Photo',
              licenceFront: 'Driving Licence (Front)',
              licenceBack: 'Driving Licence (Back)',
              opwContract: 'OPW/IR35 Agreement',
            };

            const isOPWRelated = ['cestForm'].includes(fieldName);

            return (
              <div key={fieldName} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-12)',
                padding: 'var(--space-12)',
                backgroundColor: isOPWRelated ? '#FFF9E6' : 'var(--color-background)',
                borderRadius: 'var(--radius-base)',
                border: isOPWRelated ? '1px solid var(--color-warning)' : '1px solid var(--color-border)',
                marginBottom: 'var(--space-8)',
              }}>
                {isOPWRelated ? <WarningIcon size={24} color="#f59e0b" /> : null}
                {!isOPWRelated && (
                  <span style={{
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
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                    {labels[fieldName] || fieldName}
                    {isOPWRelated && <span style={{ marginLeft: '8px', color: 'var(--color-warning)', fontSize: 'var(--font-size-sm)' }}>• IR35 Evidence</span>}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {file.name} • {Math.round(file.size / 1024)} KB
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePreviewDocument(file)}
                  style={{ fontSize: 'var(--font-size-sm)', padding: '6px 12px' }}
                >
                  Preview
                </Button>
              </div>
            );
          })}
        </ReviewCard>
      )}

      {/* Section 7: Final Acknowledgement */}
      <ReviewCard title="Section 7: Final Acknowledgement">
        <ReviewItem
          label="Final Acknowledgement"
          value={formData.finalAcknowledgement ? 'Confirmed - All information is accurate and complete' : 'Not confirmed'}
        />
      </ReviewCard>

      {/* Previous Authorisations Section - Show before OPW decision */}
      <div className="previous-authorisations-section" style={{
        background: '#f0f7ff',
        border: '1px solid #005EB8',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        marginTop: '32px'
      }}>
        <h3 style={{ color: '#005EB8', marginTop: 0, marginBottom: '16px', fontSize: '1.25rem' }}>
          Previous Authorisations
        </h3>

        {/* PBP Review - if exists */}
        {submission?.pbpReview && (
          <div className="auth-card" style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <h4 style={{ color: '#005EB8', marginTop: 0, marginBottom: '12px', fontSize: '1rem' }}>
              Procurement Business Partner
            </h4>
            <div className="auth-details">
              <p style={{ margin: '8px 0' }}>
                <strong>Decision:</strong>{' '}
                <span className={`status-badge ${submission.pbpReview.decision}`} style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: submission.pbpReview.decision === 'approved' ? '#22c55e' :
                             submission.pbpReview.decision === 'info_required' ? '#f59e0b' : '#ef4444',
                  color: 'white'
                }}>
                  {submission.pbpReview.decision === 'info_required' ? 'INFO REQUIRED' : submission.pbpReview.decision?.toUpperCase()}
                </span>
              </p>
              {(submission.pbpReview.finalComments || submission.pbpReview.comments) && (
                <p style={{ margin: '8px 0' }}><strong>Comments:</strong> {submission.pbpReview.finalComments || submission.pbpReview.comments}</p>
              )}
              <div className="signature-info" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb',
                color: '#6b7280',
                fontSize: '0.9rem'
              }}>
                <span><strong>Signed by:</strong> {submission.pbpReview.signature || 'Not recorded'}</span>
                <span><strong>Date:</strong> {submission.pbpReview.date || 'Not recorded'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Procurement Review - should always exist if OPW is reviewing */}
        {submission?.procurementReview && (
          <div className="auth-card" style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <h4 style={{ color: '#005EB8', marginTop: 0, marginBottom: '12px', fontSize: '1rem' }}>
              Procurement
            </h4>
            <div className="auth-details">
              <p style={{ margin: '8px 0' }}>
                <strong>Classification:</strong>{' '}
                {submission.procurementReview.supplierClassification === 'standard'
                  ? 'Standard Supplier'
                  : 'Potential OPW/IR35'}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>Decision:</strong>{' '}
                <span className={`status-badge ${submission.procurementReview.decision}`} style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: submission.procurementReview.decision === 'approved' ? '#22c55e' :
                             submission.procurementReview.decision === 'info_required' ? '#f59e0b' : '#ef4444',
                  color: 'white'
                }}>
                  {submission.procurementReview.decision?.toUpperCase()}
                </span>
              </p>
              {submission.procurementReview.comments && (
                <p style={{ margin: '8px 0' }}><strong>Comments:</strong> {submission.procurementReview.comments}</p>
              )}
              <div className="signature-info" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb',
                color: '#6b7280',
                fontSize: '0.9rem'
              }}>
                <span><strong>Signed by:</strong> {submission.procurementReview.signature || 'Not recorded'}</span>
                <span><strong>Date:</strong> {submission.procurementReview.date || 'Not recorded'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== PHASE 2: NEW OPW DETERMINATION PANEL ========== */}
      {!opwReview && (
        <div style={{
          marginTop: 'var(--space-32)',
          padding: 'var(--space-24)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-base)',
          border: '2px solid var(--color-border)',
        }}>
          <h4 style={{ margin: '0 0 var(--space-16) 0', color: 'var(--nhs-blue)' }}>
            OPW / IR35 Determination
          </h4>

          {/* Worker Classification Display (Read-Only) */}
          <NoticeBox type={workerClassification === 'sole_trader' ? 'warning' : 'info'} style={{ marginBottom: 'var(--space-16)' }}>
            <strong>Worker Classification:</strong>{' '}
            <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
              {workerClassification === 'sole_trader' ? 'SOLE TRADER (Direct Worker)' : 'INTERMEDIARY (Limited Company/Partnership)'}
            </span>
            <p style={{ marginTop: 'var(--space-8)', marginBottom: 0, fontSize: '0.95em' }}>
              {workerClassification === 'sole_trader' ? (
                <>Automatically classified based on personal service status. Determine employment status to route correctly.</>
              ) : (
                <>Automatically classified based on supplier type. Perform IR35 assessment to determine tax treatment.</>
              )}
            </p>
          </NoticeBox>

          {/* ===== SOLE TRADER PATH ===== */}
          {workerClassification === 'sole_trader' && (
            <>
              <NoticeBox type="info" style={{ marginBottom: 'var(--space-16)' }}>
                <strong>Sole Trader Guidance:</strong>
                <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                  Determine whether this sole trader should be classified as <strong>Employed</strong> (paid via NHS payroll/ESR)
                  or <strong>Self-Employed</strong> (paid as Oracle supplier). Consider the working relationship, control, and HMRC guidance.
                </p>
              </NoticeBox>

              <div style={{ marginBottom: 'var(--space-16)' }}>
                <RadioGroup
                  label="Employment Status Determination"
                  name="employmentStatus"
                  options={[
                    {
                      value: 'self_employed',
                      label: 'Self-Employed',
                      description: 'Worker operates their own business - can be paid as a supplier (Oracle record created)'
                    },
                    {
                      value: 'employed',
                      label: 'Employed',
                      description: 'Worker should be on NHS payroll - must use ESR (NO Oracle supplier record)'
                    },
                    {
                      value: 'rejected',
                      label: 'Reject Request',
                      description: 'Insufficient evidence or non-compliance',
                      variant: 'danger'
                    },
                  ]}
                  value={employmentStatus}
                  onChange={setEmploymentStatus}
                  required
                />
              </div>

              {/* Warning for Employed */}
              {employmentStatus === 'employed' && (
                <NoticeBox type="error" style={{ marginBottom: 'var(--space-16)' }}>
                  <strong>⚠️ EMPLOYED - Payroll Route (Terminal State)</strong>
                  <p style={{ marginTop: '8px', marginBottom: 0 }}>
                    This worker will be routed to HR/Payroll for ESR setup. <strong>NO Oracle supplier record will be created.</strong>
                    This supplier request will be marked as complete after your determination.
                  </p>
                </NoticeBox>
              )}

              {/* Info for Self-Employed */}
              {employmentStatus === 'self_employed' && (
                <>
                  <NoticeBox type="success" style={{ marginBottom: 'var(--space-16)' }}>
                    <strong>&#10003; Self-Employed - Supplier Route</strong>
                    <p style={{ marginTop: '8px', marginBottom: 0 }}>
                      This worker is self-employed and can be paid as a supplier.
                      {contractRequired === 'yes' && ' Will proceed to Contract Drafter for agreement negotiation.'}
                      {contractRequired === 'no' && ' Will proceed directly to AP Control for bank details verification.'}
                      {!contractRequired && ' Please indicate if a contract is required.'}
                    </p>
                  </NoticeBox>

                  {/* Contract Required Question for Self-Employed Sole Traders */}
                  <div style={{ marginBottom: 'var(--space-16)' }}>
                    <RadioGroup
                      label="Is a Contract Required?"
                      name="contractRequiredSoleTrader"
                      options={[
                        { value: 'yes', label: 'Yes - Contract negotiation needed' },
                        { value: 'no', label: 'No - Proceed without contract' },
                      ]}
                      value={contractRequired}
                      onChange={setContractRequired}
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* ===== INTERMEDIARY PATH ===== */}
          {workerClassification === 'intermediary' && (
            <>
              <NoticeBox type="info" style={{ marginBottom: 'var(--space-16)' }}>
                <strong>IR35 Guidance:</strong>
                <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                  Based on the CEST form, determine whether this engagement falls inside or outside IR35.
                  Consider control, substitution, mutuality of obligation, and the working relationship nature.
                </p>
              </NoticeBox>

              <div style={{ marginBottom: 'var(--space-16)' }}>
                <RadioGroup
                  label="IR35 Determination"
                  name="ir35Determination"
                  options={[
                    {
                      value: 'outside',
                      label: 'Outside IR35',
                      description: 'Worker genuinely self-employed - operates own business with control, risk, multiple clients'
                    },
                    {
                      value: 'inside',
                      label: 'Inside IR35',
                      description: 'Worker operates like employee - subject to control, no business risk, single client'
                    },
                    {
                      value: 'rejected',
                      label: 'Reject Request',
                      description: 'Insufficient evidence, non-compliance, or other issues',
                      variant: 'danger'
                    },
                  ]}
                  value={ir35Determination}
                  onChange={setIr35Determination}
                  required
                />
              </div>

              {/* Contract Required Question (for Outside IR35 only - Inside IR35 goes to payroll) */}
              {ir35Determination === 'outside' && (
                <div style={{ marginBottom: 'var(--space-16)' }}>
                  <RadioGroup
                    label="Is a Contract Required?"
                    name="contractRequired"
                    options={[
                      { value: 'yes', label: 'Yes - Contract negotiation needed' },
                      { value: 'no', label: 'No - Proceed without contract' },
                    ]}
                    value={contractRequired}
                    onChange={setContractRequired}
                    required
                  />
                </div>
              )}

              {/* Inside IR35 Warning + SDS Tracking */}
              {ir35Determination === 'inside' && (
                <NoticeBox type="error" style={{ marginBottom: 'var(--space-16)' }}>
                  <strong>⚠️ INSIDE IR35 - Payroll Route (Terminal State)</strong>
                  <p style={{ marginTop: '8px', marginBottom: 0 }}>
                    This worker will be routed to HR/Payroll for ESR setup. <strong>NO Oracle supplier record will be created.</strong>
                    A Status Determination Statement (SDS) must be issued. This supplier request will be marked as complete after your determination.
                  </p>

                  {/* SDS Tracking */}
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #fca5a5' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.95em' }}>Status Determination Statement (SDS) Tracking</h5>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input
                        type="checkbox"
                        checked={sdsIssued}
                        onChange={(e) => setSdsIssued(e.target.checked)}
                      />
                      <span>SDS has been issued to the worker</span>
                    </label>

                    {sdsIssued && (
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em', fontWeight: 'bold' }}>
                            SDS Issued Date
                          </label>
                          <input
                            type="date"
                            value={sdsIssuedDate}
                            onChange={(e) => setSdsIssuedDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              fontSize: '0.95em'
                            }}
                          />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <input
                            type="checkbox"
                            checked={sdsResponseReceived}
                            onChange={(e) => setSdsResponseReceived(e.target.checked)}
                          />
                          <span>Worker response received (within 14 days)</span>
                        </label>

                        {sdsResponseReceived && (
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9em', fontWeight: 'bold' }}>
                              Response Received Date
                            </label>
                            <input
                              type="date"
                              value={sdsResponseDate}
                              onChange={(e) => setSdsResponseDate(e.target.value)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '4px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.95em'
                              }}
                            />
                          </div>
                        )}

                        {sdsIssuedDate && (
                          <p style={{ fontSize: '0.85em', color: '#7f1d1d', margin: '8px 0 0 0' }}>
                            <strong>Days since SDS issued:</strong> {Math.floor((new Date() - new Date(sdsIssuedDate)) / (1000 * 60 * 60 * 24))} days
                            {(Math.floor((new Date() - new Date(sdsIssuedDate)) / (1000 * 60 * 60 * 24)) > 14) && !sdsResponseReceived && (
                              <span> <strong style={{ color: '#991b1b' }}>⚠️ 14-day response window expired</strong></span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </NoticeBox>
              )}

              {/* Outside IR35 Info */}
              {ir35Determination === 'outside' && (
                <NoticeBox type="success" style={{ marginBottom: 'var(--space-16)' }}>
                  <strong>✓ Outside IR35 - Supplier Route</strong>
                  <p style={{ marginTop: '8px', marginBottom: 0 }}>
                    This worker operates a genuine business and can be paid as a supplier.
                    {contractRequired === 'yes' && ' Will proceed to Contract Drafter for agreement negotiation.'}
                    {contractRequired === 'no' && ' Will proceed directly to AP Control for bank details verification.'}
                    {!contractRequired && ' Please indicate if a contract is required.'}
                  </p>
                </NoticeBox>
              )}

              {/* Rationale */}
              {(ir35Determination === 'inside' || ir35Determination === 'outside') && (
                <Textarea
                  label="Rationale for IR35 Determination (Required)"
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  rows={6}
                  placeholder="Provide detailed rationale for your IR35 determination, referencing the CEST form and evidence. Explain key factors: control, substitution rights, mutuality of obligation, financial risk..."
                  required
                  maxLength={1000}
                  showCharCount
                  style={{ marginBottom: 'var(--space-16)' }}
                />
              )}
            </>
          )}

          {/* Rejection Reason (Common for Both Paths) */}
          {(employmentStatus === 'rejected' || ir35Determination === 'rejected') && (
            <div style={{
              marginBottom: 'var(--space-16)',
              padding: 'var(--space-16)',
              border: '2px solid var(--color-danger)',
              borderRadius: 'var(--radius-base)',
              backgroundColor: '#fff5f5'
            }}>
              <h4 style={{ margin: '0 0 var(--space-12) 0', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CircleXIcon size={20} />
                Rejection Reason Required
              </h4>
              <Textarea
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                placeholder="Explain why this request is being rejected (e.g., insufficient evidence, invalid CEST form, non-compliance with OPW policies, missing documentation)..."
                required
                maxLength={1000}
                showCharCount
              />
            </div>
          )}

          {/* Proceed to Sign Button */}
          {!actionSelected && (
            <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-16)' }}>
              <Button
                variant={(employmentStatus === 'rejected' || ir35Determination === 'rejected') ? 'danger' : 'primary'}
                onClick={() => setActionSelected(true)}
                disabled={
                  (workerClassification === 'sole_trader' && !employmentStatus) ||
                  (workerClassification === 'intermediary' && !ir35Determination) ||
                  ((employmentStatus === 'rejected' || ir35Determination === 'rejected') && !rejectionReason.trim()) ||
                  (workerClassification === 'intermediary' && (ir35Determination === 'inside' || ir35Determination === 'outside') && !rationale.trim()) ||
                  (workerClassification === 'intermediary' && ir35Determination === 'outside' && !contractRequired) ||
                  (workerClassification === 'sole_trader' && employmentStatus === 'self_employed' && !contractRequired)
                }
              >
                {(employmentStatus === 'rejected' || ir35Determination === 'rejected') ? 'Proceed to Sign Rejection' : 'Proceed to Sign Determination'}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.close()}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Digital Signature Section - Only shown after clicking Proceed */}
          {actionSelected && (
            <>
              <SignatureSection
                signatureName={signatureName}
                signatureDate={signatureDate}
                onSignatureChange={({ signatureName: name, signatureDate: date }) => {
                  setSignatureName(name);
                  setSignatureDate(date);
                }}
              />

              {/* Final Confirmation Buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-16)' }}>
                <Button
                  variant={ir35Determination === 'rejected' ? 'danger' : 'primary'}
                  onClick={handleSubmitDetermination}
                  disabled={isSubmitting || !signatureName.trim()}
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : ir35Determination === 'rejected'
                    ? 'Confirm Rejection'
                    : 'Confirm Determination'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionSelected(false);
                    setSignatureName('');
                  }}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Contract Negotiation - Next Stage Notice */}
      {opwReview && opwReview.decision !== 'rejected' && (
        <div style={{
          marginTop: 'var(--space-32)',
          padding: 'var(--space-24)',
          backgroundColor: '#f0f7ff',
          borderRadius: 'var(--radius-base)',
          border: '2px solid #dbeafe',
        }}>
          <h4 style={{ margin: '0 0 var(--space-16) 0', color: 'var(--nhs-blue)' }}>
            📋 Next Stage: Contract Negotiation
          </h4>

          <NoticeBox type="info" style={{ marginBottom: 'var(--space-16)' }}>
            <strong>Contract Drafter Stage:</strong>
            <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
              This submission will now proceed to the <strong>Contract Drafter</strong> for agreement negotiation.
            </p>
            <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
              The Contract Drafter will use a dedicated page to:
            </p>
            <ul style={{ marginTop: 'var(--space-8)', marginBottom: 0, paddingLeft: 'var(--space-20)' }}>
              <li>Select and send the appropriate agreement template ({opwReview.ir35Status === 'outside_ir35' ? 'Consultancy Agreement' : 'Sole Trader Agreement'})</li>
              <li>Exchange messages with the supplier and requester</li>
              <li>Negotiate contract terms if needed</li>
              <li>Review and approve the signed contract</li>
              <li>Forward to AP Control for final verification</li>
            </ul>
          </NoticeBox>

          <div style={{
            padding: 'var(--space-12)',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde047',
            borderRadius: 'var(--radius-sm)',
          }}>
            <strong>ℹ️ Note:</strong> Contract upload is no longer done at this stage. The Contract Drafter will manage all agreement exchange and signature collection through their dedicated workflow page.
          </div>
        </div>
      )}

      {/* Back Button & PDF Download */}
      <div style={{ marginTop: 'var(--space-32)', display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <Button variant="outline" onClick={() => window.close()}>
          Close Preview
        </Button>
        {opwReview?.decision && (
          <PDFDownloadLink
            document={
              <SupplierFormPDF
                formData={submission.formData}
                uploadedFiles={submission.uploadedFiles || {}}
                submissionId={submission.submissionId}
                submissionDate={submission.submissionDate}
                submission={{
                  ...submission,
                  pbpReview: submission.pbpReview || null,
                  procurementReview: submission.procurementReview || null,
                  opwReview: opwReview,
                  contractDrafter: submission.contractDrafter || null,
                  apReview: null,
                }}
              />
            }
            fileName={`Supplier_Form_${submission?.alembaReference || submission?.submissionId || 'unknown'}_OPW.pdf`}
            style={{
              padding: '12px 24px',
              background: '#005EB8',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            {({ loading }) => loading ? 'Generating PDF...' : 'Download Supplier Form PDF'}
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
};

export default OPWReviewPage;
