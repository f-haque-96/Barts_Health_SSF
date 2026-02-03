/**
 * Audit Service
 * Logs all actions to AuditTrail table for compliance
 */

const { getPool, sql } = require('../config/database');
const logger = require('../config/logger');

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

module.exports = {
  logAudit,
  getAuditTrail
};
