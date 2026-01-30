/**
 * Submission Service
 * Handles all submission-related database operations
 */

const { getPool, sql } = require('../config/database');
const { logAudit } = require('./auditService');
const logger = require('../config/logger');

/**
 * Generate unique submission ID
 */
function generateSubmissionId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `SUP-${year}-${random}`;
}

/**
 * Get submission by ID
 */
async function getById(id) {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input('SubmissionID', sql.NVarChar(50), id)
      .query(`
        SELECT * FROM Submissions
        WHERE SubmissionID = @SubmissionID
      `);

    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Failed to get submission:', error);
    throw error;
  }
}

/**
 * Create new submission
 */
async function create(data, user) {
  try {
    const pool = getPool();
    const submissionId = generateSubmissionId();

    const request = pool.request()
      .input('SubmissionID', sql.NVarChar(50), submissionId)
      .input('Status', sql.NVarChar(50), 'pending_review')
      .input('CurrentStage', sql.NVarChar(50), 'pbp')
      .input('RequesterFirstName', sql.NVarChar(100), data.firstName)
      .input('RequesterLastName', sql.NVarChar(100), data.lastName)
      .input('RequesterJobTitle', sql.NVarChar(100), data.jobTitle)
      .input('RequesterDepartment', sql.NVarChar(100), data.department)
      .input('RequesterEmail', sql.NVarChar(255), data.nhsEmail || user.email)
      .input('RequesterPhone', sql.NVarChar(50), data.phoneNumber)
      .input('CompanyName', sql.NVarChar(255), data.companyName)
      .input('CreatedBy', sql.NVarChar(255), user.email);

    await request.query(`
      INSERT INTO Submissions (
        SubmissionID, Status, CurrentStage,
        RequesterFirstName, RequesterLastName, RequesterJobTitle,
        RequesterDepartment, RequesterEmail, RequesterPhone,
        CompanyName, CreatedBy
      ) VALUES (
        @SubmissionID, @Status, @CurrentStage,
        @RequesterFirstName, @RequesterLastName, @RequesterJobTitle,
        @RequesterDepartment, @RequesterEmail, @RequesterPhone,
        @CompanyName, @CreatedBy
      )
    `);

    // Log audit
    await logAudit({
      submissionId,
      action: 'SUBMISSION_CREATED',
      user: user.email,
      newStatus: 'pending_review'
    });

    return { submissionId };
  } catch (error) {
    logger.error('Failed to create submission:', error);
    throw error;
  }
}

/**
 * Update submission
 */
async function update(id, data, user) {
  try {
    const pool = getPool();
    const existing = await getById(id);

    if (!existing) {
      throw new Error('Submission not found');
    }

    // Build dynamic update query based on provided fields
    const updates = [];
    const request = pool.request().input('SubmissionID', sql.NVarChar(50), id);

    if (data.status) {
      updates.push('Status = @Status');
      request.input('Status', sql.NVarChar(50), data.status);
    }

    if (data.currentStage) {
      updates.push('CurrentStage = @CurrentStage');
      request.input('CurrentStage', sql.NVarChar(50), data.currentStage);
    }

    // Add more fields as needed...

    updates.push('UpdatedAt = GETDATE()');

    if (updates.length > 0) {
      await request.query(`
        UPDATE Submissions
        SET ${updates.join(', ')}
        WHERE SubmissionID = @SubmissionID
      `);
    }

    // Log audit
    await logAudit({
      submissionId: id,
      action: 'SUBMISSION_UPDATED',
      user: user.email,
      previousStatus: existing.Status,
      newStatus: data.status || existing.Status
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to update submission:', error);
    throw error;
  }
}

/**
 * Get work queue for a review stage
 */
async function getWorkQueue(stage, user) {
  try {
    const pool = getPool();

    // Map stage to status values
    const stageStatusMap = {
      'pbp': ['pending_review', 'pending_pbp_review', 'info_required'],
      'procurement': ['approved', 'pending_procurement_review', 'pbp_approved'],
      'opw': ['pending_opw_review', 'procurement_approved_opw'],
      'contract': ['pending_contract', 'opw_complete'],
      'ap': ['pending_ap_control', 'contract_uploaded']
    };

    const statuses = stageStatusMap[stage] || [];

    const result = await pool.request()
      .query(`
        SELECT SubmissionID, DisplayReference, Status, CurrentStage,
               CompanyName, RequesterFirstName, RequesterLastName,
               RequesterEmail, CreatedAt, UpdatedAt
        FROM Submissions
        WHERE Status IN (${statuses.map((_, i) => `'${statuses[i]}'`).join(',')})
        ORDER BY CreatedAt ASC
      `);

    return result.recordset;
  } catch (error) {
    logger.error('Failed to get work queue:', error);
    throw error;
  }
}

module.exports = {
  generateSubmissionId,
  getById,
  create,
  update,
  getWorkQueue
};
