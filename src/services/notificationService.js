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

  console.log('Notification created:', record);
  return record;
};

/**
 * Send rejection notification to requester
 * This creates a notification record that Power Automate will process
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
}) => {
  const subject = `Supplier Setup Request Rejected - ${supplierName || submissionId}`;

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

REJECTION REASON:
${rejectionReason || 'No reason provided'}

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
    },
  });

  // Also notify the admin team about the rejection
  notifyDepartment('admin', {
    type: 'REJECTION_ALERT',
    submissionId,
    subject: `[REJECTION] ${rejectedByRole} rejected: ${supplierName || submissionId}`,
    body: `Submission ${submissionId} was rejected by ${rejectedBy} (${rejectedByRole}).\n\nReason: ${rejectionReason}`,
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
    console.warn(`Unknown department: ${department}`);
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
