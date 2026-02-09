/**
 * Audit Service
 * Logs all actions to AuditTrail table for compliance
 */

const { getPool, sql } = require('../config/database');
const logger = require('../config/logger');

/**
 * Audit Action Types
 * Standardized action types for logging
 */
const ACTION_TYPES = {
  // Submission actions
  SUBMISSION_CREATED: 'submission_created',
  SUBMISSION_UPDATED: 'submission_updated',
  SUBMISSION_DELETED: 'submission_deleted',

  // Review actions
  PBP_APPROVED: 'pbp_approved',
  PBP_REJECTED: 'pbp_rejected',
  PBP_INFO_REQUESTED: 'pbp_info_requested',

  PROCUREMENT_APPROVED: 'procurement_approved',
  PROCUREMENT_REJECTED: 'procurement_rejected',

  OPW_APPROVED: 'opw_approved',
  OPW_REJECTED: 'opw_rejected',

  AP_VERIFIED: 'ap_verified',
  AP_REJECTED: 'ap_rejected',

  // Contract drafter actions
  CONTRACT_SENT: 'contract_sent',
  CONTRACT_RESPONSE: 'contract_response',
  CONTRACT_APPROVED: 'contract_approved',
  CONTRACT_REJECTED: 'contract_rejected',
  CONTRACT_CHANGES_REQUESTED: 'contract_changes_requested',

  // Document actions
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DELETED: 'document_deleted',

  // System actions
  VENDOR_CREATED: 'vendor_created',
  NOTIFICATION_SENT: 'notification_sent',
};

/**
 * Log an audit entry to the database
 */
async function logAudit(auditData) {
  try {
    const pool = getPool();

    await pool.request()
      .input('SubmissionID', sql.NVarChar(50), auditData.submissionId || null)
      .input('AlembaReference', sql.NVarChar(50), auditData.alembaReference || null)
      .input('ActionType', sql.NVarChar(100), auditData.action)
      .input('ActionDetails', sql.NVarChar(sql.MAX), JSON.stringify(auditData))
      .input('PreviousStatus', sql.NVarChar(50), auditData.previousStatus || null)
      .input('NewStatus', sql.NVarChar(50), auditData.newStatus || null)
      .input('PerformedBy', sql.NVarChar(255), auditData.user || 'system')
      .input('PerformedByEmail', sql.NVarChar(255), auditData.userEmail || auditData.user || 'system')
      .input('IPAddress', sql.NVarChar(50), auditData.ipAddress || null)
      .input('UserAgent', sql.NVarChar(500), auditData.userAgent || null)
      .query(`
        INSERT INTO AuditTrail (
          SubmissionID, AlembaReference, ActionType, ActionDetails,
          PreviousStatus, NewStatus, PerformedBy, PerformedByEmail,
          IPAddress, UserAgent
        ) VALUES (
          @SubmissionID, @AlembaReference, @ActionType, @ActionDetails,
          @PreviousStatus, @NewStatus, @PerformedBy, @PerformedByEmail,
          @IPAddress, @UserAgent
        )
      `);

    return true;
  } catch (error) {
    logger.error('Failed to log audit entry:', error);
    // Don't throw - audit failures shouldn't break the application
    return false;
  }
}

/**
 * Get audit trail for a submission
 */
async function getAuditTrail(submissionId) {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input('SubmissionID', sql.NVarChar(50), submissionId)
      .query(`
        SELECT * FROM AuditTrail
        WHERE SubmissionID = @SubmissionID
        ORDER BY PerformedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    logger.error('Failed to get audit trail:', error);
    throw error;
  }
}

/**
 * Log contract drafter action
 * Helper function for logging contract-related actions
 * @param {string} submissionId - Submission ID
 * @param {string} action - Action type (from ACTION_TYPES)
 * @param {object} details - Action details
 */
async function logContractAction(submissionId, action, details) {
  const auditData = {
    submissionId,
    action,
    user: details.performedBy,
    userEmail: details.performedByEmail,
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
    previousStatus: details.previousStatus,
    newStatus: details.newStatus,
    contractType: details.contractType,
    templateUsed: details.templateUsed,
    exchangeId: details.exchangeId,
    attachments: details.attachments,
    message: details.message,
    decision: details.decision,
  };

  return logAudit(auditData);
}

module.exports = {
  ACTION_TYPES,
  logAudit,
  getAuditTrail,
  logContractAction,
};
