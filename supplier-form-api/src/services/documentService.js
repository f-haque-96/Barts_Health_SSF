/**
 * Document Service
 * Handles document metadata and governance rules
 * Updated: Feb 2026 - Added letterhead, procurement_approval, cest_form types
 */

const { getPool, sql } = require('../config/database');
const { logAudit } = require('./auditService');
const logger = require('../config/logger');

// Document types with governance rules
const DOCUMENT_TYPES = {
  // Sensitive - NEVER sync to Alemba
  PASSPORT: { id: 'passport', label: 'Passport', isSensitive: true, allowAlembaSync: false },
  DRIVING_LICENCE: { id: 'driving_licence', label: 'Driving Licence', isSensitive: true, allowAlembaSync: false },
  IDENTITY_DOCUMENT: { id: 'identity_document', label: 'Identity Document', isSensitive: true, allowAlembaSync: false },

  // Business documents - CAN sync to Alemba
  VAT_CERTIFICATE: { id: 'vat_certificate', label: 'VAT Certificate', isSensitive: false, allowAlembaSync: true },
  COMPANY_REGISTRATION: { id: 'company_registration', label: 'Company Registration', isSensitive: false, allowAlembaSync: true },
  INSURANCE_CERTIFICATE: { id: 'insurance_certificate', label: 'Insurance Certificate', isSensitive: false, allowAlembaSync: true },
  BANK_LETTER: { id: 'bank_letter', label: 'Bank Confirmation Letter', isSensitive: false, allowAlembaSync: true },
  SIGNED_CONTRACT: { id: 'signed_contract', label: 'Signed Contract', isSensitive: false, allowAlembaSync: true },
  PURCHASE_ORDER: { id: 'purchase_order', label: 'Purchase Order', isSensitive: false, allowAlembaSync: true },
  QUOTE: { id: 'quote', label: 'Quote/Estimate', isSensitive: false, allowAlembaSync: true },
  OTHER: { id: 'other', label: 'Other Document', isSensitive: false, allowAlembaSync: true },

  // Form upload types (used by frontend file uploads)
  LETTERHEAD: { id: 'letterhead', label: 'Letterhead with Bank Details', isSensitive: false, allowAlembaSync: true },
  PROCUREMENT_APPROVAL: { id: 'procurement_approval', label: 'Procurement Approval', isSensitive: false, allowAlembaSync: true },
  CEST_FORM: { id: 'cest_form', label: 'CEST Form (IR35)', isSensitive: true, allowAlembaSync: false },
};

/**
 * Check if document type can be synced to Alemba
 */
function canSyncToAlemba(documentType) {
  const docType = DOCUMENT_TYPES[documentType?.toUpperCase()];
  return docType ? docType.allowAlembaSync : false;
}

/**
 * Check if document is sensitive (requires special handling)
 */
function isSensitiveDocument(documentType) {
  const docType = DOCUMENT_TYPES[documentType?.toUpperCase()];
  return docType ? docType.isSensitive : false;
}

/**
 * Get appropriate SharePoint library for document type
 */
function getSharePointLibrary(documentType) {
  return isSensitiveDocument(documentType) ? 'SensitiveDocuments' : 'SupplierDocuments';
}

/**
 * Save document metadata to database
 */
async function saveDocumentMetadata(documentData, user) {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input('SubmissionID', sql.NVarChar(50), documentData.submissionId)
      .input('DocumentType', sql.NVarChar(50), documentData.documentType)
      .input('FileName', sql.NVarChar(255), documentData.fileName)
      .input('SharePointPath', sql.NVarChar(500), documentData.sharePointPath)
      .input('SharePointLibrary', sql.NVarChar(100), getSharePointLibrary(documentData.documentType))
      .input('IsSensitive', sql.Bit, isSensitiveDocument(documentData.documentType) ? 1 : 0)
      .input('AllowAlembaSync', sql.Bit, canSyncToAlemba(documentData.documentType) ? 1 : 0)
      .input('UploadedBy', sql.NVarChar(255), user.email)
      .query(`
        INSERT INTO SubmissionDocuments (
          SubmissionID, DocumentType, FileName, SharePointPath,
          SharePointLibrary, IsSensitive, AllowAlembaSync, UploadedBy
        )
        OUTPUT INSERTED.DocumentID
        VALUES (
          @SubmissionID, @DocumentType, @FileName, @SharePointPath,
          @SharePointLibrary, @IsSensitive, @AllowAlembaSync, @UploadedBy
        )
      `);

    const documentId = result.recordset[0].DocumentID;

    // Log audit
    await logAudit({
      submissionId: documentData.submissionId,
      action: 'DOCUMENT_UPLOADED',
      user: user.email,
      details: {
        documentId,
        documentType: documentData.documentType,
        fileName: documentData.fileName,
        isSensitive: isSensitiveDocument(documentData.documentType)
      }
    });

    return { documentId };
  } catch (error) {
    logger.error('Failed to save document metadata:', error);
    throw error;
  }
}

/**
 * Get document by ID
 */
async function getDocumentById(documentId) {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input('DocumentID', sql.Int, documentId)
      .query(`
        SELECT DocumentID, SubmissionID, DocumentType, FileName, SharePointPath,
               SharePointLibrary, IsSensitive, AllowAlembaSync,
               UploadedBy, UploadedAt
        FROM SubmissionDocuments
        WHERE DocumentID = @DocumentID
      `);

    return result.recordset[0];
  } catch (error) {
    logger.error('Failed to get document by ID:', error);
    throw error;
  }
}

/**
 * Get documents for a submission
 */
async function getDocumentsBySubmission(submissionId) {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input('SubmissionID', sql.NVarChar(50), submissionId)
      .query(`
        SELECT DocumentID, DocumentType, FileName, SharePointPath,
               SharePointLibrary, IsSensitive, AllowAlembaSync,
               UploadedBy, UploadedAt
        FROM SubmissionDocuments
        WHERE SubmissionID = @SubmissionID
        ORDER BY UploadedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    logger.error('Failed to get documents:', error);
    throw error;
  }
}

/**
 * Get documents eligible for Alemba sync
 */
async function getAlembaEligibleDocuments(submissionId) {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input('SubmissionID', sql.NVarChar(50), submissionId)
      .query(`
        SELECT DocumentID, DocumentType, FileName, SharePointPath
        FROM SubmissionDocuments
        WHERE SubmissionID = @SubmissionID
          AND AllowAlembaSync = 1
          AND IsSensitive = 0
        ORDER BY UploadedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    logger.error('Failed to get Alemba eligible documents:', error);
    throw error;
  }
}

/**
 * Delete document metadata
 */
async function deleteDocument(documentId, user) {
  try {
    const pool = getPool();

    // Get document info first for audit
    const docResult = await pool.request()
      .input('DocumentID', sql.Int, documentId)
      .query('SELECT * FROM SubmissionDocuments WHERE DocumentID = @DocumentID');

    const document = docResult.recordset[0];
    if (!document) {
      throw new Error('Document not found');
    }

    await pool.request()
      .input('DocumentID', sql.Int, documentId)
      .query('DELETE FROM SubmissionDocuments WHERE DocumentID = @DocumentID');

    // Log audit
    await logAudit({
      submissionId: document.SubmissionID,
      action: 'DOCUMENT_DELETED',
      user: user.email,
      details: {
        documentId,
        documentType: document.DocumentType,
        fileName: document.FileName
      }
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to delete document:', error);
    throw error;
  }
}

module.exports = {
  DOCUMENT_TYPES,
  canSyncToAlemba,
  isSensitiveDocument,
  getSharePointLibrary,
  saveDocumentMetadata,
  getDocumentById,
  getDocumentsBySubmission,
  getAlembaEligibleDocuments,
  deleteDocument
};
