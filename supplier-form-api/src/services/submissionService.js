/**
 * Submission Service
 * Handles all submission-related database operations
 */

const { getPool, sql } = require('../config/database');
const { logAudit } = require('./auditService');
const logger = require('../config/logger');
const crypto = require('crypto');

/**
 * Generate unique submission ID
 * SECURITY: Uses crypto.randomUUID() for cryptographically secure ID generation
 */
function generateSubmissionId() {
  const year = new Date().getFullYear();
  // Use crypto.randomUUID() which is cryptographically secure
  const uuid = crypto.randomUUID().split('-')[0].toUpperCase(); // First segment of UUID
  return `SUP-${year}-${uuid}`;
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

    // Define all updateable fields with their SQL types
    const fieldMappings = {
      // Status fields
      status: { column: 'Status', type: sql.NVarChar(50) },
      currentStage: { column: 'CurrentStage', type: sql.NVarChar(50) },
      displayReference: { column: 'DisplayReference', type: sql.NVarChar(100) },

      // Requester Information
      requesterFirstName: { column: 'RequesterFirstName', type: sql.NVarChar(100) },
      requesterLastName: { column: 'RequesterLastName', type: sql.NVarChar(100) },
      requesterJobTitle: { column: 'RequesterJobTitle', type: sql.NVarChar(100) },
      requesterDepartment: { column: 'RequesterDepartment', type: sql.NVarChar(100) },
      requesterEmail: { column: 'RequesterEmail', type: sql.NVarChar(255) },
      requesterPhone: { column: 'RequesterPhone', type: sql.NVarChar(50) },

      // Supplier Information
      companyName: { column: 'CompanyName', type: sql.NVarChar(255) },
      tradingName: { column: 'TradingName', type: sql.NVarChar(255) },
      supplierType: { column: 'SupplierType', type: sql.NVarChar(50) },
      crn: { column: 'CRN', type: sql.NVarChar(20) },
      crnVerified: { column: 'CRNVerified', type: sql.Bit },
      charityNumber: { column: 'CharityNumber', type: sql.NVarChar(20) },
      vatNumber: { column: 'VATNumber', type: sql.NVarChar(20) },

      // Supplier Address
      registeredAddress: { column: 'RegisteredAddress', type: sql.NVarChar(500) },
      city: { column: 'City', type: sql.NVarChar(100) },
      postcode: { column: 'Postcode', type: sql.NVarChar(20) },
      country: { column: 'Country', type: sql.NVarChar(100) },

      // Supplier Contact
      contactName: { column: 'ContactName', type: sql.NVarChar(200) },
      contactEmail: { column: 'ContactEmail', type: sql.NVarChar(255) },
      contactPhone: { column: 'ContactPhone', type: sql.NVarChar(50) },

      // Bank Details
      bankName: { column: 'BankName', type: sql.NVarChar(100) },
      sortCode: { column: 'SortCode', type: sql.NVarChar(10) },
      accountNumber: { column: 'AccountNumber', type: sql.NVarChar(20) },
      accountName: { column: 'AccountName', type: sql.NVarChar(200) },
      iban: { column: 'IBAN', type: sql.NVarChar(50) },
      swiftCode: { column: 'SwiftCode', type: sql.NVarChar(20) },

      // Contract Information
      serviceDescription: { column: 'ServiceDescription', type: sql.NVarChar(sql.MAX) },
      contractValue: { column: 'ContractValue', type: sql.Decimal(18, 2) },
      paymentTerms: { column: 'PaymentTerms', type: sql.NVarChar(100) },

      // Full Form Data (JSON)
      formDataJSON: { column: 'FormDataJSON', type: sql.NVarChar(sql.MAX) },

      // Review Data (JSON fields)
      pbpReviewData: { column: 'PBPReviewData', type: sql.NVarChar(sql.MAX) },
      pbpApprovedBy: { column: 'PBPApprovedBy', type: sql.NVarChar(255) },
      pbpComments: { column: 'PBPComments', type: sql.NVarChar(sql.MAX) },

      procurementReviewData: { column: 'ProcurementReviewData', type: sql.NVarChar(sql.MAX) },
      procurementDecision: { column: 'ProcurementDecision', type: sql.NVarChar(50) },
      procurementApprovedBy: { column: 'ProcurementApprovedBy', type: sql.NVarChar(255) },

      opwReviewData: { column: 'OPWReviewData', type: sql.NVarChar(sql.MAX) },
      opwDecision: { column: 'OPWDecision', type: sql.NVarChar(50) },
      opwApprovedBy: { column: 'OPWApprovedBy', type: sql.NVarChar(255) },
      ir35Determination: { column: 'IR35Determination', type: sql.NVarChar(50) },
      outcomeRoute: { column: 'OutcomeRoute', type: sql.NVarChar(50) },

      contractReviewData: { column: 'ContractReviewData', type: sql.NVarChar(sql.MAX) },
      contractUploadedBy: { column: 'ContractUploadedBy', type: sql.NVarChar(255) },

      apReviewData: { column: 'APReviewData', type: sql.NVarChar(sql.MAX) },
      apApprovedBy: { column: 'APApprovedBy', type: sql.NVarChar(255) },
      vendorNumber: { column: 'VendorNumber', type: sql.NVarChar(50) },

      // External References
      alembaReference: { column: 'AlembaReference', type: sql.NVarChar(50) },
      v1Reference: { column: 'V1Reference', type: sql.NVarChar(50) },

      // Flags
      supplierConnection: { column: 'SupplierConnection', type: sql.Bit },
      connectionDetails: { column: 'ConnectionDetails', type: sql.NVarChar(sql.MAX) },
      isDuplicateFlagged: { column: 'IsDuplicateFlagged', type: sql.Bit },
      duplicateCheckResult: { column: 'DuplicateCheckResult', type: sql.NVarChar(sql.MAX) }
    };

    // Add all provided fields to update
    for (const [key, value] of Object.entries(data)) {
      if (fieldMappings[key] && value !== undefined) {
        const mapping = fieldMappings[key];
        const paramName = `Param_${key}`;
        updates.push(`${mapping.column} = @${paramName}`);
        request.input(paramName, mapping.type, value);
      }
    }

    // Always update the timestamp
    updates.push('UpdatedAt = GETDATE()');

    if (updates.length > 1) { // More than just UpdatedAt
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
      newStatus: data.status || existing.Status,
      details: Object.keys(data)
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
      'ap': ['pending_ap_control', 'contract_uploaded'],
      'sds_issued': ['inside_ir35_sds_issued'],
    };

    const statuses = stageStatusMap[stage] || [];

    if (statuses.length === 0) {
      return [];
    }

    // Build parameterized query to prevent SQL injection
    const request = pool.request();
    const placeholders = statuses.map((status, index) => {
      const paramName = `status${index}`;
      request.input(paramName, sql.NVarChar(50), status);
      return `@${paramName}`;
    }).join(',');

    const result = await request
      .input('CurrentStage', sql.NVarChar(50), stage)
      .query(`
        SELECT SubmissionID, DisplayReference, Status, CurrentStage,
               CompanyName, RequesterFirstName, RequesterLastName,
               RequesterEmail, CreatedAt, UpdatedAt
        FROM Submissions
        WHERE Status IN (${placeholders})
          AND CurrentStage = @CurrentStage
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
