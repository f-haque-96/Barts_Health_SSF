/**
 * Requester Response Page
 * Allows requesters to respond to PBP information requests
 * Supports multiple rounds of back-and-forth communication
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button, NoticeBox, Textarea, PaperclipIcon } from '../components/common';
import { formatDate } from '../utils/helpers';
import PBPApprovalPDF from '../components/pdf/PBPApprovalPDF';

// ===== Exchange Thread Component =====
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
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', color: 'white' }}>
          Conversation History ({exchanges.length} {exchanges.length === 1 ? 'message' : 'messages'})
        </h3>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
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
                    {isPBP ? 'PBP REVIEWER' : 'YOU'}
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
                      {exchange.decision === 'approved' ? 'APPROVED' : 'REJECTED'}
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
                        {file.name || key}
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

// ===== Status Badge =====
const StatusBadge = ({ status, isAwaitingYou }) => {
  const getConfig = () => {
    if (status === 'approved') {
      return { bg: '#22c55e', text: 'Approved', color: 'white' };
    }
    if (status === 'rejected') {
      return { bg: '#ef4444', text: 'Rejected', color: 'white' };
    }
    if (isAwaitingYou) {
      return { bg: '#f59e0b', text: 'Action Required - Please Respond', color: 'white' };
    }
    return { bg: '#3b82f6', text: 'Awaiting PBP Review', color: 'white' };
  };

  const config = getConfig();

  return (
    <span style={{
      display: 'inline-block',
      padding: '8px 16px',
      backgroundColor: config.bg,
      color: config.color,
      borderRadius: '6px',
      fontWeight: '600',
      fontSize: '0.9rem',
    }}>
      {config.text}
    </span>
  );
};

const RequesterResponsePage = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseAttachments, setResponseAttachments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load submission
  useEffect(() => {
    const submissionData = localStorage.getItem(`submission_${submissionId}`);

    if (submissionData) {
      try {
        const parsed = JSON.parse(submissionData);
        setSubmission(parsed);
      } catch (error) {
        console.error('Error parsing submission:', error);
      }
    }

    setLoading(false);
  }, [submissionId]);

  // Check status
  const exchanges = submission?.pbpReview?.exchanges || [];
  const lastExchange = exchanges.length > 0 ? exchanges[exchanges.length - 1] : null;
  const isAwaitingResponse = lastExchange?.from === 'pbp' && lastExchange?.type !== 'decision';
  const isFinalDecision = submission?.status === 'approved' || submission?.status === 'rejected';

  // Handle document preview
  const handlePreviewDocument = (file) => {
    if (!file) {
      alert('No document available to preview');
      return;
    }

    const base64Data = file.base64 || file.data || file.content;
    if (!base64Data) {
      alert('Document data not available for preview.');
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
        <head><title>${file.name || 'Document'}</title></head>
        <body style="margin:0;padding:0;height:100vh;">
          <iframe src="${base64Data}" style="width:100%;height:100%;border:none;"></iframe>
        </body>
        </html>
      `);
    } else {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>${file.name || 'Image'}</title></head>
        <body style="margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f3f4f6;">
          <img src="${base64Data}" style="max-width:95%;max-height:95vh;box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
        </body>
        </html>
      `);
    }
    newWindow.document.close();
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

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

      setResponseAttachments(prev => ({
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

  // Remove attachment
  const removeAttachment = (fileName) => {
    const { [fileName]: removed, ...rest } = responseAttachments;
    setResponseAttachments(rest);
  };

  // Submit response
  const handleSubmitResponse = async () => {
    if (!responseMessage.trim()) {
      alert('Please enter a response message');
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = new Date().toISOString();
      const requesterName = `${submission?.formData?.section1?.firstName || submission?.formData?.firstName || ''} ${submission?.formData?.section1?.lastName || submission?.formData?.lastName || ''}`.trim() || 'Requester';
      const requesterEmail = submission?.formData?.section1?.nhsEmail || submission?.formData?.nhsEmail || submission?.submittedBy || 'Unknown';

      // Create new exchange entry
      const newExchange = {
        id: `EXC-${Date.now()}`,
        type: 'requester_response',
        from: 'requester',
        fromName: requesterName,
        fromEmail: requesterEmail,
        message: responseMessage,
        attachments: Object.keys(responseAttachments).length > 0 ? responseAttachments : null,
        timestamp: timestamp,
      };

      // Update exchanges
      const updatedExchanges = [...exchanges, newExchange];

      // Update submission
      const updatedSubmission = {
        ...submission,
        pbpReview: {
          ...submission.pbpReview,
          exchanges: updatedExchanges,
          currentStatus: 'awaiting_pbp',
          lastResponseAt: timestamp,
        },
      };

      // Save to localStorage
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = submissions.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        submissions[index].currentStatus = 'awaiting_pbp';
        submissions[index].lastResponseAt = timestamp;
        localStorage.setItem('all_submissions', JSON.stringify(submissions));
      }

      setSubmission(updatedSubmission);
      setResponseMessage('');
      setResponseAttachments({});

      alert('Your response has been submitted successfully!\n\nThe PBP reviewer will be notified and will review your response.\n\n(In production, an email notification would be sent)');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-32)', textAlign: 'center' }}>
        <div className="loading" style={{ width: '48px', height: '48px', margin: '0 auto' }} />
        <p style={{ marginTop: 'var(--space-16)', color: 'var(--color-text-secondary)' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div style={{ padding: 'var(--space-32)', maxWidth: '800px', margin: '0 auto' }}>
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

  const questionnaireType = submission.questionnaireType || submission.section2Summary?.serviceCategory || 'clinical';

  return (
    <div style={{ padding: 'var(--space-32)', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        marginBottom: 'var(--space-24)',
        paddingBottom: 'var(--space-24)',
        borderBottom: '2px solid var(--color-border)',
      }}>
        <h1 style={{ margin: '0 0 var(--space-8) 0', color: 'var(--nhs-blue)' }}>
          Respond to Information Request
        </h1>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          <div>Reference: <strong>{submission.submissionId}</strong></div>
          <div>Questionnaire Type: <strong style={{ textTransform: 'capitalize' }}>{questionnaireType}</strong></div>
          <div>Originally Submitted: {formatDate(submission.submissionDate)}</div>
        </div>
      </div>

      {/* Status Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-16)',
        backgroundColor: isAwaitingResponse ? '#fef3c7' : '#f0f9ff',
        borderRadius: 'var(--radius-base)',
        marginBottom: 'var(--space-24)',
        border: isAwaitingResponse ? '2px solid #f59e0b' : '1px solid #bae6fd',
      }}>
        <div>
          <span style={{ fontWeight: '600', marginRight: '12px' }}>Status:</span>
          <StatusBadge status={submission.status} isAwaitingYou={isAwaitingResponse} />
        </div>
      </div>

      {/* Final Decision Notice */}
      {isFinalDecision && (
        <NoticeBox
          type={submission.status === 'approved' ? 'success' : 'error'}
          style={{ marginBottom: 'var(--space-24)' }}
        >
          <h3 style={{ marginTop: 0 }}>
            {submission.status === 'approved' ? 'Questionnaire Approved' : 'Questionnaire Rejected'}
          </h3>
          <p>
            {submission.status === 'approved'
              ? 'Your questionnaire has been approved by the PBP. You can download your approval certificate below.'
              : 'Unfortunately, your questionnaire has been rejected. Please review the comments below for more information.'}
          </p>
          {(submission.pbpReview?.finalComments || submission.approvalComments || (exchanges.length > 0 && exchanges[exchanges.length - 1]?.message)) && (
            <div style={{
              marginTop: 'var(--space-12)',
              padding: 'var(--space-12)',
              backgroundColor: submission.status === 'approved' ? '#dcfce7' : '#fee2e2',
              borderRadius: 'var(--radius-sm)',
            }}>
              <strong>PBP Comments:</strong>
              <p style={{ margin: 'var(--space-8) 0 0 0', whiteSpace: 'pre-wrap' }}>
                {submission.pbpReview?.finalComments || submission.approvalComments || exchanges[exchanges.length - 1]?.message}
              </p>
            </div>
          )}
          {submission.status === 'approved' && (
            <PDFDownloadLink
              document={
                <PBPApprovalPDF
                  submission={submission}
                  questionnaireType={questionnaireType}
                  questionnaireData={submission.formData?.[`${questionnaireType}Questionnaire`] || submission.questionnaireData}
                  pbpReview={{
                    decision: submission.pbpReview?.decision || submission.status,
                    signature: submission.pbpReview?.signature || submission.approver,
                    date: submission.pbpReview?.date || submission.approvalDate,
                    approvalDate: submission.pbpReview?.completedAt || submission.approvalDate,
                    comments: submission.pbpReview?.finalComments || submission.approvalComments,
                  }}
                />
              }
              fileName={`PBP_Approval_Certificate_${submission.submissionId}.pdf`}
              style={{ textDecoration: 'none' }}
            >
              {({ loading: pdfLoading }) => (
                <Button
                  variant="primary"
                  disabled={pdfLoading}
                  style={{
                    marginTop: 'var(--space-12)',
                    backgroundColor: '#22c55e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {pdfLoading ? 'Generating...' : 'Download Approval Certificate'}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </NoticeBox>
      )}

      {/* Exchange Thread - Only show if there was actual back-and-forth communication */}
      {exchanges.length > 0 && !(exchanges.length === 1 && exchanges[0].type === 'decision') && (
        <ExchangeThread exchanges={exchanges} onPreviewDocument={handlePreviewDocument} />
      )}

      {/* Response Form - Only show if awaiting response and not final decision */}
      {isAwaitingResponse && !isFinalDecision && (
        <div style={{
          padding: 'var(--space-24)',
          backgroundColor: '#fefce8',
          borderRadius: 'var(--radius-base)',
          border: '2px solid #facc15',
        }}>
          <h3 style={{ margin: '0 0 var(--space-16) 0', color: '#854d0e' }}>
            Your Response
          </h3>

          <NoticeBox type="warning" style={{ marginBottom: 'var(--space-16)' }}>
            <strong>The PBP has requested additional information.</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              Please review their message above and provide the requested information below.
            </p>
          </NoticeBox>

          <Textarea
            label="Your Response"
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            rows={5}
            placeholder="Enter your response here. Include any clarifications or explanations requested..."
            required
            style={{ marginBottom: 'var(--space-16)' }}
          />

          {/* File Upload */}
          <div style={{ marginBottom: 'var(--space-16)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--space-8)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              Attach Documents (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              style={{ marginBottom: 'var(--space-8)' }}
            />
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0 0' }}>
              PDF, PNG, JPG, DOC/DOCX (Max 5MB each)
            </p>

            {/* Show attached files */}
            {Object.keys(responseAttachments).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {Object.entries(responseAttachments).map(([name, file]) => (
                  <span
                    key={name}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                    }}
                  >
                    {file.name}
                    <button
                      type="button"
                      onClick={() => removeAttachment(name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '1.2rem',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            onClick={handleSubmitResponse}
            disabled={isSubmitting || !responseMessage.trim()}
            style={{
              backgroundColor: '#005EB8',
              padding: '12px 24px',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Response'}
          </Button>
        </div>
      )}

      {/* Waiting for PBP Notice */}
      {!isAwaitingResponse && !isFinalDecision && exchanges.length > 0 && (
        <NoticeBox type="info">
          <h3 style={{ marginTop: 0 }}>Awaiting PBP Review</h3>
          <p style={{ marginBottom: 0 }}>
            Your response has been submitted. The PBP reviewer will assess your response and either
            approve your questionnaire, request further information, or make a final decision.
            You will be notified when they respond.
          </p>
        </NoticeBox>
      )}

      {/* Back Button */}
      <div style={{ marginTop: 'var(--space-32)', textAlign: 'center' }}>
        <Button variant="outline" onClick={() => window.close()}>
          Close Window
        </Button>
      </div>
    </div>
  );
};

export default RequesterResponsePage;
