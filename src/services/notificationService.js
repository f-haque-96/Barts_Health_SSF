/**
 * Notification Service
 * Handles all notification logic for the supplier setup workflow
 * In production, these would integrate with Power Automate via SharePoint lists
 */

import { findPotentialDuplicates, checkSupplierWatchlist } from '../utils/helpers';

// Department email mappings (in production, these come from SharePoint/config)
const DEPARTMENT_EMAILS = {
  pbp: 'pbp-panel@nhs.net',
  procurement: 'procurement@nhs.net',
  opw: 'opw-panel@nhs.net',
  ap: 'ap-control@nhs.net',
  contractDrafter: 'peter.persaud@nhs.net',
  admin: 'supplier-admin@nhs.net',
};

// Notification types
export const NOTIFICATION_TYPES = {
  // Submission notifications
  NEW_SUBMISSION: 'NEW_SUBMISSION',
  SUBMISSION_UPDATED: 'SUBMISSION_UPDATED',

  // Approval notifications
  PBP_APPROVED: 'PBP_APPROVED',
  PBP_REJECTED: 'PBP_REJECTED',
  PBP_INFO_REQUIRED: 'PBP_INFO_REQUIRED',

  PROCUREMENT_APPROVED: 'PROCUREMENT_APPROVED',
  PROCUREMENT_REJECTED: 'PROCUREMENT_REJECTED',

  OPW_INSIDE_IR35: 'OPW_INSIDE_IR35',
  OPW_OUTSIDE_IR35: 'OPW_OUTSIDE_IR35',

  AP_VERIFIED: 'AP_VERIFIED',

  // Alert notifications
  DUPLICATE_SUPPLIER_FLAG: 'DUPLICATE_SUPPLIER_FLAG',
  WATCHLIST_MATCH: 'WATCHLIST_MATCH',
  CONFLICT_OF_INTEREST: 'CONFLICT_OF_INTEREST',
};

/**
 * Create a notification record for the SharePoint NotificationQueue list
 * In production, this triggers a Power Automate flow to send the email
 * @param {object} notification - Notification details
 * @returns {object} - Notification record
 */
export const createNotificationRecord = (notification) => {
  const record = {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    processed: false,
    ...notification,
  };

  // Store in localStorage for demo (in production, this goes to SharePoint)
  const notifications = JSON.parse(localStorage.getItem('notificationQueue') || '[]');
  notifications.push(record);
  localStorage.setItem('notificationQueue', JSON.stringify(notifications));

  return record;
};

/**
 * Alemba closure reason mappings
 * Maps our internal outcomes to Alemba's dropdown values
 */
export const ALEMBA_CLOSURE_REASONS = {
  // For successful supplier creation
  SUPPLIER_CREATED: 'New supplier created',
  // For rejected requests or OPW determinations
  QUERY_RESOLVED: 'Query resolved',
};

/**
 * Generate Alemba resolution summary based on outcome
 * @param {object} params - Outcome details
 * @returns {string} - Resolution summary text
 */
export const generateAlembaResolutionSummary = ({
  outcome, // 'approved', 'rejected', 'opw_inside', 'opw_outside'
  supplierName,
  vendorNumber,
  rejectionReason,
  rejectedBy,
  rejectedAtStage,
  ir35Status,
}) => {
  switch (outcome) {
    case 'approved':
      return vendorNumber
        ? `New supplier created. ${supplierName} - Vendor ${vendorNumber}`
        : `New supplier created. ${supplierName}`;

    case 'rejected':
      return `Rejected request - ${rejectionReason || 'See comments'}. Rejected by ${rejectedBy} at ${rejectedAtStage} stage. Guidance sent to requester.`;

    case 'opw_inside':
      return `OPW/IR35 Determination: Inside IR35. ${supplierName}. Processed via OPW route.`;

    case 'opw_outside':
      return `OPW/IR35 Determination: Outside IR35. ${supplierName}. Processed via OPW route.`;

    default:
      return `Request processed. ${supplierName || 'See details in system.'}`;
  }
};

/**
 * Close/Cancel an Alemba ticket
 * Includes all mandatory Alemba fields for ticket closure
 * In production, this would call the Alemba API or be processed by Power Automate
 *
 * ALEMBA MANDATORY FIELDS:
 * - Type: "New supplier request"
 * - Reason: "New supplier created" | "Query resolved" (dropdown)
 * - Call Status: "Closed"
 * - Resolution Summary: Free text description
 * - Email User: true/false
 *
 * @param {object} params - Alemba ticket details
 * @returns {object} - Alemba action record
 */
export const closeAlembaTicket = ({
  alembaReference,
  submissionId,
  outcome, // 'approved', 'rejected', 'opw_inside', 'opw_outside'
  supplierName,
  vendorNumber = null,
  rejectionReason = null,
  rejectedBy = null,
  rejectedAtStage = null,
  closedBy,
  emailUser = true,
}) => {
  if (!alembaReference) {
    return null;
  }

  // Determine Alemba reason based on outcome
  const alembaReason = outcome === 'approved'
    ? ALEMBA_CLOSURE_REASONS.SUPPLIER_CREATED
    : ALEMBA_CLOSURE_REASONS.QUERY_RESOLVED;

  // Generate resolution summary
  const resolutionSummary = generateAlembaResolutionSummary({
    outcome,
    supplierName,
    vendorNumber,
    rejectionReason,
    rejectedBy,
    rejectedAtStage,
  });

  // Build Alemba API payload with all mandatory fields
  const alembaAction = {
    id: `ALEMBA-${Date.now()}`,
    action: 'CLOSE_TICKET',
    alembaReference,
    submissionId,
    timestamp: new Date().toISOString(),
    processed: false,

    // ===== ALEMBA MANDATORY FIELDS =====
    // All dropdowns must match exact Alemba values
    alembaFields: {
      type: 'New supplier request',                    // Dropdown: "New supplier request"
      reason: alembaReason,                            // Dropdown: "New supplier created" | "Query resolved"
      callStatus: 'Closed',                            // Dropdown: "Closed"
      resolutionSummary: resolutionSummary,            // Free text
      emailUser: emailUser,                            // Checkbox: true/false
    },

    // Additional context for audit/debugging
    context: {
      outcome,
      supplierName,
      vendorNumber,
      rejectionReason,
      rejectedBy,
      rejectedAtStage,
      closedBy,
    },
  };

  // Store for Power Automate to process (calls Alemba API)
  const alembaQueue = JSON.parse(localStorage.getItem('alembaActionQueue') || '[]');
  alembaQueue.push(alembaAction);
  localStorage.setItem('alembaActionQueue', JSON.stringify(alembaQueue));

  return alembaAction;
};

/**
 * Generate Alemba ticket URL
 * @param {string} alembaReference - Alemba call reference number
 * @returns {string} - URL to the Alemba ticket
 */
export const getAlembaTicketUrl = (alembaReference) => {
  // In production, this would be the actual Alemba URL format
  // Format may vary based on your Alemba configuration
  return `https://alemba.nhs.net/calls/${alembaReference}`;
};

/**
 * Close Alemba ticket on successful supplier creation
 * Called when AP Control completes the vendor setup
 * @param {object} params - Completion details
 */
export const closeAlembaOnCompletion = ({
  alembaReference,
  submissionId,
  supplierName,
  vendorNumber,
  completedBy,
}) => {
  return closeAlembaTicket({
    alembaReference,
    submissionId,
    outcome: 'approved',
    supplierName,
    vendorNumber,
    closedBy: completedBy,
    emailUser: true,
  });
};

/**
 * Close Alemba ticket for OPW/IR35 determination
 * @param {object} params - OPW outcome details
 */
export const closeAlembaOnOPW = ({
  alembaReference,
  submissionId,
  supplierName,
  ir35Status, // 'inside' or 'outside'
  completedBy,
}) => {
  return closeAlembaTicket({
    alembaReference,
    submissionId,
    outcome: ir35Status === 'inside' ? 'opw_inside' : 'opw_outside',
    supplierName,
    closedBy: completedBy,
    emailUser: true,
  });
};

/**
 * Send rejection notification to requester
 * This creates a notification record that Power Automate will process
 * Also handles Alemba ticket closure if applicable
 * @param {object} params - Rejection parameters
 */
export const sendRejectionNotification = ({
  submissionId,
  requesterEmail,
  requesterName,
  supplierName,
  rejectedBy,
  rejectedByRole,
  rejectionReason,
  rejectionDate,
  alembaReference = null,
}) => {
  // If there's an Alemba reference, close/cancel the ticket with all mandatory fields
  if (alembaReference) {
    closeAlembaTicket({
      alembaReference,
      submissionId,
      outcome: 'rejected',
      supplierName,
      rejectionReason,
      rejectedBy,
      rejectedAtStage: rejectedByRole,
      closedBy: rejectedBy,
      emailUser: true,
    });
  }

  const alembaUrl = alembaReference ? getAlembaTicketUrl(alembaReference) : null;

  const subject = alembaReference
    ? `Supplier Setup Request Rejected - ${supplierName || submissionId} (Alemba: ${alembaReference})`
    : `Supplier Setup Request Rejected - ${supplierName || submissionId}`;

  const body = `
Dear ${requesterName || 'Requester'},

Your supplier setup request has been rejected.

SUBMISSION DETAILS:
- Submission ID: ${submissionId}
- Supplier Name: ${supplierName || 'Not yet provided'}
- Rejected By: ${rejectedBy} (${rejectedByRole})
- Date: ${new Date(rejectionDate || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}
${alembaReference ? `- Alemba Reference: ${alembaReference}` : ''}
${alembaUrl ? `- Alemba Ticket: ${alembaUrl}` : ''}

REJECTION REASON:
${rejectionReason || 'No reason provided'}
${alembaReference ? `
ALEMBA TICKET STATUS:
The Alemba call (${alembaReference}) has been closed with reason: Rejected.
You can view the ticket details at: ${alembaUrl}
` : ''}
NEXT STEPS:
Please review the feedback above and address the issues identified. You may submit a new request once the concerns have been resolved.

If you have questions about this rejection, please contact the ${rejectedByRole} team directly.

This is an automated notification from the NHS Supplier Setup System.
  `.trim();

  // Create notification record
  const notification = createNotificationRecord({
    type: `${rejectedByRole.toUpperCase()}_REJECTED`,
    submissionId,
    recipientEmail: requesterEmail,
    recipientName: requesterName,
    subject,
    body,
    metadata: {
      supplierName,
      rejectedBy,
      rejectedByRole,
      rejectionReason,
      rejectionDate: rejectionDate || new Date().toISOString(),
      alembaReference,
      alembaUrl,
      alembaTicketClosed: !!alembaReference,
    },
  });

  // Also notify the admin team about the rejection
  notifyDepartment('admin', {
    type: 'REJECTION_ALERT',
    submissionId,
    subject: `[REJECTION] ${rejectedByRole} rejected: ${supplierName || submissionId}${alembaReference ? ` (Alemba: ${alembaReference})` : ''}`,
    body: `Submission ${submissionId} was rejected by ${rejectedBy} (${rejectedByRole}).

Reason: ${rejectionReason}
${alembaReference ? `
Alemba Ticket: ${alembaReference} - CLOSED (Rejected)
Alemba URL: ${alembaUrl}` : ''}`,
  });

  return notification;
};

/**
 * Notify a department about an action or alert
 * @param {string} department - Department key (pbp, procurement, opw, ap, admin)
 * @param {object} details - Notification details
 */
export const notifyDepartment = (department, { type, submissionId, subject, body, metadata = {} }) => {
  const departmentEmail = DEPARTMENT_EMAILS[department];

  if (!departmentEmail) {
    return null;
  }

  return createNotificationRecord({
    type,
    submissionId,
    recipientEmail: departmentEmail,
    recipientName: `${department.toUpperCase()} Team`,
    subject,
    body,
    metadata,
  });
};

/**
 * Check for duplicate suppliers and send flag notifications
 * @param {object} submissionData - New submission data
 * @param {Array} existingSuppliers - List of existing suppliers
 * @returns {object} - { flagged: boolean, matches: Array, notifications: Array }
 */
export const checkAndFlagDuplicates = (submissionData, existingSuppliers = []) => {
  const supplierName = submissionData.companyName ||
    submissionData.formData?.companyName ||
    submissionData.formData?.section4?.companyName;

  if (!supplierName) {
    return { flagged: false, matches: [], notifications: [] };
  }

  const matches = findPotentialDuplicates(supplierName, existingSuppliers);
  const notifications = [];

  if (matches.length > 0) {
    // Flag to admin
    const adminNotif = notifyDepartment('admin', {
      type: NOTIFICATION_TYPES.DUPLICATE_SUPPLIER_FLAG,
      submissionId: submissionData.submissionId,
      subject: `[DUPLICATE FLAG] Potential duplicate supplier: ${supplierName}`,
      body: `
A potential duplicate supplier has been detected.

NEW SUBMISSION:
- Submission ID: ${submissionData.submissionId}
- Supplier Name: ${supplierName}
- Submitted By: ${submissionData.submittedBy || 'Unknown'}

POTENTIAL MATCHES:
${matches.map((m, i) => `
${i + 1}. ${m.original.name2}
   - Similarity: ${m.similarity}%
   - Flag Reason: ${m.flagReason}
   - Reference: ${m.existingSupplier.submissionId || m.existingSupplier.id || 'Unknown'}
`).join('')}

Please review and verify before proceeding.
      `.trim(),
      metadata: {
        newSupplierName: supplierName,
        matches: matches.map(m => ({
          name: m.original.name2,
          similarity: m.similarity,
          flagReason: m.flagReason,
        })),
      },
    });

    if (adminNotif) notifications.push(adminNotif);

    // Also flag to PBP if high similarity
    const highSimilarityMatches = matches.filter(m => m.similarity >= 85);
    if (highSimilarityMatches.length > 0) {
      const pbpNotif = notifyDepartment('pbp', {
        type: NOTIFICATION_TYPES.DUPLICATE_SUPPLIER_FLAG,
        submissionId: submissionData.submissionId,
        subject: `[ACTION REQUIRED] High similarity supplier detected: ${supplierName}`,
        body: `
A supplier with high similarity to existing records has been submitted.

SUBMITTED SUPPLIER: ${supplierName}

HIGH SIMILARITY MATCHES:
${highSimilarityMatches.map((m, i) => `
${i + 1}. ${m.original.name2} (${m.similarity}% similar)
`).join('')}

Please verify this is not a duplicate before approving.
        `.trim(),
        metadata: {
          newSupplierName: supplierName,
          highSimilarityMatches: highSimilarityMatches.map(m => ({
            name: m.original.name2,
            similarity: m.similarity,
          })),
        },
      });

      if (pbpNotif) notifications.push(pbpNotif);
    }
  }

  return {
    flagged: matches.length > 0,
    matches,
    notifications,
  };
};

/**
 * Send approval notification to requester
 * @param {object} params - Approval parameters
 */
export const sendApprovalNotification = ({
  submissionId,
  requesterEmail,
  requesterName,
  supplierName,
  approvedBy,
  approvedByRole,
  approvalComments,
  nextSteps,
}) => {
  const subject = `Supplier Setup Request ${approvedByRole} Approved - ${supplierName || submissionId}`;

  const body = `
Dear ${requesterName || 'Requester'},

Your supplier setup request has been approved by ${approvedByRole}.

SUBMISSION DETAILS:
- Submission ID: ${submissionId}
- Supplier Name: ${supplierName || 'Not yet provided'}
- Approved By: ${approvedBy} (${approvedByRole})
- Date: ${new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}

${approvalComments ? `COMMENTS:\n${approvalComments}\n` : ''}

NEXT STEPS:
${nextSteps || 'Your request will proceed to the next review stage.'}

This is an automated notification from the NHS Supplier Setup System.
  `.trim();

  return createNotificationRecord({
    type: `${approvedByRole.toUpperCase()}_APPROVED`,
    submissionId,
    recipientEmail: requesterEmail,
    recipientName: requesterName,
    subject,
    body,
    metadata: {
      supplierName,
      approvedBy,
      approvedByRole,
      approvalComments,
    },
  });
};

/**
 * Send conflict of interest alert
 * @param {object} submissionData - Submission data with conflict details
 */
export const sendConflictOfInterestAlert = (submissionData) => {
  const requesterName = `${submissionData.formData?.firstName || ''} ${submissionData.formData?.lastName || ''}`.trim();
  const connectionDetails = submissionData.formData?.connectionDetails;
  const supplierName = submissionData.formData?.companyName ||
    submissionData.questionnaireData?.supplierName ||
    'Not yet provided';

  // Notify admin and PBP
  ['admin', 'pbp'].forEach(dept => {
    notifyDepartment(dept, {
      type: NOTIFICATION_TYPES.CONFLICT_OF_INTEREST,
      submissionId: submissionData.submissionId,
      subject: `[CONFLICT OF INTEREST] Declaration in submission ${submissionData.submissionId}`,
      body: `
A conflict of interest has been declared in a supplier setup request.

SUBMISSION DETAILS:
- Submission ID: ${submissionData.submissionId}
- Requester: ${requesterName}
- Requester Email: ${submissionData.formData?.nhsEmail || 'Unknown'}
- Supplier: ${supplierName}

DECLARED CONNECTION:
${connectionDetails || 'No details provided'}

This submission requires additional scrutiny due to the declared conflict of interest.
      `.trim(),
      metadata: {
        requesterName,
        supplierName,
        connectionDetails,
      },
    });
  });
};

/**
 * Get notification history for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Array} - Array of notifications
 */
export const getNotificationHistory = (submissionId) => {
  const notifications = JSON.parse(localStorage.getItem('notificationQueue') || '[]');
  return notifications.filter(n => n.submissionId === submissionId);
};

/**
 * Mark notification as processed
 * @param {string} notificationId - Notification ID
 */
export const markNotificationProcessed = (notificationId) => {
  const notifications = JSON.parse(localStorage.getItem('notificationQueue') || '[]');
  const index = notifications.findIndex(n => n.id === notificationId);

  if (index !== -1) {
    notifications[index].processed = true;
    notifications[index].processedAt = new Date().toISOString();
    localStorage.setItem('notificationQueue', JSON.stringify(notifications));
  }
};

export default {
  NOTIFICATION_TYPES,
  createNotificationRecord,
  sendRejectionNotification,
  sendApprovalNotification,
  notifyDepartment,
  checkAndFlagDuplicates,
  sendConflictOfInterestAlert,
  getNotificationHistory,
  markNotificationProcessed,
};
