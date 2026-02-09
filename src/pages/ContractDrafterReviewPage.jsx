/**
 * Contract Drafter Review Page
 * Manages contract negotiation workflow with multi-round exchange
 * Sends agreement templates (Outside IR35 or Inside IR35) and tracks signatures
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  NoticeBox,
  Textarea,
  FileUpload,
  Input,
  CheckIcon,
  XIcon,
  WarningIcon,
  ClockIcon,
  DocumentIcon,
  DownloadIcon,
  PaperclipIcon,
} from '../components/common';
import { formatDate } from '../utils/helpers';
import { contractNegotiationService } from '../services/contractNegotiationService';
import {
  sendContractRequestEmail,
  notifyContractDrafterOfResponse,
  notifyContractApproved,
} from '../services/notificationService';

// ===== Exchange Thread Component =====
// Displays conversation history between Contract Drafter, Supplier, and Requester
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
        backgroundColor: '#059669',
        color: 'white',
      }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          <DocumentIcon size={18} color="white" /> Contract Negotiation History ({exchanges.length} {exchanges.length === 1 ? 'message' : 'messages'})
        </h3>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {exchanges.map((exchange, index) => {
          const formatted = contractNegotiationService.formatExchangeForDisplay(exchange);
          const isDecision = exchange.type === 'contract_approved' || exchange.type === 'contract_rejected';

          return (
            <div
              key={exchange.id || index}
              style={{
                padding: 'var(--space-16)',
                borderBottom: index < exchanges.length - 1 ? '1px solid var(--color-border)' : 'none',
                backgroundColor: isDecision
                  ? (exchange.decision === 'approved' ? '#f0fdf4' : '#fef2f2')
                  : (formatted.badge.bg === '#059669' ? '#f0fdf4' :
                     formatted.badge.bg === '#3b82f6' ? '#f0f7ff' : '#fefce8'),
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
                    backgroundColor: formatted.badge.bg,
                    color: formatted.badge.text,
                  }}>
                    {formatted.badge.label}
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
                  {formatted.formattedDate}
                </span>
              </div>

              {/* Message */}
              {exchange.message && exchange.message.trim() && (
                <div style={{
                  padding: 'var(--space-12)',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  marginBottom: exchange.attachments?.length ? 'var(--space-12)' : 0,
                }}>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {exchange.message}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {exchange.attachments && exchange.attachments.length > 0 && (
                <div style={{ marginTop: 'var(--space-12)' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '6px' }}>
                    <PaperclipIcon size={14} /> Attachments:
                  </div>
                  {exchange.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <DocumentIcon size={16} />
                      <span style={{ flex: 1, fontSize: '0.875rem' }}>{att.name}</span>
                      {att.url && (
                        <a
                          href={att.url}
                          download={att.name}
                          style={{
                            color: 'var(--nhs-blue)',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                          }}
                        >
                          <DownloadIcon size={16} /> Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== Main Contract Drafter Review Page =====
const ContractDrafterReviewPage = ({ user, readOnly = false }) => {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customFile, setCustomFile] = useState(null);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [decision, setDecision] = useState(null);
  const [decisionComments, setDecisionComments] = useState('');
  const [finalizedAgreement, setFinalizedAgreement] = useState(null);
  const [digitalSignature, setDigitalSignature] = useState('');

  // Load submission data
  useEffect(() => {
    const loadSubmission = async () => {
      try {
        // In production, fetch from API
        // Load individual submission from localStorage (standard pattern)
        const submissionData = localStorage.getItem(`submission_${submissionId}`);

        if (!submissionData) {
          alert('Submission not found');
          navigate('/submissions');
          return;
        }

        const found = JSON.parse(submissionData);
        setSubmission(found);

        // Template selection now done via card UI - no auto-selection

        setLoading(false);
      } catch (error) {
        console.error('Failed to load submission:', error);
        setLoading(false);
      }
    };

    loadSubmission();
  }, [submissionId, navigate]);

  // Handle sending agreement to supplier
  const handleSendAgreement = async () => {
    if (!selectedTemplate) {
      alert('Please select an agreement template');
      return;
    }

    if (!message.trim()) {
      alert('Please provide instructions for the supplier');
      return;
    }

    setActionInProgress(true);

    try {
      const newExchange = contractNegotiationService.createContractExchange({
        type: 'contract_request',
        from: 'contract_drafter',
        fromName: user.displayName || user.email,
        message: message.trim(),
        attachments: [
          {
            name: selectedTemplate.filename,
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            url: selectedTemplate.path,
            isTemplate: true,
          },
          ...attachments,
        ],
      });

      const updatedSubmission = {
        ...submission,
        currentStage: 'contract', // Ensure current stage is set to contract
        contractDrafter: {
          ...submission.contractDrafter,
          status: 'sent',
          templateUsed: selectedTemplate.filename,
          exchanges: [...(submission.contractDrafter?.exchanges || []), newExchange],
          lastUpdated: new Date().toISOString(),
        },
      };

      // Update localStorage (standard pattern)
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const stored = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = stored.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        stored[index] = {
          ...stored[index],
          contractDrafter: updatedSubmission.contractDrafter,
          currentStage: updatedSubmission.currentStage
        };
        localStorage.setItem('all_submissions', JSON.stringify(stored));
      }

      // Send notification
      sendContractRequestEmail(updatedSubmission, selectedTemplate, message);

      setSubmission(updatedSubmission);
      setMessage('');
      setAttachments([]);
      alert('Agreement sent successfully to supplier and requester');
    } catch (error) {
      console.error('Failed to send agreement:', error);
      alert('Failed to send agreement. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle finalized agreement upload
  const handleFinalizedAgreementUpload = (fileData) => {
    if (!fileData) return;

    // FileUpload component already provides: {name, size, type, file, base64}
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(fileData.type)) {
      alert('Only PDF or DOCX files are allowed');
      return;
    }

    // Validate file size (3MB max)
    const maxSize = 3 * 1024 * 1024;
    if (fileData.size > maxSize) {
      alert('File size must be under 3MB');
      return;
    }

    // FileUpload component already converted to base64, just use it
    setFinalizedAgreement({
      name: fileData.name,
      type: fileData.type,
      size: fileData.size,
      base64: fileData.base64,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.displayName || user.email,
    });
  };

  // Handle approving contract
  const handleApproveContract = async () => {
    if (!finalizedAgreement) {
      alert('Please upload the finalized agreement before approving');
      return;
    }

    if (!digitalSignature.trim()) {
      alert('Please provide your digital signature');
      return;
    }

    if (!decisionComments.trim()) {
      alert('Please provide approval comments');
      return;
    }

    setActionInProgress(true);

    try {
      const finalExchange = contractNegotiationService.createContractExchange({
        type: 'contract_approved',
        from: 'contract_drafter',
        fromName: user.displayName || user.email,
        message: decisionComments.trim(),
        decision: 'approved',
      });

      const updatedSubmission = {
        ...submission,
        currentStage: 'ap',
        contractDrafter: {
          ...submission.contractDrafter,
          decision: 'approved',
          decidedBy: user.displayName || user.email,
          decidedAt: new Date().toISOString(),
          digitalSignature: digitalSignature.trim(),
          signedAt: new Date().toISOString(),
          finalizedAgreement: finalizedAgreement,
          exchanges: [...(submission.contractDrafter?.exchanges || []), finalExchange],
        },
      };

      // Update localStorage (standard pattern)
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const stored = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = stored.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        stored[index] = {
          ...stored[index],
          contractDrafter: updatedSubmission.contractDrafter,
          currentStage: updatedSubmission.currentStage
        };
        localStorage.setItem('all_submissions', JSON.stringify(stored));
      }

      // Send notifications
      notifyContractApproved(updatedSubmission, user.displayName || user.email);

      alert('Contract approved successfully. Submission forwarded to AP Control.');
      navigate('/submissions');
    } catch (error) {
      console.error('Failed to approve contract:', error);
      alert('Failed to approve contract. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle requesting changes
  const handleRequestChanges = async () => {
    if (!decisionComments.trim()) {
      alert('Please specify what changes are needed');
      return;
    }

    setActionInProgress(true);

    try {
      const changeExchange = contractNegotiationService.createContractExchange({
        type: 'changes_requested',
        from: 'contract_drafter',
        fromName: user.displayName || user.email,
        message: decisionComments.trim(),
      });

      const updatedSubmission = {
        ...submission,
        currentStage: 'contract', // Ensure current stage is set to contract
        contractDrafter: {
          ...submission.contractDrafter,
          status: 'negotiating',
          exchanges: [...(submission.contractDrafter?.exchanges || []), changeExchange],
          lastUpdated: new Date().toISOString(),
        },
      };

      // Update localStorage (standard pattern)
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const stored = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = stored.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        stored[index] = {
          ...stored[index],
          contractDrafter: updatedSubmission.contractDrafter,
          currentStage: updatedSubmission.currentStage
        };
        localStorage.setItem('all_submissions', JSON.stringify(stored));
      }

      // Send notification
      notifyContractDrafterOfResponse(updatedSubmission, changeExchange);

      setSubmission(updatedSubmission);
      setDecisionComments('');
      setDecision(null);
      alert('Change request sent to supplier');
    } catch (error) {
      console.error('Failed to request changes:', error);
      alert('Failed to request changes. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-24)', textAlign: 'center' }}>
        <ClockIcon size={48} />
        <p>Loading submission...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div style={{ padding: 'var(--space-24)' }}>
        <NoticeBox type="warning">Submission not found</NoticeBox>
      </div>
    );
  }

  const supplierName = submission.formData?.companyName || submission.formData?.section4?.companyName || 'Supplier';
  const ir35Status = submission.opwReview?.ir35Status;
  const contractStatus = submission.contractDrafter?.decision;
  const exchanges = submission.contractDrafter?.exchanges || [];
  const hasExchanges = exchanges.length > 0;

  return (
    <div style={{
      padding: 'var(--space-24)',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-24)' }}>
        <h1 style={{ margin: '0 0 var(--space-8) 0', color: 'var(--nhs-blue)' }}>
          <DocumentIcon size={28} /> Contract Review
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Submission ID: <strong>{submissionId}</strong> | Supplier: <strong>{supplierName}</strong>
        </p>
      </div>

      {/* Status Notice */}
      {contractStatus === 'approved' && (
        <NoticeBox type="success" style={{ marginBottom: 'var(--space-24)' }}>
          <CheckIcon size={20} /> Contract approved and forwarded to AP Control
        </NoticeBox>
      )}

      {/* IR35 Status */}
      {ir35Status && (
        <div style={{
          padding: 'var(--space-16)',
          backgroundColor: '#f0f7ff',
          border: '1px solid #dbeafe',
          borderRadius: 'var(--radius-base)',
          marginBottom: 'var(--space-24)',
        }}>
          <strong>IR35 Status:</strong> {ir35Status === 'outside_ir35' ? 'Outside IR35 (Consultancy Agreement)' : 'Inside IR35 (Sole Trader Agreement)'}
        </div>
      )}

      {/* Exchange Thread */}
      {hasExchanges && <ExchangeThread exchanges={exchanges} />}

      {/* Send Agreement Section */}
      {!contractStatus && (
        <div style={{
          padding: 'var(--space-20)',
          backgroundColor: 'white',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-base)',
          marginBottom: 'var(--space-24)',
        }}>
          <h3 style={{ margin: '0 0 var(--space-16) 0' }}>
            {hasExchanges ? 'Send Follow-up Message' : 'Send Agreement to Supplier'}
          </h3>

          {/* Template Selection - Card Based UI */}
          {!hasExchanges && (
            <div style={{ marginBottom: 'var(--space-16)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-8)',
                fontWeight: '600',
                color: 'var(--color-text)',
              }}>
                Step 3: Select Agreement Template
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--space-12)',
                marginBottom: 'var(--space-16)',
              }}>
                {/* Card 1: Outside IR35 Agreement */}
                <div
                  onClick={() => {
                    const template = contractNegotiationService.getAgreementTemplate('outside_ir35');
                    setSelectedTemplate(template);
                    setCustomFile(null);
                  }}
                  style={{
                    padding: 'var(--space-16)',
                    border: selectedTemplate?.filename === 'BartsConsultancyAgreement.1.2.docx'
                      ? '3px solid var(--nhs-blue)'
                      : '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-base)',
                    backgroundColor: selectedTemplate?.filename === 'BartsConsultancyAgreement.1.2.docx'
                      ? '#f0f7ff'
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTemplate?.filename !== 'BartsConsultancyAgreement.1.2.docx') {
                      e.currentTarget.style.borderColor = 'var(--nhs-blue)';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTemplate?.filename !== 'BartsConsultancyAgreement.1.2.docx') {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-12)' }}>
                    <div style={{
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: selectedTemplate?.filename === 'BartsConsultancyAgreement.1.2.docx'
                        ? 'var(--nhs-blue)'
                        : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {selectedTemplate?.filename === 'BartsConsultancyAgreement.1.2.docx' ? (
                        <CheckIcon size={20} color="white" />
                      ) : (
                        <DocumentIcon size={20} color="#6b7280" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: 'var(--space-4)' }}>
                        Outside IR35 Agreement
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                        Barts Consultancy Agreement v1.2
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        For suppliers determined to be outside IR35
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Inside IR35 Agreement */}
                <div
                  onClick={() => {
                    const template = contractNegotiationService.getAgreementTemplate('inside_ir35');
                    setSelectedTemplate(template);
                    setCustomFile(null);
                  }}
                  style={{
                    padding: 'var(--space-16)',
                    border: selectedTemplate?.filename === 'Sole Trader Agreement latest version 22.docx'
                      ? '3px solid var(--nhs-blue)'
                      : '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-base)',
                    backgroundColor: selectedTemplate?.filename === 'Sole Trader Agreement latest version 22.docx'
                      ? '#f0f7ff'
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTemplate?.filename !== 'Sole Trader Agreement latest version 22.docx') {
                      e.currentTarget.style.borderColor = 'var(--nhs-blue)';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTemplate?.filename !== 'Sole Trader Agreement latest version 22.docx') {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-12)' }}>
                    <div style={{
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: selectedTemplate?.filename === 'Sole Trader Agreement latest version 22.docx'
                        ? 'var(--nhs-blue)'
                        : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {selectedTemplate?.filename === 'Sole Trader Agreement latest version 22.docx' ? (
                        <CheckIcon size={20} color="white" />
                      ) : (
                        <DocumentIcon size={20} color="#6b7280" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: 'var(--space-4)' }}>
                        Inside IR35 Agreement
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                        Sole Trader Agreement v22
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        For suppliers determined to be inside IR35
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Upload Custom Agreement */}
                <div
                  style={{
                    padding: 'var(--space-16)',
                    border: customFile
                      ? '3px solid var(--nhs-blue)'
                      : '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-base)',
                    backgroundColor: customFile ? '#f0f7ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-12)' }}>
                    <div style={{
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: customFile ? 'var(--nhs-blue)' : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {customFile ? (
                        <CheckIcon size={20} color="white" />
                      ) : (
                        <PaperclipIcon size={20} color="#6b7280" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: 'var(--space-4)' }}>
                        Upload Custom Agreement
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>
                        Use a different agreement template
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setCustomFile(file);
                            setSelectedTemplate({
                              name: 'Custom Agreement',
                              filename: file.name,
                              version: 'Custom',
                              description: 'Custom uploaded agreement',
                              path: URL.createObjectURL(file),
                              isCustom: true,
                            });
                          }
                        }}
                        style={{
                          fontSize: '0.75rem',
                          width: '100%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Show selected template info */}
              {selectedTemplate && (
                <div style={{
                  padding: 'var(--space-12)',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <CheckIcon size={16} color="#059669" /> <strong>Selected:</strong> {selectedTemplate.name} (v{selectedTemplate.version})
                  <br />
                  <small style={{ color: 'var(--color-text-secondary)' }}>{selectedTemplate.description}</small>
                </div>
              )}
            </div>
          )}

          <Textarea
            label="Instructions for Supplier"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter instructions for reviewing and signing the agreement..."
            rows={5}
            required
          />

          <Button
            onClick={handleSendAgreement}
            disabled={actionInProgress || !selectedTemplate || !message.trim()}
            style={{ marginTop: 'var(--space-16)' }}
          >
            {hasExchanges ? 'Send Follow-up' : 'Send Agreement'}
          </Button>
        </div>
      )}

      {/* Decision Section */}
      {hasExchanges && !contractStatus && (
        <div style={{
          padding: 'var(--space-20)',
          backgroundColor: 'white',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-base)',
        }}>
          <h3 style={{ margin: '0 0 var(--space-16) 0' }}>Make Decision</h3>

          {!decision && (
            <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
              <Button onClick={() => setDecision('approve')} variant="primary">
                <CheckIcon size={18} /> Approve Contract
              </Button>
              <Button onClick={() => setDecision('changes')} variant="outline">
                <WarningIcon size={18} /> Request Changes
              </Button>
            </div>
          )}

          {decision === 'approve' && (
            <div>
              {/* Upload Finalized Agreement */}
              <div style={{ marginBottom: 'var(--space-16)' }}>
                <NoticeBox type="info" style={{ marginBottom: 'var(--space-12)', fontSize: '0.875rem' }}>
                  <strong>Step 1: Upload Finalized Agreement</strong>
                  <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                    Upload the final signed agreement that has been reviewed and approved by all parties. This will be forwarded to AP Control for final processing.
                  </p>
                </NoticeBox>

                <FileUpload
                  label="Finalized Signed Agreement"
                  name="finalizedAgreement"
                  acceptedTypes={['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                  onUpload={handleFinalizedAgreementUpload}
                  required
                  helperText="Accepted formats: PDF, DOCX (Max 3MB)"
                />

                {finalizedAgreement && (
                  <div style={{
                    marginTop: 'var(--space-12)',
                    padding: 'var(--space-12)',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-8)',
                  }}>
                    <CheckIcon size={16} color="#059669" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                        {finalizedAgreement.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                        Uploaded by {finalizedAgreement.uploadedBy} • {new Date(finalizedAgreement.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Digital Signature - Only show if agreement uploaded */}
              {finalizedAgreement && (
                <div style={{ marginBottom: 'var(--space-16)' }}>
                  <NoticeBox type="warning" style={{ marginBottom: 'var(--space-12)', fontSize: '0.875rem' }}>
                    <strong>Step 2: Digital Signature</strong>
                    <p style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
                      By typing your full name below, you are digitally signing this contract approval and confirming that:
                    </p>
                    <ul style={{ marginTop: 0, marginBottom: 0, paddingLeft: 'var(--space-20)' }}>
                      <li>All contract terms have been reviewed and agreed upon</li>
                      <li>The uploaded document is the final version</li>
                      <li>You have authority to approve this contract</li>
                    </ul>
                  </NoticeBox>

                  <div style={{ position: 'relative' }}>
                    <Input
                      label="Your Full Name (Digital Signature)"
                      type="text"
                      value={digitalSignature}
                      onChange={(e) => setDigitalSignature(e.target.value)}
                      placeholder="Type your full name"
                      required
                      style={{
                        fontFamily: 'cursive',
                        fontSize: '1.125rem',
                        letterSpacing: '0.5px',
                      }}
                    />
                    {digitalSignature && (
                      <div style={{
                        marginTop: 'var(--space-8)',
                        padding: 'var(--space-12)',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        color: '#0369a1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-8)',
                      }}>
                        <CheckIcon size={16} color="#0369a1" />
                        <div>
                          <strong>Signature Preview:</strong>
                          <div style={{ fontFamily: 'cursive', fontSize: '1.25rem', marginTop: '4px', color: '#0c4a6e' }}>
                            {digitalSignature}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Comments */}
              <Textarea
                label="Step 3: Approval Comments"
                value={decisionComments}
                onChange={(e) => setDecisionComments(e.target.value)}
                placeholder="Enter any final comments or notes about the contract approval..."
                rows={4}
                required
              />

              <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-16)' }}>
                <Button
                  onClick={handleApproveContract}
                  disabled={actionInProgress || !decisionComments.trim() || !finalizedAgreement || !digitalSignature.trim()}
                  style={{ backgroundColor: '#059669' }}
                >
                  <CheckIcon size={18} /> Submit to AP Control
                </Button>
                <Button onClick={() => {
                  setDecision(null);
                  setFinalizedAgreement(null);
                  setDigitalSignature('');
                  setDecisionComments('');
                }} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {decision === 'changes' && (
            <div>
              <Textarea
                label="Changes Requested"
                value={decisionComments}
                onChange={(e) => setDecisionComments(e.target.value)}
                placeholder="Specify what changes are needed..."
                rows={4}
                required
              />
              <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-16)' }}>
                <Button onClick={handleRequestChanges} disabled={actionInProgress || !decisionComments.trim()}>
                  <WarningIcon size={18} /> Send Change Request
                </Button>
                <Button onClick={() => setDecision(null)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractDrafterReviewPage;
