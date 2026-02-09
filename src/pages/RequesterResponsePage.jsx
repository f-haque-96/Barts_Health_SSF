/**
 * Requester & Supplier Response Portal
 * Unified page for both requesters and suppliers to:
 * - View workflow progress
 * - Communicate with authorized personnel
 * - Respond to information requests (PBP stage - requester only)
 * - Participate in contract negotiation (Contract stage - both parties)
 *
 * Access Control:
 * - Requester: Full access to all stages and exchanges
 * - Supplier: Access from Contract Drafter stage onwards
 * - Sole Trader: Requester IS the supplier (full access)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  Button,
  NoticeBox,
  Textarea,
  PaperclipIcon,
  ClipboardIcon,
  BuildingIcon,
  ShieldIcon,
  DocumentIcon,
  PoundIcon,
  CheckIcon,
  ClockIcon,
  XIcon
} from '../components/common';
import { formatDate } from '../utils/helpers';
import PBPApprovalPDF from '../components/pdf/PBPApprovalPDF';

// ===== Exchange Thread Component =====
const ExchangeThread = ({ exchanges, onPreviewDocument, userRole }) => {
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
          const isContractDrafter = exchange.from === 'contract_drafter';
          const isFromRequester = exchange.from === 'requester';
          const isFromSupplier = exchange.from === 'supplier';
          const isDecision = exchange.type === 'decision' || exchange.type === 'contract_approved' || exchange.type === 'contract_rejected';

          // Determine background color
          let backgroundColor;
          if (isDecision) {
            backgroundColor = exchange.decision === 'approved' ? '#f0fdf4' : '#fef2f2';
          } else if (isPBP) {
            backgroundColor = '#f0f7ff';
          } else if (isContractDrafter) {
            backgroundColor = '#f0fdf4';
          } else {
            backgroundColor = '#fefce8';
          }

          return (
            <div
              key={exchange.id || index}
              style={{
                padding: 'var(--space-16)',
                borderBottom: index < exchanges.length - 1 ? '1px solid var(--color-border)' : 'none',
                backgroundColor,
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
                    backgroundColor: isPBP ? '#005EB8' :
                                     isContractDrafter ? '#059669' :
                                     isFromRequester ? '#ca8a04' :
                                     isFromSupplier ? '#3b82f6' : '#ca8a04',
                    color: 'white',
                  }}>
                    {isPBP ? 'PBP REVIEWER' :
                     isContractDrafter ? 'CONTRACT DRAFTER' :
                     isFromRequester ? 'REQUESTER' :
                     isFromSupplier ? 'SUPPLIER' :
                     userRole === 'supplier' ? 'SUPPLIER' : 'REQUESTER'}
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

              {/* Message - Only show if there's a message */}
              {exchange.message && exchange.message.trim() && (
                <div style={{
                  padding: 'var(--space-12)',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{exchange.message}</p>
                </div>
              )}

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
const StatusBadge = ({ submission, isAwaitingYou }) => {
  const getConfig = () => {
    const currentStage = submission?.currentStage || submission?.stage || 'pbp';
    const vendorNumber = submission?.vendorNumber;

    // Completed - vendor created
    if (vendorNumber || submission?.finalStatus === 'complete') {
      return { bg: '#22c55e', text: `Completed - Vendor #${vendorNumber || 'Created'}`, color: 'white' };
    }

    // Rejected at any stage
    if (submission?.status === 'rejected' || submission?.pbpReview?.decision === 'rejected') {
      return { bg: '#ef4444', text: 'Rejected', color: 'white' };
    }

    // Action required from requester/supplier
    if (isAwaitingYou) {
      return { bg: '#f59e0b', text: 'Action Required - Please Respond', color: 'white' };
    }

    // Stage-specific statuses
    switch (currentStage) {
      case 'pbp':
        if (submission?.pbpReview?.decision === 'approved') {
          return { bg: '#3b82f6', text: 'PBP Approved - Proceeding to Procurement', color: 'white' };
        }
        return { bg: '#3b82f6', text: 'Under Review by PBP Panel', color: 'white' };

      case 'procurement':
        return { bg: '#3b82f6', text: 'Under Review by Procurement Team', color: 'white' };

      case 'opw':
        return { bg: '#3b82f6', text: 'Under Assessment by OPW Panel', color: 'white' };

      case 'contract':
        if (submission?.contractDrafter?.decision === 'approved') {
          return { bg: '#22c55e', text: 'Contract Approved - Proceeding to AP Control', color: 'white' };
        }
        return { bg: '#3b82f6', text: 'Contract Under Review', color: 'white' };

      case 'ap':
      case 'ap_control':
        if (submission?.apControlReview?.verified) {
          return { bg: '#22c55e', text: 'AP Verified - Creating Vendor Record', color: 'white' };
        }
        return { bg: '#3b82f6', text: 'Bank Details Verification in Progress', color: 'white' };

      default:
        return { bg: '#3b82f6', text: 'In Review', color: 'white' };
    }
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

// ===== Workflow Status Timeline =====
const WorkflowStatus = ({ submission }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Determine if OPW and Contract stages are required based on procurement classification
  const requiresOPWAndContract = () => {
    const classification = submission?.procurementReview?.classification;
    const requiresOPW = submission?.requiresOPW;

    // If explicitly marked as not requiring OPW, skip both stages
    if (requiresOPW === false) {
      return false;
    }

    // Standard suppliers don't need OPW or contract review
    if (classification === 'standard' || classification === 'Standard') {
      return false;
    }

    // Potential OPW or any other classification requires these stages
    return true;
  };

  const showOPWAndContract = requiresOPWAndContract();

  // Determine current stage and status of each stage
  const getStageInfo = () => {
    const stages = [
      {
        id: 'pbp',
        name: 'PBP Review',
        description: 'Prescreening questionnaire review',
        IconComponent: ClipboardIcon,
      },
      {
        id: 'procurement',
        name: 'Procurement Review',
        description: 'Supplier classification and routing',
        IconComponent: BuildingIcon,
      },
      {
        id: 'opw',
        name: 'OPW Panel',
        description: 'IR35 assessment (if required)',
        IconComponent: ShieldIcon,
      },
      {
        id: 'contract',
        name: 'Contract Review',
        description: 'Agreement negotiation and signature',
        IconComponent: DocumentIcon,
      },
      {
        id: 'ap',
        name: 'AP Control',
        description: 'Bank details verification',
        IconComponent: PoundIcon,
      },
      {
        id: 'complete',
        name: 'Vendor Created',
        description: 'Supplier setup complete',
        IconComponent: CheckIcon,
      },
    ];

    // Map submission data to stage statuses
    const status = submission?.status || 'pending_review';
    const currentStage = submission?.currentStage || submission?.stage || 'pbp';
    const pbpStatus = submission?.pbpReview?.decision || (status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending');
    const procurementStatus = submission?.procurementReview?.decision || submission?.procurementStatus;
    const opwStatus = submission?.opwReview?.decision || submission?.opwStatus;
    const apStatus = submission?.apControlReview?.verified ? 'verified' : submission?.apStatus;
    const isComplete = submission?.finalStatus === 'complete' || submission?.vendorNumber;

    return stages.map(stage => {
      let stageStatus = 'pending';
      let statusText = '';
      let completedDate = '';

      if (stage.id === 'pbp') {
        if (pbpStatus === 'approved') {
          stageStatus = 'completed';
          statusText = 'Approved';
          completedDate = submission?.pbpReview?.completedAt || submission?.pbpReview?.date;
        } else if (pbpStatus === 'rejected') {
          stageStatus = 'rejected';
          statusText = 'Rejected';
        } else if (currentStage === 'pbp' || status === 'pending_review' || status === 'info_required') {
          stageStatus = 'active';
          statusText = status === 'info_required' ? 'Information Requested' : 'Under Review';
        }
      } else if (stage.id === 'procurement') {
        if (procurementStatus === 'approved' || procurementStatus === 'classified') {
          stageStatus = 'completed';
          statusText = 'Reviewed & Classified';
          completedDate = submission?.procurementReview?.completedAt;
        } else if (currentStage === 'procurement') {
          stageStatus = 'active';
          statusText = 'Classifying Supplier';
        } else if (pbpStatus === 'approved') {
          stageStatus = 'pending';
        } else {
          stageStatus = 'locked';
        }
      } else if (stage.id === 'opw') {
        if (!showOPWAndContract) {
          stageStatus = 'skipped';
          statusText = 'Not Required';
        } else if (opwStatus === 'inside_ir35' || opwStatus === 'outside_ir35') {
          stageStatus = 'completed';
          statusText = opwStatus === 'outside_ir35' ? 'Outside IR35' : 'Inside IR35';
          completedDate = submission?.opwReview?.completedAt;
        } else if (currentStage === 'opw') {
          stageStatus = 'active';
          statusText = 'Assessing IR35';
        } else if (procurementStatus && submission?.requiresOPW !== false) {
          stageStatus = 'pending';
        } else if (submission?.requiresOPW === false) {
          stageStatus = 'skipped';
          statusText = 'Not Required';
        } else {
          stageStatus = 'locked';
        }
      } else if (stage.id === 'contract') {
        const contractStatus = submission?.contractDrafter?.decision;
        if (!showOPWAndContract) {
          stageStatus = 'skipped';
          statusText = 'Not Required';
        } else if (contractStatus === 'approved') {
          stageStatus = 'completed';
          statusText = 'Contract Approved';
          completedDate = submission?.contractDrafter?.completedAt;
        } else if (currentStage === 'contract') {
          stageStatus = 'active';
          statusText = 'Negotiating Agreement';
        } else if (opwStatus) {
          stageStatus = 'pending';
        } else {
          stageStatus = 'locked';
        }
      } else if (stage.id === 'ap') {
        if (apStatus === 'verified' || submission?.apControlReview?.verified) {
          stageStatus = 'completed';
          statusText = 'Bank Details Verified';
          completedDate = submission?.apControlReview?.completedAt;
        } else if (currentStage === 'ap' || currentStage === 'ap_control') {
          stageStatus = 'active';
          statusText = 'Verifying Bank Details';
        } else if ((opwStatus || submission?.requiresOPW === false) && procurementStatus) {
          stageStatus = 'pending';
        } else {
          stageStatus = 'locked';
        }
      } else if (stage.id === 'complete') {
        if (isComplete || submission?.vendorNumber) {
          stageStatus = 'completed';
          statusText = `Vendor #${submission?.vendorNumber || 'Created'}`;
          completedDate = submission?.completedAt;
        } else if (apStatus === 'verified') {
          stageStatus = 'active';
          statusText = 'Creating Vendor Record';
        } else {
          stageStatus = 'locked';
        }
      }

      return {
        ...stage,
        status: stageStatus,
        statusText,
        completedDate,
        isActive: stageStatus === 'active',
        isCompleted: stageStatus === 'completed',
        isSkipped: stageStatus === 'skipped',
        isPending: stageStatus === 'pending',
        isLocked: stageStatus === 'locked',
      };
    });
  };

  const allStages = getStageInfo();

  // Filter out stages that should be hidden (not just skipped, but completely hidden)
  const stages = allStages.filter(stage => {
    // Hide OPW and Contract stages if procurement classified as standard
    if (!showOPWAndContract && (stage.id === 'opw' || stage.id === 'contract')) {
      return false;
    }
    return true;
  });

  const hasStartedFullForm = submission?.procurementReview || submission?.currentStage !== 'pbp';

  // Only show workflow if submission has progressed beyond PBP or is approved
  if (!hasStartedFullForm && submission?.status !== 'approved') {
    return null;
  }

  return (
    <div style={{
      marginTop: 'var(--space-24)',
      marginBottom: 'var(--space-24)',
      padding: 'var(--space-20)',
      backgroundColor: '#f8fafc',
      borderRadius: 'var(--radius-base)',
      border: '2px solid #e2e8f0',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isExpanded ? 'var(--space-16)' : '0',
      }}>
        <h3 style={{
          margin: 0,
          color: 'var(--nhs-blue)',
          fontSize: 'var(--font-size-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <ClipboardIcon size={20} color="var(--nhs-blue)" />
          Workflow Progress
        </h3>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--nhs-blue)',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f0f7ff';
            e.target.style.borderColor = 'var(--nhs-blue)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = '#e2e8f0';
          }}
        >
          {isExpanded ? '▼ Collapse' : '▶ Expand'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          {stages.map((stage, index) => {
          const isLastStage = index === stages.length - 1;
          const StageIcon = stage.IconComponent; // React requires capitalized variable for component

          return (
            <div key={stage.id}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-12)',
                opacity: stage.isLocked ? 0.4 : 1,
              }}>
                {/* Icon/Status Indicator */}
                <div style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  backgroundColor: stage.isCompleted ? '#22c55e' :
                                   stage.isActive ? '#3b82f6' :
                                   stage.isPending ? '#f59e0b' :
                                   stage.isSkipped ? '#94a3b8' : '#e2e8f0',
                  border: stage.isActive ? '3px solid #1e40af' : 'none',
                  animation: stage.isActive ? 'pulse 2s infinite' : 'none',
                }}>
                  {stage.isCompleted ? (
                    <CheckIcon size={20} color="white" />
                  ) : stage.isActive ? (
                    <StageIcon size={20} color="white" />
                  ) : stage.isSkipped ? (
                    <XIcon size={16} color="white" />
                  ) : stage.isPending ? (
                    <ClockIcon size={18} color="white" />
                  ) : (
                    <StageIcon size={18} color="#94a3b8" />
                  )}
                </div>

                {/* Stage Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}>
                    <strong style={{
                      fontSize: 'var(--font-size-base)',
                      color: stage.isActive ? '#1e40af' : 'var(--color-text)',
                    }}>
                      {stage.name}
                    </strong>
                    {stage.isActive && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                      }}>
                        IN PROGRESS
                      </span>
                    )}
                  </div>

                  <p style={{
                    margin: '0 0 4px 0',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {stage.description}
                  </p>

                  {stage.statusText && (
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: stage.isCompleted ? '#059669' :
                             stage.isActive ? '#1e40af' : '#6b7280',
                      fontWeight: stage.isCompleted || stage.isActive ? '600' : '400',
                    }}>
                      {stage.statusText}
                      {stage.completedDate && ` • ${formatDate(stage.completedDate)}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLastStage && (
                <div style={{
                  marginLeft: '20px',
                  width: '2px',
                  height: '20px',
                  backgroundColor: stage.isCompleted ? '#22c55e' : '#e2e8f0',
                }} />
              )}
            </div>
          );
        })}

        {/* Estimated Completion */}
        {!stages[stages.length - 1].isCompleted && stages.some(s => s.isActive) && (
          <div style={{
            marginTop: 'var(--space-16)',
            padding: 'var(--space-12)',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            color: '#1e40af',
          }}>
            <strong>ℹ️ Estimated Completion:</strong> 2-3 working days
          </div>
        )}
      </div>
      )}
    </div>
  );
};

const RequesterResponsePage = ({
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
  const [responseMessage, setResponseMessage] = useState('');
  const [responseAttachments, setResponseAttachments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine user role: requester, supplier, or both (sole trader)
  const requesterEmail = submission?.formData?.nhsEmail?.toLowerCase();
  const supplierEmail = submission?.formData?.contactEmail?.toLowerCase();
  const userEmail = user?.email?.toLowerCase();
  const isSoleTrader = submission?.formData?.supplierType === 'sole_trader' ||
                       submission?.formData?.soleTraderStatus === 'yes';

  // For sole traders without NHS email, treat supplier email as both roles
  const isRequester = requesterEmail ? (userEmail === requesterEmail) : false;
  const isSupplier = supplierEmail ? (userEmail === supplierEmail) : false;
  const isBothRoles = isSoleTrader && (isRequester || (isSupplier && !requesterEmail)); // Sole trader case

  // Determine primary role for display
  const userRole = isBothRoles ? 'both' :
                   isRequester ? 'requester' :
                   isSupplier ? 'supplier' : 'requester';

  // Load submission
  useEffect(() => {
    // Skip localStorage loading if submission provided via props
    if (propSubmission) {
      setLoading(false);
      return;
    }
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
  }, [submissionId, propSubmission]);

  // Check status - support both PBP and Contract exchanges
  const pbpExchanges = submission?.pbpReview?.exchanges || [];
  const contractExchanges = submission?.contractDrafter?.exchanges || [];

  // Determine which exchange system is active
  const currentStage = submission?.currentStage || 'pbp';
  const isContractStage = currentStage === 'contract';

  // Filter exchanges based on user role
  // Suppliers only see contract stage exchanges (unless they're also the requester)
  let visibleExchanges;
  if (userRole === 'supplier' && !isBothRoles) {
    // Supplier only: show only contract exchanges
    visibleExchanges = contractExchanges;
  } else if (isContractStage) {
    // Requester or both: show current stage exchanges
    visibleExchanges = contractExchanges;
  } else {
    // Requester in PBP stage
    visibleExchanges = pbpExchanges;
  }

  const exchanges = visibleExchanges;
  const lastExchange = exchanges.length > 0 ? exchanges[exchanges.length - 1] : null;

  // Check if awaiting response from supplier/requester
  const isAwaitingResponse = isContractStage
    ? (lastExchange?.from === 'contract_drafter' && lastExchange?.type !== 'contract_approved' && lastExchange?.type !== 'contract_rejected')
    : (lastExchange?.from === 'pbp' && lastExchange?.type !== 'decision');

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

      // Determine who is responding (requester or supplier)
      const respondingAsSupplier = isContractStage && (userRole === 'supplier' || userRole === 'both');

      // Get the appropriate name and email
      let fromName, fromEmail, responseFrom, responseType;

      if (respondingAsSupplier) {
        // Responding as supplier
        fromName = submission?.formData?.contactName || 'Supplier';
        fromEmail = supplierEmail || submission?.formData?.contactEmail || userEmail || 'Unknown';
        responseFrom = 'supplier';
        responseType = 'supplier_response';
      } else {
        // Responding as requester
        fromName = `${submission?.formData?.section1?.firstName || submission?.formData?.firstName || ''} ${submission?.formData?.section1?.lastName || submission?.formData?.lastName || ''}`.trim() || user?.displayName || 'Requester';
        fromEmail = requesterEmail || submission?.formData?.nhsEmail || userEmail || 'Unknown';
        responseFrom = 'requester';
        responseType = 'requester_response';
      }

      // Convert attachments object to array format for consistency
      const attachmentsArray = Object.keys(responseAttachments).length > 0
        ? Object.values(responseAttachments).map(att => ({
            name: att.name,
            type: att.type,
            size: att.size,
            base64: att.base64,
            url: att.base64, // Use base64 as URL for download
            uploadedAt: att.uploadedAt
          }))
        : [];

      // Create new exchange entry
      const newExchange = {
        id: `EXC-${Date.now()}`,
        type: responseType,
        from: responseFrom,
        fromName: fromName,
        fromEmail: fromEmail,
        message: responseMessage,
        attachments: attachmentsArray.length > 0 ? attachmentsArray : null,
        timestamp: timestamp,
        uploadedBy: fromName,
        uploadedByEmail: fromEmail,
      };

      // Update exchanges
      const updatedExchanges = [...exchanges, newExchange];

      // Update submission based on current stage
      let updatedSubmission;
      if (isContractStage) {
        updatedSubmission = {
          ...submission,
          currentStage: 'contract', // Ensure stage stays as contract
          contractDrafter: {
            ...submission.contractDrafter,
            exchanges: updatedExchanges,
            status: 'negotiating',
            lastResponseAt: timestamp,
            lastResponseBy: fromName,
          },
        };
      } else {
        updatedSubmission = {
          ...submission,
          currentStage: 'pbp', // Ensure stage stays as pbp
          pbpReview: {
            ...submission.pbpReview,
            exchanges: updatedExchanges,
            currentStatus: 'awaiting_pbp',
            lastResponseAt: timestamp,
          },
        };
      }

      // Save to localStorage
      localStorage.setItem(`submission_${submissionId}`, JSON.stringify(updatedSubmission));

      // Update submissions list
      const submissions = JSON.parse(localStorage.getItem('all_submissions') || '[]');
      const index = submissions.findIndex(s => s.submissionId === submissionId);
      if (index !== -1) {
        submissions[index].currentStatus = isContractStage ? 'contract_negotiating' : 'awaiting_pbp';
        submissions[index].lastResponseAt = timestamp;
        localStorage.setItem('all_submissions', JSON.stringify(submissions));
      }

      setSubmission(updatedSubmission);
      setResponseMessage('');
      setResponseAttachments({});

      const notificationMessage = respondingAsSupplier
        ? 'Your response has been submitted successfully!\n\nThe Contract Drafter will be notified and will review your response and attachments.\n\n(In production, an email notification would be sent to the Contract Drafter)'
        : isContractStage
          ? 'Your response has been submitted successfully!\n\nThe Contract Drafter will be notified and will review your response.\n\n(In production, an email notification would be sent)'
          : 'Your response has been submitted successfully!\n\nThe PBP reviewer will be notified and will review your response.\n\n(In production, an email notification would be sent)';

      alert(notificationMessage);
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
          {isBothRoles ? 'Supplier Onboarding Portal' :
           userRole === 'supplier' ? 'Supplier Portal - Contract Review' :
           'Requester & Supplier Portal'}
        </h1>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-12)' }}>
          <div>Reference: <strong>{submission.submissionId}</strong></div>
          <div>Questionnaire Type: <strong style={{ textTransform: 'capitalize' }}>{questionnaireType}</strong></div>
          <div>Originally Submitted: {formatDate(submission.submissionDate)}</div>
          {isBothRoles && (
            <div style={{ marginTop: 'var(--space-8)', color: '#059669', fontWeight: '500' }}>
              ℹ️ You are both the requester and supplier for this submission
            </div>
          )}
          {userRole === 'supplier' && !isBothRoles && (
            <div style={{ marginTop: 'var(--space-8)', color: '#3b82f6', fontWeight: '500' }}>
              👤 Viewing as: <strong>Supplier</strong> (Contract stage access)
            </div>
          )}
          {userRole === 'requester' && !isBothRoles && (
            <div style={{ marginTop: 'var(--space-8)', color: '#ca8a04', fontWeight: '500' }}>
              👤 Viewing as: <strong>Requester</strong> (Full access)
            </div>
          )}
        </div>

        {/* Role-specific Access Notice */}
        {userRole === 'supplier' && !isBothRoles && (
          <NoticeBox type="info" style={{ fontSize: 'var(--font-size-sm)' }}>
            <strong>Supplier Access:</strong> As the supplier, you can view workflow progress and participate in contract negotiations from the Contract Drafter stage onwards. Earlier stages are managed by the requester.
          </NoticeBox>
        )}
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
          <StatusBadge submission={submission} isAwaitingYou={isAwaitingResponse} />
        </div>
      </div>

      {/* Workflow Status Timeline */}
      <WorkflowStatus submission={submission} />

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
        <ExchangeThread exchanges={exchanges} onPreviewDocument={handlePreviewDocument} userRole={userRole} />
      )}

      {/* Supplier Notice - No contract exchanges yet */}
      {userRole === 'supplier' && !isBothRoles && exchanges.length === 0 && (
        <NoticeBox type="info" style={{ marginBottom: 'var(--space-24)' }}>
          <strong>Awaiting Contract Stage</strong>
          <p style={{ margin: '8px 0 0 0' }}>
            The submission is currently in the early review stages. You will be notified when the Contract Drafter stage begins, at which point you can participate in contract negotiations and view exchange history.
          </p>
        </NoticeBox>
      )}

      {/* Response Form - Only show if awaiting response and not final decision */}
      {/* Suppliers can only respond during contract stage */}
      {isAwaitingResponse && !isFinalDecision && !(userRole === 'supplier' && !isContractStage) && (
        <div style={{
          padding: 'var(--space-24)',
          backgroundColor: '#fefce8',
          borderRadius: 'var(--radius-base)',
          border: '2px solid #facc15',
        }}>
          <h3 style={{ margin: '0 0 var(--space-16) 0', color: '#854d0e' }}>
            {isContractStage
              ? (userRole === 'supplier' ? 'Supplier Response' : 'Your Response')
              : 'Your Response'}
          </h3>

          <NoticeBox type="warning" style={{ marginBottom: 'var(--space-16)' }}>
            <strong>
              {isContractStage
                ? 'The Contract Drafter has sent a message.'
                : 'The PBP has requested additional information.'}
            </strong>
            <p style={{ margin: '8px 0 0 0' }}>
              {isContractStage
                ? 'Please review the contract agreement and respond with any questions, or upload the signed contract if ready.'
                : 'Please review their message above and provide the requested information below.'}
            </p>
          </NoticeBox>

          <Textarea
            label={isContractStage ? "Your Response to Contract Drafter" : "Your Response"}
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            rows={5}
            placeholder={isContractStage
              ? "Enter your response about the contract agreement. If uploading a signed contract, provide any clarifications here..."
              : "Enter your response here. Include any clarifications or explanations requested..."}
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
              {isContractStage ? "Upload Signed Contract (Required if finalizing agreement)" : "Attach Documents (Optional)"}
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
