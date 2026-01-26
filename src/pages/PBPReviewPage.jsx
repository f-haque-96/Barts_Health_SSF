/**
 * PBP (Procurement Business Partner) Review Page
 * Reviews ONLY Section 1 (Requester Info) and Questionnaire answers
 * PBP's role is to review supplier suitability, NOT to set up the supplier
 *
 * Supports multi-round information exchange between PBP and Requester
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button, NoticeBox, ApprovalStamp, Textarea, FileUpload, CheckIcon, XIcon, WarningIcon, ClockIcon, ClipboardIcon, DocumentIcon, DownloadIcon, CircleCheckIcon, CircleXIcon, PaperclipIcon } from '../components/common';
import { formatDate, formatCurrency } from '../utils/helpers';
import { formatYesNo, formatFieldValue, capitalizeWords } from '../utils/formatters';
import PBPApprovalPDF from '../components/pdf/PBPApprovalPDF';

// ===== Exchange Thread Component =====
// Displays the conversation history between PBP and Requester
const ExchangeThread = ({ exchanges, onPreviewDocument }) => {
  if (!exchanges || exchanges.length === 0) return null;

  return (
    <div style={{
      marginBottom: 'var(--space-24)',
      border: '2px solid var(--color-border)',
      borderRadius: 'var(--radius-base)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: 'var(--space-16)',
        backgroundColor: 'var(--nhs-blue)',
        color: 'white',
      }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          <ClipboardIcon size={18} color="white" /> Information Exchange ({exchanges.length} {exchanges.length === 1 ? 'message' : 'messages'})
        </h3>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {exchanges.map((exchange, index) => {
          const isPBP = exchange.from === 'pbp';
          const isDecision = exchange.type === 'decision';

          return (
            <div
              key={exchange.id || index}
              style={{
                padding: 'var(--space-16)',
                borderBottom: index < exchanges.length - 1 ? '1px solid var(--color-border)' : 'none',
                backgroundColor: isDecision
                  ? (exchange.decision === 'approved' ? '#f0fdf4' : '#fef2f2')
                  : (isPBP ? '#f0f7ff' : '#fefce8'),
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-8)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: isPBP ? '#005EB8' : '#ca8a04',
                    color: 'white',
                  }}>
                    {isPBP ? 'PBP' : 'REQUESTER'}
                  </span>
                  <span style={{ fontWeight: '600' }}>{exchange.fromName}</span>
                  {isDecision && (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: exchange.decision === 'approved' ? '#22c55e' : '#ef4444',
                      color: 'white',
                    }}>
                      {exchange.decision === 'approved' ? <><CheckIcon size={14} /> APPROVED</> : <><XIcon size={14} /> REJECTED</>}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {formatDate(exchange.timestamp)}
                </span>
              </div>

              {/* Message */}
              <div style={{
                padding: 'var(--space-12)',
                backgroundColor: 'white',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{exchange.message}</p>
              </div>

              {/* Attachments */}
              {exchange.attachments && Object.keys(exchange.attachments).length > 0 && (
                <div style={{ marginTop: 'var(--space-8)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <PaperclipIcon size={14} color="var(--color-text-secondary)" /> Attachments:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {Object.entries(exchange.attachments).map(([key, file]) => (
                      <button
                        key={key}
                        onClick={() => onPreviewDocument && onPreviewDocument(file)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: '#eff6ff',
                          border: '1px solid #005EB8',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: '#005EB8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <DocumentIcon size={14} style={{ marginRight: '4px' }} /> {file.name || key}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== Current Status Badge =====
const StatusBadge = ({ status, isAwaitingRequester }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return { bg: '#22c55e', text: 'Approved', color: 'white', Icon: CheckIcon };
      case 'rejected':
        return { bg: '#ef4444', text: 'Rejected', color: 'white', Icon: XIcon };
      case 'info_required':
        return isAwaitingRequester
          ? { bg: '#f59e0b', text: 'Awaiting Requester Response', color: 'white', Icon: ClockIcon }
          : { bg: '#3b82f6', text: 'Requester Responded - Review Needed', color: 'white', Icon: ClipboardIcon };
      default:
        return { bg: '#6b7280', text: 'Pending Review', color: 'white', Icon: ClockIcon };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.Icon;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      backgroundColor: config.bg,
      color: config.color,
      borderRadius: '6px',
      fontWeight: '600',
      fontSize: '0.9rem',
    }}>
      <IconComponent size={16} color="white" />
      {config.text}
    </span>
  );
};

const ReviewField = ({ label, value, isLongText = false, raw = false }) => {
  if (!value && value !== 0) return null;

  // Format the value unless raw is true
  const displayValue = raw ? value : formatFieldValue(value);

  return (
    <div style={{ marginBottom: 'var(--space-16)' }}>
      <label style={{
        display: 'block',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-secondary)',
        marginBottom: 'var(--space-4)',
        fontSize: 'var(--font-size-sm)',
      }}>
        {label}
      </label>
      {isLongText ? (
        <p style={{
          margin: 0,
          padding: 'var(--space-12)',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-base)',
          border: '1px solid var(--color-border)',
          lineHeight: 1.6,
        }}>
          {displayValue}
        </p>
      ) : (
        <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text)', paddingLeft: '0' }}>
          {displayValue}
        </div>
      )}
    </div>
  );
};

const ReviewSection = ({ title, children }) => {
  return (
    <div style={{
      padding: 'var(--space-24)',
      borderRadius: 'var(--radius-base)',
      border: '2px solid var(--color-border)',
      marginBottom: 'var(--space-24)',
      backgroundColor: 'var(--color-surface)',
    }}>
      <h3 style={{
        margin: '0 0 var(--space-20) 0',
        color: 'var(--nhs-blue)',
        fontSize: '1.25rem',
        borderBottom: '2px solid var(--color-border)',
        paddingBottom: 'var(--space-12)',
      }}>
        {title}
      </h3>
      <div className="review-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-16)',
      }}>
        {children}
      </div>
    </div>
  );
};

// Clinical Questionnaire Review Component
const ClinicalQuestionnaireReview = ({ data }) => {
  if (!data) return <p>No questionnaire data available</p>;

  return (
    <>
      <ReviewField
        label="Clinical Services Description"
        value={data.clinicalServices}
        isLongText
      />
      <ReviewField
        label="Direct Patient Contact"
        value={data.patientContact === 'yes' ? 'Yes' : 'No'}
      />
      <ReviewField
        label="Patient Data Access Required"
        value={data.patientDataAccess === 'yes' ? 'Yes' : 'No'}
      />
      <ReviewField
        label="Clinical Qualifications/Registrations"
        value={data.clinicalQualifications}
        isLongText
      />
      <ReviewField
        label="Estimated Annual Contract Value"
        value={data.annualValue ? `£${data.annualValue.toLocaleString()}` : ''}
      />
      <ReviewField
        label="Clinical Impact Assessment"
        value={data.clinicalAssessment === 'yes' ? 'Completed' : data.clinicalAssessment === 'no' ? 'Not Completed' : 'In Progress'}
      />
      {data.additionalNotes && (
        <ReviewField
          label="Additional Notes"
          value={data.additionalNotes}
          isLongText
        />
      )}
    </>
  );
};

// Non-Clinical Questionnaire Review Component
const NonClinicalQuestionnaireReview = ({ data }) => {
  if (!data) return <p>No questionnaire data available</p>;

  const categoryLabels = {
    facilities: 'Facilities Management',
    it_hardware: 'IT Hardware',
    it_software: 'IT Software/Services',
    office_supplies: 'Office Supplies',
    professional_services: 'Professional Services',
    training: 'Training & Development',
    marketing: 'Marketing & Communications',
    catering: 'Catering',
    transport: 'Transport & Logistics',
    other: 'Other',
  };

  return (
    <>
      <ReviewField
        label="Goods/Services Description"
        value={data.goodsServices}
        isLongText
      />
      <ReviewField
        label="Procurement Category"
        value={categoryLabels[data.procurementCategory] || data.procurementCategory}
      />
      <ReviewField
        label="Estimated Annual Contract Value"
        value={data.annualValue ? `£${data.annualValue.toLocaleString()}` : ''}
      />
      <ReviewField
        label="Framework Agreement Available"
        value={data.frameworkAgreement === 'yes' ? 'Yes' : data.frameworkAgreement === 'no' ? 'No' : 'Unknown'}
      />
      <ReviewField
        label="Reason for This Supplier"
        value={data.supplierReason}
        isLongText
      />
      <ReviewField
        label="Alternative Suppliers Considered"
        value={data.alternativesConsidered === 'yes' ? 'Yes' : 'No'}
      />
      {data.additionalNotes && (
        <ReviewField
          label="Additional Notes"
          value={data.additionalNotes}
          isLongText
        />
      )}
    </>
  );
};

const PBPReviewPage = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvalAction, setApprovalAction] = useState(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [questionnaireUploads, setQuestionnaireUploads] = useState({});
  const [allUploads, setAllUploads] = useState({
    letterhead: null,
    procurementApproval: null
  });

  // Exchange thread state
  const [exchangeAttachments, setExchangeAttachments] = useState({});

  // Check if we're awaiting requester response (last exchange was from PBP)
  const exchanges = submission?.pbpReview?.exchanges || [];
  const lastExchange = exchanges.length > 0 ? exchanges[exchanges.length - 1] : null;
  const isAwaitingRequester = lastExchange?.from === 'pbp' && lastExchange?.type !== 'decision';
  const hasRequesterResponded = lastExchange?.from === 'requester';

  // Handle file upload for exchange
  const handleExchangeFileUpload = async (file) => {
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
      return;
    }

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      setExchangeAttachments(prev => ({
        ...prev,
        [file.name]: {
          name: file.name,
          size: file.size,
          type: file.type,
          base64: base64,
          uploadedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  // Remove exchange attachment
  const removeExchangeAttachment = (fileName) => {
    const { [fileName]: removed, ...rest } = exchangeAttachments;
    setExchangeAttachments(rest);
  };

  useEffect(() => {
    console.log('=== PBP PAGE: LOADING SUBMISSION ===');
    // Load submission from localStorage
    const submissionData = localStorage.getItem(`submission_${submissionId}`);

    if (submissionData) {
      try {
        const parsed = JSON.parse(submissionData);
        console.log('Parsed submission:', parsed);
        setSubmission(parsed);

        // Load letterhead and procurement approval from multiple locations
        let letterhead = null;
        let procurementApproval = null;

        // Check uploadedFiles object
        if (parsed.uploadedFiles) {
          letterhead = parsed.uploadedFiles.letterhead || null;
          procurementApproval = parsed.uploadedFiles.procurementApproval || null;
        }

        // Check formData.uploadedFiles
        if (!letterhead && parsed.formData?.uploadedFiles?.letterhead) {
          letterhead = parsed.formData.uploadedFiles.letterhead;
        }
        if (!procurementApproval && parsed.formData?.uploadedFiles?.procurementApproval) {
          procurementApproval = parsed.formData.uploadedFiles.procurementApproval;
        }

        // Check uploads object
        if (!letterhead && parsed.uploads?.letterhead) {
          letterhead = parsed.uploads.letterhead;
        }
        if (!procurementApproval && parsed.uploads?.procurementApproval) {
          procurementApproval = parsed.uploads.procurementApproval;
        }

        // Also check supplier-form-uploads in localStorage
        const storedFormUploads = localStorage.getItem('supplier-form-uploads');
        if (storedFormUploads) {
          try {
            const formUploads = JSON.parse(storedFormUploads);
            if (!letterhead && formUploads.letterhead) {
              letterhead = formUploads.letterhead;
            }
            if (!procurementApproval && formUploads.procurementApproval) {
              procurementApproval = formUploads.procurementApproval;
            }
          } catch (e) {
            console.error('Error parsing form uploads:', e);
          }
        }

        console.log('Letterhead found:', !!letterhead);
        console.log('Procurement Approval found:', !!procurementApproval);

        setAllUploads({
          letterhead,
          procurementApproval
        });

        // Load questionnaire uploads with multiple fallback paths
        let qUploads = {};
        if (parsed.questionnaireUploads) {
          qUploads = parsed.questionnaireUploads;
        } else if (parsed.questionnaireData?.uploads) {
          qUploads = parsed.questionnaireData.uploads;
        } else if (parsed.questionnaireData?.uploadedFiles) {
          qUploads = parsed.questionnaireData.uploadedFiles;
        } else if (parsed.formData?.section2?.questionnaireUploads) {
          qUploads = parsed.formData.section2.questionnaireUploads;
        } else if (parsed.formData?.section2?.questionnaireData?.uploads) {
          qUploads = parsed.formData.section2.questionnaireData.uploads;
        } else {
          // Try localStorage directly as last resort
          const storedQuestionnaire = localStorage.getItem('questionnaireSubmission');
          if (storedQuestionnaire) {
            const parsedQ = JSON.parse(storedQuestionnaire);
            qUploads = parsedQ.uploads || parsedQ.uploadedFiles || {};
          }
        }

        console.log('Questionnaire Uploads found:', Object.keys(qUploads));
        setQuestionnaireUploads(qUploads);
      } catch (error) {
        console.error('Error parsing submission:', error);
      }
    }

    setLoading(false);
  }, [submissionId]);

  const handlePreviewDocument = (file) => {
    console.log('Preview file:', file); // Debug log

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

    const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Document Preview - ${file.name || 'Document'}</title>
          <style>
            body { margin: 0; padding: 0; height: 100vh; }
            iframe { width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${base64Data}" type="application/pdf"></iframe>
        </body>
        </html>
      `);
    } else {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Document Preview - ${file.name || 'Image'}</title>
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
    }

    newWindow.document.close();
  };

  const handleApproval = async (action) => {
    if (!reviewerName.trim()) {
      alert('Please enter your name to sign this decision');
      return;
    }

    if (!comments.trim() && (action === 'reject' || action === 'info_required')) {
      alert('Please provide comments explaining your decision');
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = new Date().toISOString();
      const existingExchanges = submission?.pbpReview?.exchanges || [];

      // Create new exchange entry
      const newExchange = {
        id: `EXC-${Date.now()}`,
        type: action === 'info_required' ? 'info_request' : 'decision',
        from: 'pbp',
        fromName: reviewerName,
        fromEmail: 'pbp@nhs.net', // In production, get from auth
        message: comments,
        attachments: Object.keys(exchangeAttachments).length > 0 ? exchangeAttachments : null,
        timestamp: timestamp,
        decision: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null,
      };

      // Build updated exchanges array
      const updatedExchanges = [...existingExchanges, newExchange];

      // Determine final status
      const isFinalDecision = action === 'approve' || action === 'reject';
      const newStatus = isFinalDecision
        ? (action === 'approve' ? 'approved' : 'rejected')
        : 'info_required';

      // Update submission with exchange thread
      const updatedSubmission = {
        ...submission,
        pbpReview: {
          ...submission?.pbpReview,
          decision: newStatus,
          exchanges: updatedExchanges,
          currentStatus: isFinalDecision ? 'complete' : 'awaiting_requester',
          // Final signature only on approve/reject
          ...(isFinalDecision && {
            signature: reviewerName,
            date: signatureDate,
            finalDecision: action,
            finalComments: comments,
            completedAt: timestamp,
          }),
        },
        status: newStatus,
        ...(isFinalDecision && {
          approvalDate: timestamp,
          approver: reviewerName,
          approvalComments: comments,
        }),
      };

      // Save back to localStorage
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Add audit trail entry for rejection
      if (action === 'reject') {
        const requesterName = `${submission?.formData?.section1?.firstName || submission?.formData?.firstName || ''} ${submission?.formData?.section1?.lastName || submission?.formData?.lastName || ''}`.trim();
        const requesterEmail = submission?.formData?.section1?.nhsEmail || submission?.formData?.nhsEmail || submission?.submittedBy || 'Unknown';
        const supplierName = submission?.questionnaireData?.supplierName ||
                           submission?.formData?.section4?.companyName ||
                           'Not recorded at questionnaire stage';

        const auditEntry = {
          submissionId: submissionId,
          timestamp: timestamp,
          action: 'PBP_REJECTED',
          user: reviewerName,
          details: `Submission rejected by PBP. Supplier: ${supplierName} | Requester: ${requesterName} (${requesterEmail})`,
          flag: 'REQUESTER_FLAGGED',
          requesterEmail: requesterEmail,
          requesterName: requesterName,
          supplierName: supplierName,
          rejectionReason: comments
        };

        const auditTrail = JSON.parse(localStorage.getItem('auditTrail') || '[]');
        auditTrail.push(auditEntry);
        localStorage.setItem('auditTrail', JSON.stringify(auditTrail));

        console.log('AUDIT: Requester flagged for rejection:', auditEntry);
      }

      // Update submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = submissions.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        submissions[index].status = newStatus;
        submissions[index].currentStatus = isFinalDecision ? 'complete' : 'awaiting_requester';
        localStorage.setItem('all_submissions', JSON.stringify(submissions));
      }

      setSubmission(updatedSubmission);
      setApprovalAction(null);
      setComments('');
      setExchangeAttachments({});

      // Show appropriate message
      if (action === 'info_required') {
        const requesterEmail = submission?.formData?.section1?.nhsEmail || submission?.formData?.nhsEmail || submission?.submittedBy || 'Unknown';
        alert(`Information request sent successfully!\n\nThe requester (${requesterEmail}) will be notified and can respond at:\n\n${window.location.origin}/respond/${submissionId}\n\n(In production, an email will be sent automatically)`);
      } else {
        const actionText = action === 'approve' ? 'approved' : 'rejected';
        alert(`Questionnaire ${actionText} successfully!`);
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-32)', textAlign: 'center' }}>
        <div className="loading" style={{ width: '48px', height: '48px', margin: '0 auto' }} />
        <p style={{ marginTop: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          Loading questionnaire...
        </p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div style={{ padding: 'var(--space-32)' }}>
        <NoticeBox type="error">
          <h3>Submission Not Found</h3>
          <p>The questionnaire ID "{submissionId}" could not be found.</p>
          <Button onClick={() => navigate('/')} style={{ marginTop: 'var(--space-16)' }}>
            Return to Form
          </Button>
        </NoticeBox>
      </div>
    );
  }

  const formData = submission.formData || {};
  // Get questionnaire type from multiple sources to ensure correct value
  const questionnaireType = submission.questionnaireType ||
                           submission.section2Summary?.serviceCategory ||
                           formData.serviceCategory ||
                           formData.section2?.serviceCategory ||
                           localStorage.getItem('questionnaireType') ||
                           'clinical';
  const questionnaireData = formData[`${questionnaireType}Questionnaire`];

  return (
    <div style={{ padding: 'var(--space-32)', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-32)',
        gap: 'var(--space-24)',
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ margin: '0 0 var(--space-8) 0', color: 'var(--nhs-blue)' }}>
            Procurement Business Partner Review
          </h1>
          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor: questionnaireType === 'clinical' ? '#e8f4fd' : '#f0fdf4',
            color: questionnaireType === 'clinical' ? '#005EB8' : '#047857',
            borderRadius: 'var(--radius-base)',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-8)',
          }}>
            {questionnaireType === 'clinical' ? 'Clinical' : 'Non-Clinical'} Questionnaire
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            <div>Reference: <strong>{submission.submissionId}</strong></div>
            <div>Submitted: {formatDate(submission.submissionDate)}</div>
            <div>Submitted by: {submission.submittedBy}</div>
          </div>
        </div>

        {/* Approval Stamp & PDF Download */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', alignItems: 'flex-end' }}>
          <ApprovalStamp
            status={submission.status === 'approved' ? 'approved' : submission.status === 'rejected' ? 'rejected' : 'pending'}
            date={submission.approvalDate}
            approver={submission.approver}
            size="large"
          />
                  </div>
      </div>

      {/* Current Status Banner */}
      {submission.status && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-16)',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-base)',
          marginBottom: 'var(--space-24)',
          border: '1px solid var(--color-border)',
        }}>
          <div>
            <span style={{ fontWeight: '600', marginRight: '12px' }}>Current Status:</span>
            <StatusBadge status={submission.status} isAwaitingRequester={isAwaitingRequester} />
          </div>
          {submission.status === 'info_required' && !isAwaitingRequester && hasRequesterResponded && (
            <span style={{
              padding: '4px 12px',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: '500',
            }}>
              New response from requester - please review
            </span>
          )}
        </div>
      )}

      {/* Exchange Thread - Only show if there are actual back-and-forth exchanges (not just a direct approval/rejection) */}
      {exchanges.length > 0 && !(exchanges.length === 1 && exchanges[0].type === 'decision') && (
        <ExchangeThread exchanges={exchanges} onPreviewDocument={handlePreviewDocument} />
      )}

      {/* Rejection Reason Notice - Show when rejected directly without exchange thread */}
      {submission.status === 'rejected' && (exchanges.length === 0 || (exchanges.length === 1 && exchanges[0].type === 'decision')) && (
        <NoticeBox type="error" style={{ marginBottom: 'var(--space-24)' }}>
          <h4 style={{ margin: '0 0 var(--space-12) 0', color: '#991b1b' }}>Rejection Reason</h4>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {submission.pbpReview?.finalComments || submission.approvalComments || exchanges[0]?.message || 'No reason provided'}
          </p>
        </NoticeBox>
      )}

      {/* Legacy Status Notice - only show if no exchanges exist and not rejected (rejection has its own notice above) */}
      {submission.approvalComments && exchanges.length === 0 && submission.status !== 'rejected' && (
        <NoticeBox type={submission.status === 'approved' ? 'success' : submission.status === 'info_required' ? 'warning' : 'error'} style={{ marginBottom: 'var(--space-24)' }}>
          <strong>Reviewer Comments:</strong>
          <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>{submission.approvalComments}</p>
        </NoticeBox>
      )}

      {/* Approval Certificate Download - Only show if approved */}
      {submission.status === 'approved' && (
        <div style={{
          padding: 'var(--space-24)',
          backgroundColor: '#d1fae5',
          borderRadius: 'var(--radius-base)',
          border: '2px solid #22c55e',
          marginBottom: 'var(--space-24)',
        }}>
          <h3 style={{ margin: '0 0 var(--space-12) 0', color: '#065f46', fontSize: '1.1rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><CheckIcon size={18} color="#065f46" /> Approval Confirmed</span>
          </h3>
          <p style={{ margin: '0 0 var(--space-16) 0', color: '#047857' }}>
            Download the approval certificate for the requester:
          </p>
          <PDFDownloadLink
            document={
              <PBPApprovalPDF
                submission={submission}
                questionnaireType={questionnaireType}
                questionnaireData={submission.formData?.[`${questionnaireType}Questionnaire`] || questionnaireData}
                pbpReview={{
                  decision: submission.pbpReview?.decision || submission.status,
                  signature: submission.pbpReview?.signature || submission.approver,
                  date: submission.pbpReview?.date || submission.approvalDate,
                  comments: submission.pbpReview?.comments || submission.approvalComments,
                }}
              />
            }
            fileName={`PBP_Approval_${submission.submissionId}_${new Date().toISOString().split('T')[0]}.pdf`}
            style={{ textDecoration: 'none' }}
          >
            {({ loading }) => (
              <Button
                variant="primary"
                disabled={loading}
                style={{
                  backgroundColor: '#22c55e',
                  marginBottom: 'var(--space-8)',
                }}
              >
                {loading ? <><ClockIcon size={16} /> Generating...</> : <><DownloadIcon size={16} /> Download Approval Certificate</>}
              </Button>
            )}
          </PDFDownloadLink>
          <p style={{ margin: '0 0 var(--space-8) 0', fontSize: 'var(--font-size-sm)', color: '#047857', fontStyle: 'italic' }}>
            Send this to the requester to upload for "Engaged with Procurement" question
          </p>
          <div style={{
            padding: 'var(--space-12)',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid #3b82f6',
            fontSize: 'var(--font-size-sm)',
            color: '#1e40af',
          }}>
            <strong>Note:</strong> In production, this certificate will be automatically emailed to the requester ({submission.formData?.nhsEmail || 'requester email'}).
            For now, download manually and send via email.
          </div>
        </div>
      )}

      {/* Section 1: Requester Information */}
      <ReviewSection title="Section 1: Requester Information">
        <ReviewField
          label="Name"
          value={`${formData.firstName || ''} ${formData.lastName || ''}`.trim()}
        />
        <ReviewField label="Job Title" value={formData.jobTitle} />
        <ReviewField label="Department" value={formData.department} />
        <ReviewField label="NHS Email" value={formData.nhsEmail} raw />
        <ReviewField label="Phone Number" value={formData.phoneNumber} />
      </ReviewSection>

      {/* Section 2: Pre-Screening Summary */}
      <ReviewSection title="Section 2: Pre-Screening Summary">
        <ReviewField
          label="Q2.1 - Supplier Connection"
          value={formatYesNo(submission.section2Summary?.supplierConnection || formData.supplierConnection)}
        />
        {(submission.section2Summary?.supplierConnection === 'yes' || formData.supplierConnection === 'yes') && (
          <ReviewField
            label="Connection Details"
            value={submission.section2Summary?.connectionDetails || formData.connectionDetails}
            isLongText
          />
        )}
        <ReviewField
          label="Q2.2 - Letterhead with Bank Details"
          value={formatYesNo(submission.section2Summary?.letterheadAvailable || formData.letterheadAvailable)}
        />
        <ReviewField
          label="Q2.3 - Justification"
          value={submission.section2Summary?.justification || formData.justification}
          isLongText
        />
        <ReviewField
          label="Q2.4 - Usage Frequency"
          value={capitalizeWords(submission.section2Summary?.usageFrequency || formData.usageFrequency)}
        />
        <ReviewField
          label="Q2.5 - Sole Trader Status"
          value={formatYesNo(submission.section2Summary?.soleTraderStatus || formData.soleTraderStatus)}
        />
        <ReviewField
          label="Q2.6 - Service Category"
          value={capitalizeWords(submission.section2Summary?.serviceCategory || submission.questionnaireType)}
        />
        <ReviewField
          label="Q2.7 - Procurement Engaged"
          value={formatYesNo(submission.section2Summary?.procurementEngaged || formData.procurementEngaged)}
        />
      </ReviewSection>

      {/* Conflict of Interest Warning */}
      {(formData.supplierConnection === 'yes' || formData.section2?.supplierConnection === 'yes') && (
        <div style={{
          marginBottom: 'var(--space-24)',
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
            {formData.connectionDetails || formData.section2?.connectionDetails || 'No details provided'}
          </p>
        </div>
      )}

      {/* Questionnaire Responses */}
      <ReviewSection title={`${questionnaireType === 'clinical' ? 'Clinical' : 'Non-Clinical'} Questionnaire Responses`}>
        {/* Supplier Name - Prominent Display */}
        {questionnaireData?.supplierName && (
          <div style={{
            gridColumn: '1 / -1',
            padding: 'var(--space-16)',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-base)',
            border: '2px solid #3b82f6',
            marginBottom: 'var(--space-16)'
          }}>
            <label style={{
              fontWeight: 'var(--font-weight-semibold)',
              color: '#1e40af',
              fontSize: 'var(--font-size-sm)',
              display: 'block',
              marginBottom: 'var(--space-4)'
            }}>
              Supplier/Company Name
            </label>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 'var(--font-weight-bold)',
              color: '#1e3a8a'
            }}>
              {questionnaireData.supplierName}
            </span>
          </div>
        )}
        {questionnaireType === 'clinical' ? (
          <ClinicalQuestionnaireReview data={questionnaireData} />
        ) : (
          <NonClinicalQuestionnaireReview data={questionnaireData} />
        )}
      </ReviewSection>

      {/* All Uploads Section - Letterhead, Procurement Approval, and Questionnaire Uploads */}
      <ReviewSection title="Uploaded Documents">
        <div style={{ gridColumn: '1 / -1' }}>
          {/* Letterhead Document */}
          {allUploads.letterhead && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-12)',
              padding: 'var(--space-12)',
              backgroundColor: '#f0fdf4',
              borderRadius: 'var(--radius-base)',
              border: '1px solid #86efac',
              marginBottom: 'var(--space-8)',
            }}>
              <ClipboardIcon size={24} color="#005EB8" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: '#166534' }}>
                  Letterhead with Bank Details
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {allUploads.letterhead.name} • {Math.round((allUploads.letterhead.size || 0) / 1024)} KB
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreviewDocument(allUploads.letterhead)}
              >
                Preview
              </Button>
            </div>
          )}

          {/* Procurement Approval Document */}
          {allUploads.procurementApproval && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-12)',
              padding: 'var(--space-12)',
              backgroundColor: '#eff6ff',
              borderRadius: 'var(--radius-base)',
              border: '1px solid #93c5fd',
              marginBottom: 'var(--space-8)',
            }}>
              <CircleCheckIcon size={24} color="#22c55e" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: '#1e40af' }}>
                  Procurement Approval Document
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {allUploads.procurementApproval.name} • {Math.round((allUploads.procurementApproval.size || 0) / 1024)} KB
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreviewDocument(allUploads.procurementApproval)}
              >
                Preview
              </Button>
            </div>
          )}

          {/* Questionnaire Uploads */}
          {Object.entries(questionnaireUploads).map(([key, file]) => (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-12)',
              padding: 'var(--space-12)',
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-base)',
              border: '1px solid var(--color-border)',
              marginBottom: 'var(--space-8)',
            }}>
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
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {file.name} • {Math.round((file.size || 0) / 1024)} KB
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreviewDocument(file)}
              >
                Preview
              </Button>
            </div>
          ))}

          {/* Show message if no uploads at all */}
          {!allUploads.letterhead && !allUploads.procurementApproval && Object.keys(questionnaireUploads).length === 0 && (
            <p style={{ color: '#6b7280', fontStyle: 'italic', margin: 0 }}>
              No documents were uploaded with this submission.
            </p>
          )}
        </div>
      </ReviewSection>

      {/* Approval Actions - Show when pending OR when info_required and requester has responded */}
      {(submission.status === 'pending_review' || (submission.status === 'info_required' && hasRequesterResponded)) && (
        <div style={{
          marginTop: 'var(--space-32)',
          padding: 'var(--space-24)',
          backgroundColor: hasRequesterResponded ? '#dbeafe' : 'var(--color-surface)',
          borderRadius: 'var(--radius-base)',
          border: hasRequesterResponded ? '2px solid #3b82f6' : '2px solid var(--color-border)',
        }}>
          <h3 style={{ margin: '0 0 var(--space-16) 0', color: 'var(--nhs-blue)' }}>
            {hasRequesterResponded ? 'Review Requester Response' : 'Review Decision'}
          </h3>

          {hasRequesterResponded && (
            <NoticeBox type="info" style={{ marginBottom: 'var(--space-16)' }}>
              <strong>The requester has responded to your information request.</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Please review their response in the exchange thread above, then make a decision or request further information.
              </p>
            </NoticeBox>
          )}

          {!approvalAction ? (
            <div style={{ display: 'flex', gap: 'var(--space-12)', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                onClick={() => setApprovalAction('approve')}
                style={{ backgroundColor: 'var(--color-success)' }}
              >
                <CheckIcon size={16} /> Approve Questionnaire
              </Button>
              <Button
                variant="outline"
                onClick={() => setApprovalAction('info_required')}
                style={{ color: '#D4A617', borderColor: '#D4A617', backgroundColor: '#FFF9E6' }}
              >
                <WarningIcon size={16} /> Request More Information
              </Button>
              <Button
                variant="danger"
                onClick={() => setApprovalAction('reject')}
              >
                <XIcon size={16} /> Reject Questionnaire
              </Button>
            </div>
          ) : (
            <div>
              <NoticeBox type={approvalAction === 'approve' ? 'success' : approvalAction === 'info_required' ? 'warning' : 'error'}>
                <strong>
                  You are about to {approvalAction === 'approve' ? 'approve' : approvalAction === 'info_required' ? 'request more information for' : 'reject'} this questionnaire.
                </strong>
                <p>
                  {approvalAction === 'approve'
                    ? 'Please provide any approval comments or notes (optional).'
                    : approvalAction === 'info_required'
                    ? 'Please specify what additional information is required (required).'
                    : 'Please provide the reason for rejection (required).'}
                </p>
              </NoticeBox>

              <Textarea
                label={approvalAction === 'approve' ? 'Approval Comments (Optional)' : approvalAction === 'info_required' ? 'Information Required (Required)' : 'Rejection Reason (Required)'}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                placeholder={
                  approvalAction === 'approve'
                    ? 'Add any notes or conditions for this approval...'
                    : approvalAction === 'info_required'
                    ? 'Specify what additional information or documentation is needed...'
                    : 'Explain why this questionnaire is being rejected...'
                }
                required={approvalAction !== 'approve'}
                style={{ marginTop: 'var(--space-16)' }}
              />

              {/* File attachment for exchange */}
              {approvalAction === 'info_required' && (
                <div style={{ marginTop: 'var(--space-16)' }}>
                  <label style={{ display: 'block', marginBottom: 'var(--space-8)', fontWeight: 'var(--font-weight-medium)' }}>
                    Attach Documents (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => e.target.files?.[0] && handleExchangeFileUpload(e.target.files[0])}
                    style={{ marginBottom: 'var(--space-8)' }}
                  />
                  {Object.keys(exchangeAttachments).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {Object.entries(exchangeAttachments).map(([name, file]) => (
                        <span
                          key={name}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            backgroundColor: '#eff6ff',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                          }}
                        >
                          <PaperclipIcon size={12} color="#005EB8" /> {file.name}
                          <button
                            type="button"
                            onClick={() => removeExchangeAttachment(name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              padding: '0 4px',
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Signature Section */}
              <div style={{ marginTop: 'var(--space-24)', padding: 'var(--space-16)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-base)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: '0 0 var(--space-16) 0', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--nhs-blue)' }}>
                  Authorisation
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-16)' }}>
                  <div className="field">
                    <label style={{ display: 'block', marginBottom: 'var(--space-4)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
                      Your Full Name (as signature) *
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      style={{
                        width: '100%',
                        padding: 'var(--space-8)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-base)'
                      }}
                    />
                  </div>

                  <div className="field">
                    <label style={{ display: 'block', marginBottom: 'var(--space-4)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
                      Date *
                    </label>
                    <input
                      type="date"
                      value={signatureDate}
                      onChange={(e) => setSignatureDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: 'var(--space-8)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-base)'
                      }}
                    />
                  </div>
                </div>

                <p style={{ marginTop: 'var(--space-12)', marginBottom: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  By typing your name, you confirm this is your electronic signature and you authorise this decision.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-16)', flexWrap: 'wrap' }}>
                <Button
                  variant={approvalAction === 'approve' ? 'primary' : approvalAction === 'info_required' ? 'outline' : 'danger'}
                  onClick={() => handleApproval(approvalAction)}
                  disabled={isSubmitting || !reviewerName.trim() || ((approvalAction === 'reject' || approvalAction === 'info_required') && !comments.trim())}
                  style={approvalAction === 'info_required' ? { color: '#D4A617', borderColor: '#D4A617', backgroundColor: '#FFF9E6' } : {}}
                >
                  {isSubmitting ? 'Processing...' : `Confirm ${approvalAction === 'approve' ? 'Approval' : approvalAction === 'info_required' ? 'Info Request' : 'Rejection'}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setApprovalAction(null);
                    setComments('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back Button */}
      <div style={{ marginTop: 'var(--space-32)', textAlign: 'center' }}>
        <Button variant="outline" onClick={() => window.close()}>
          Close Preview
        </Button>
      </div>
    </div>
  );
};

export default PBPReviewPage;
