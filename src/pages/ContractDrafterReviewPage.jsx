/**
 * Contract Drafter Review Page
 * Manages contract workflow with offline email-based negotiation
 * Simplified to 3-state flow: Not Sent -> Sent (Awaiting Upload) -> Approved
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
  ClockIcon,
  DocumentIcon,
} from '../components/common';
import { formatDate } from '../utils/helpers';
import { contractNegotiationService } from '../services/contractNegotiationService';
import {
  sendContractRequestEmail,
  notifyContractApproved,
} from '../services/notificationService';
import useDocumentTitle from '../hooks/useDocumentTitle';

// ===== Main Contract Drafter Review Page =====
const ContractDrafterReviewPage = ({ user, readOnly = false }) => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Contract Review');

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customFile, setCustomFile] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [finalizedAgreement, setFinalisedAgreement] = useState(null);
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

        setLoading(false);
      } catch (error) {
        console.error('Failed to load submission:', error);
        setLoading(false);
      }
    };

    loadSubmission();
  }, [submissionId, navigate]);

  // Handle sending agreement to supplier (State A -> State B)
  const handleSendAgreement = async () => {
    if (!selectedTemplate) {
      alert('Please select an agreement template');
      return;
    }

    if (!instructions.trim()) {
      alert('Please provide instructions for the supplier');
      return;
    }

    setActionInProgress(true);

    try {
      // In production, call POST /api/contracts/${submissionId}/send-to-supplier
      // with {templateName, instructions}

      const updatedSubmission = {
        ...submission,
        currentStage: 'contract',
        contractDrafter: {
          ...submission.contractDrafter,
          sentAt: new Date().toISOString(),
          templateUsed: selectedTemplate.filename,
          instructions: instructions.trim(),
          sentBy: user.displayName || user.email,
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
      sendContractRequestEmail(updatedSubmission, selectedTemplate, instructions);

      setSubmission(updatedSubmission);
      setInstructions('');
      alert('Agreement sent successfully to supplier and requester');
    } catch (error) {
      console.error('Failed to send agreement:', error);
      alert('Failed to send agreement. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle finalized agreement upload
  const handleFinalisedAgreementUpload = (fileData) => {
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
    setFinalisedAgreement({
      name: fileData.name,
      type: fileData.type,
      size: fileData.size,
      base64: fileData.base64,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.displayName || user.email,
    });
  };

  // Handle approving contract (State B -> State C)
  const handleApproveContract = async () => {
    if (!finalizedAgreement) {
      alert('Please upload the finalised agreement before approving');
      return;
    }

    if (!digitalSignature.trim()) {
      alert('Please provide your digital signature');
      return;
    }

    if (!approvalComments.trim()) {
      alert('Please provide approval comments');
      return;
    }

    setActionInProgress(true);

    try {
      // In production, call POST /api/contracts/${submissionId}/approve
      // with {digitalSignature, comments, finalAgreement}

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
          approvalComments: approvalComments.trim(),
          finalizedAgreement: finalizedAgreement,
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
  const opwReview = submission.opwReview;
  const contractStatus = submission.contractDrafter?.decision;
  const sentAt = submission.contractDrafter?.sentAt;
  const templateUsed = submission.contractDrafter?.templateUsed;

  // Determine current state
  const isStateA = !sentAt; // Not sent
  const isStateB = sentAt && !contractStatus; // Sent, awaiting upload
  const isStateC = contractStatus === 'approved'; // Approved

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

      {/* OPW Determination Context */}
      {opwReview && (
        <div style={{
          padding: 'var(--space-16)',
          backgroundColor: '#f0f7ff',
          border: '2px solid #3b82f6',
          borderRadius: 'var(--radius-base)',
          marginBottom: 'var(--space-24)',
        }}>
          <h4 style={{ margin: '0 0 var(--space-12) 0', color: 'var(--nhs-blue)' }}>
            OPW Panel Determination
          </h4>

          {/* Worker Classification */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <strong>Worker Classification:</strong>{' '}
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: opwReview.workerClassification === 'sole_trader' ? '#3b82f6' : '#8b5cf6',
              color: 'white',
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-xs)',
            }}>
              {opwReview.workerClassification === 'sole_trader' ? 'SOLE TRADER' : 'INTERMEDIARY'}
            </span>
          </div>

          {/* Intermediary Path - IR35 Status */}
          {opwReview.workerClassification === 'intermediary' && opwReview.ir35Status && (
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <strong>IR35 Status:</strong>{' '}
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: opwReview.ir35Status === 'outside' ? '#22c55e' : '#dc2626',
                color: 'white',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-size-xs)',
              }}>
                {opwReview.ir35Status === 'outside' ? 'OUTSIDE IR35' : 'INSIDE IR35'}
              </span>
              {opwReview.ir35Status === 'outside' && (
                <span style={{ marginLeft: 'var(--space-8)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  (Requires Consultancy Agreement)
                </span>
              )}
            </div>
          )}

          {/* Sole Trader Path - Employment Status */}
          {opwReview.workerClassification === 'sole_trader' && opwReview.employmentStatus && (
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <strong>Employment Status:</strong>{' '}
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: opwReview.employmentStatus === 'self_employed' ? '#22c55e' : '#dc2626',
                color: 'white',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-size-xs)',
              }}>
                {opwReview.employmentStatus === 'self_employed' ? 'SELF-EMPLOYED' : 'EMPLOYED'}
              </span>
              {opwReview.employmentStatus === 'self_employed' && (
                <span style={{ marginLeft: 'var(--space-8)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  (Requires Sole Trader Agreement)
                </span>
              )}
            </div>
          )}

          {/* Contract Required Flag */}
          {opwReview.contractRequired && (
            <div style={{
              marginTop: 'var(--space-12)',
              padding: 'var(--space-8)',
              backgroundColor: '#fef3c7',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-sm)',
            }}>
              <DocumentIcon size={14} style={{ verticalAlign: 'middle' }} /> <strong>Contract Required:</strong> {opwReview.contractRequired === 'yes' ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      )}

      {/* STATE A: Not Sent - Show template selection and send button */}
      {isStateA && (
        <div style={{
          padding: 'var(--space-20)',
          backgroundColor: 'white',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-base)',
          marginBottom: 'var(--space-24)',
        }}>
          <h3 style={{ margin: '0 0 var(--space-16) 0' }}>
            Send Agreement to Supplier
          </h3>

          {/* Template Selection - Card Based UI */}
          <div style={{ marginBottom: 'var(--space-16)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--space-8)',
              fontWeight: '600',
              color: 'var(--color-text)',
            }}>
              Step 1: Select Agreement Template
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

              {/* Card 2: Sole Trader Agreement (Self-Employed) */}
              <div
                onClick={() => {
                  const template = contractNegotiationService.getAgreementTemplate('self_employed');
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
                      Sole Trader Agreement
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                      Sole Trader Agreement v22
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      For self-employed sole traders
                    </div>
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

          <Textarea
            label="Step 2: Instructions for Supplier"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Provide instructions for the supplier regarding the agreement review and negotiation process. Note: Negotiation will occur via email correspondence."
            rows={5}
            required
          />

          <Button
            onClick={handleSendAgreement}
            disabled={actionInProgress || !selectedTemplate || !instructions.trim()}
            style={{ marginTop: 'var(--space-16)' }}
          >
            Send Agreement to Supplier
          </Button>
        </div>
      )}

      {/* STATE B: Sent, Awaiting Upload - Show notice and upload section */}
      {isStateB && (
        <div style={{
          padding: 'var(--space-20)',
          backgroundColor: 'white',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-base)',
        }}>
          <NoticeBox type="info" style={{ marginBottom: 'var(--space-16)' }}>
            Agreement sent on {formatDate(sentAt)}. Upload final signed agreement below.
          </NoticeBox>

          {/* Show template used (read-only) */}
          <div style={{
            padding: 'var(--space-12)',
            backgroundColor: '#f9fafb',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-16)',
          }}>
            <strong>Template Used:</strong> {templateUsed || 'N/A'}
          </div>

          {/* Upload Finalised Agreement */}
          <div style={{ marginBottom: 'var(--space-16)' }}>
            <NoticeBox type="info" style={{ marginBottom: 'var(--space-12)', fontSize: '0.875rem' }}>
              <strong>Step 1: Upload Finalised Agreement</strong>
              <p style={{ marginTop: 'var(--space-8)', marginBottom: 0 }}>
                Upload the final signed agreement that has been reviewed and approved by all parties. This will be forwarded to AP Control for final processing.
              </p>
            </NoticeBox>

            <FileUpload
              label="Finalised Signed Agreement"
              name="finalizedAgreement"
              acceptedTypes={['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
              onUpload={handleFinalisedAgreementUpload}
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
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            placeholder="Enter any final comments or notes about the contract approval..."
            rows={4}
            required
          />

          <Button
            onClick={handleApproveContract}
            disabled={actionInProgress || !approvalComments.trim() || !finalizedAgreement || !digitalSignature.trim()}
            style={{ marginTop: 'var(--space-16)', backgroundColor: '#059669' }}
          >
            <CheckIcon size={18} /> Submit to AP Control
          </Button>
        </div>
      )}

      {/* STATE C: Approved - Show success message */}
      {isStateC && (
        <div>
          <NoticeBox type="success" style={{ marginBottom: 'var(--space-24)' }}>
            <CheckIcon size={20} /> Contract approved and forwarded to AP Control
          </NoticeBox>

          <div style={{
            padding: 'var(--space-20)',
            backgroundColor: 'white',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-base)',
          }}>
            <h3 style={{ margin: '0 0 var(--space-16) 0' }}>Approval Summary</h3>

            <div style={{ marginBottom: 'var(--space-12)' }}>
              <strong>Template Used:</strong> {templateUsed || 'N/A'}
            </div>

            <div style={{ marginBottom: 'var(--space-12)' }}>
              <strong>Approved By:</strong> {submission.contractDrafter?.decidedBy || 'N/A'}
            </div>

            <div style={{ marginBottom: 'var(--space-12)' }}>
              <strong>Approved Date:</strong> {submission.contractDrafter?.decidedAt ? formatDate(submission.contractDrafter.decidedAt) : 'N/A'}
            </div>

            <div style={{ marginBottom: 'var(--space-12)' }}>
              <strong>Digital Signature:</strong>
              <div style={{ fontFamily: 'cursive', fontSize: '1.25rem', marginTop: '4px', color: '#0c4a6e' }}>
                {submission.contractDrafter?.digitalSignature || 'N/A'}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-12)' }}>
              <strong>Comments:</strong>
              <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                {submission.contractDrafter?.approvalComments || 'N/A'}
              </div>
            </div>

            {submission.contractDrafter?.finalizedAgreement && (
              <div>
                <strong>Finalised Agreement:</strong>
                <div style={{
                  marginTop: '8px',
                  padding: 'var(--space-12)',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <DocumentIcon size={16} color="#059669" /> {submission.contractDrafter.finalizedAgreement.name}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDrafterReviewPage;
