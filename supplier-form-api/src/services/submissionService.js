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
 * H2: Validate and sanitise FormDataJSON before storage
 * Enforces size limits and sanitises all string values
 */
function validateFormDataJSON(jsonString) {
  if (!jsonString) return jsonString;

  // Size limit: 500KB maximum
  const MAX_JSON_SIZE = 500 * 1024;
  if (typeof jsonString === 'string' && Buffer.byteLength(jsonString, 'utf8') > MAX_JSON_SIZE) {
    throw new Error('FormDataJSON exceeds maximum size of 500KB');
  }

  // Parse and sanitise all string values
  let parsed;
  try {
    parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch {
    throw new Error('FormDataJSON is not valid JSON');
  }

  // Recursively sanitise all string values
  function sanitiseStrings(obj) {
    if (typeof obj === 'string') {
      return obj
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (Array.isArray(obj)) return obj.map(sanitiseStrings);
    if (obj && typeof obj === 'object') {
      const clean = {};
      for (const [key, value] of Object.entries(obj)) {
        clean[key] = sanitiseStrings(value);
      }
      return clean;
    }
    return obj;
  }

  const sanitised = sanitiseStrings(parsed);
  return JSON.stringify(sanitised);
}

/**
 * Update submission
 * H3: Uses SQL transaction to ensure atomicity of update + audit log
 */
async function update(id, data, user) {
  const pool = getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const existing = await getById(id);

    if (!existing) {
      await transaction.rollback();
      throw new Error('Submission not found');
    }

    // H2: Validate FormDataJSON if present
    if (data.formDataJSON) {
      data.formDataJSON = validateFormDataJSON(data.formDataJSON);
    }

    // Build dynamic update query based on provided fields
    const updates = [];
    const request = new sql.Request(transaction)
      .input('SubmissionID', sql.NVarChar(50), id);

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

    // L8: Use GETUTCDATE() for timezone consistency
    updates.push('UpdatedAt = GETUTCDATE()');

    if (updates.length > 1) { // More than just UpdatedAt
      await request.query(`
        UPDATE Submissions
        SET ${updates.join(', ')}
        WHERE SubmissionID = @SubmissionID
      `);
    }

    // H3: Audit log is inside the same transaction - both succeed or both rollback
    const auditRequest = new sql.Request(transaction);
    await auditRequest
      .input('AuditSubmissionID', sql.NVarChar(50), id)
      .input('Action', sql.NVarChar(100), 'SUBMISSION_UPDATED')
      .input('PerformedBy', sql.NVarChar(255), user.email)
      .input('PreviousStatus', sql.NVarChar(50), existing.Status)
      .input('NewStatus', sql.NVarChar(50), data.status || existing.Status)
      .input('Details', sql.NVarChar(sql.MAX), JSON.stringify(Object.keys(data)))
      .query(`
        INSERT INTO AuditTrail (SubmissionID, ActionType, PerformedBy, PreviousStatus, NewStatus, ActionDetails)
        VALUES (@AuditSubmissionID, @Action, @PerformedBy, @PreviousStatus, @NewStatus, @Details)
      `);

    await transaction.commit();
    return { success: true };
  } catch (error) {
    // H3: Rollback on any failure
    try { await transaction.rollback(); } catch { /* already rolled back */ }
    logger.error('Failed to update submission:', error);
    throw error;
  }
}

/**
 * Get work queue for a review stage
 * H6: Paginated with configurable page size (default 25, max 100)
 */
async function getWorkQueue(stage, user, { page = 1, pageSize = 25 } = {}) {
  try {
    const pool = getPool();

    // H6: Enforce pagination limits
    const sanitisedPage = Math.max(1, parseInt(page) || 1);
    const sanitisedPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 25));
    const offset = (sanitisedPage - 1) * sanitisedPageSize;

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
      return { items: [], total: 0, page: sanitisedPage, pageSize: sanitisedPageSize };
    }

    // Build parameterized query to prevent SQL injection
    const request = pool.request();
    const placeholders = statuses.map((status, index) => {
      const paramName = `status${index}`;
      request.input(paramName, sql.NVarChar(50), status);
      return `@${paramName}`;
    }).join(',');

    // H6: Get total count and paginated results
    const result = await request
      .input('CurrentStage', sql.NVarChar(50), stage)
      .input('Offset', sql.Int, offset)
      .input('PageSize', sql.Int, sanitisedPageSize)
      .query(`
        SELECT COUNT(*) AS TotalCount
        FROM Submissions
        WHERE Status IN (${placeholders})
          AND CurrentStage = @CurrentStage;

        SELECT SubmissionID, DisplayReference, Status, CurrentStage,
               CompanyName, RequesterFirstName, RequesterLastName,
               RequesterEmail, CreatedAt, UpdatedAt
        FROM Submissions
        WHERE Status IN (${placeholders})
          AND CurrentStage = @CurrentStage
        ORDER BY CreatedAt ASC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
      `);

    const total = result.recordsets[0][0]?.TotalCount || 0;
    const items = result.recordsets[1] || [];

    return {
      items,
      total,
      page: sanitisedPage,
      pageSize: sanitisedPageSize,
      totalPages: Math.ceil(total / sanitisedPageSize),
    };
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
