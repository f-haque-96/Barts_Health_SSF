/**
 * API Routes Index
 * Main router that combines all route modules
 * Updated: February 2026 - Self-approval prevention & validation enhancements
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth, devBypassAuth } = require('../middleware/auth');
const { requireRole, canAccessSubmission } = require('../middleware/rbac');
const {
  validateSubmissionCreate,
  validateSubmissionUpdate,
  validateDocumentUpload,
  validateCRNLookup,
  validateVendorCheck
} = require('../middleware/validation');
const { validateFile } = require('../utils/fileValidation');
const submissionService = require('../services/submissionService');
const { logAudit, getAuditTrail } = require('../services/auditService');
const documentService = require('../services/documentService');
const sharePointService = require('../services/sharePointService');
const logger = require('../config/logger');

// Configure multer for file uploads (memory storage for SharePoint upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// ===========================================
// SESSION ROUTES
// ===========================================

/**
 * GET /api/session
 * Get current user session info
 */
router.get('/session', requireAuth, (req, res) => {
  res.json({
    user: {
      email: req.user.email,
      name: req.user.name,
      groups: req.user.groups || []
    }
  });
});

// ===========================================
// SUBMISSION ROUTES
// ===========================================

/**
 * POST /api/submissions
 * Create new submission
 */
router.post('/submissions', requireAuth, validateSubmissionCreate, async (req, res, next) => {
  try {
    const result = await submissionService.create(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/submissions/:id
 * Get submission by ID (with auth check)
 */
router.get('/submissions/:id', requireAuth, canAccessSubmission, async (req, res, next) => {
  try {
    const submission = await submissionService.getById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Submission not found' });
    }
    res.json(submission);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/submissions/:id
 * Update submission
 */
router.put('/submissions/:id', requireAuth, validateSubmissionUpdate, canAccessSubmission, async (req, res, next) => {
  try {
    const result = await submissionService.update(req.params.id, req.body, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ===========================================
// REVIEW ROUTES
// ===========================================

/**
 * GET /api/reviews/:stage/queue
 * Get work queue for a review stage
 * SECURITY: Role enforcement added for each stage
 */
router.get('/reviews/:stage/queue', requireAuth, (req, res, next) => {
  const { stage } = req.params;

  // Map stage to required role and enforce it
  const stageRoles = {
    'pbp': 'pbp',
    'procurement': 'procurement',
    'opw': 'opw',
    'contract': 'contract',
    'ap': 'apControl'
  };

  const requiredRole = stageRoles[stage];
  if (!requiredRole) {
    return res.status(400).json({ error: 'Invalid stage' });
  }

  // Apply role enforcement middleware dynamically
  requireRole(requiredRole)(req, res, next);
}, async (req, res, next) => {
  try {
    const { stage } = req.params;
    const queue = await submissionService.getWorkQueue(stage, req.user);
    res.json(queue);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reviews/:stage/:id
 * Submit review decision
 * SECURITY: Requires role for the specific stage. Requester cannot self-approve.
 */
router.post('/reviews/:stage/:id', requireAuth, async (req, res, next) => {
  try {
    const { stage, id } = req.params;
    const { decision, comments, signature } = req.body;

    // --- Validate stage param ---
    const validStages = ['pbp', 'procurement', 'opw', 'contract', 'ap'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid review stage' });
    }

    // --- Validate decision param ---
    const validDecisions = ['approved', 'rejected', 'info_required'];
    if (!decision || !validDecisions.includes(decision)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid decision value' });
    }

    // --- Enforce reviewer role (NOT canAccessSubmission) ---
    const stageRoles = {
      'pbp': 'pbp',
      'procurement': 'procurement',
      'opw': 'opw',
      'contract': 'contract',
      'ap': 'apControl'
    };
    const { ROLE_GROUPS } = require('../middleware/rbac');
    const userGroups = req.user.groups || [];
    const allowedGroups = ROLE_GROUPS[stageRoles[stage]] || [];
    const hasReviewerRole = userGroups.some(g => allowedGroups.includes(g));

    if (!hasReviewerRole) {
      logger.warn(`Unauthorized review attempt: ${req.user.email} tried ${stage} review without role`);
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'You do not have permission to review at this stage'
      });
    }

    // --- Prevent self-approval: reviewer must not be the requester ---
    const submission = await submissionService.getById(id);
    if (!submission) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Submission not found' });
    }

    if (submission.RequesterEmail?.toLowerCase() === req.user.email?.toLowerCase()) {
      logger.warn(`Self-approval blocked: ${req.user.email} tried to review own submission ${id}`);
      return res.status(403).json({
        error: 'CONFLICT_OF_INTEREST',
        message: 'You cannot review your own submission'
      });
    }

    // Update submission with review data
    const updateData = {
      [`${stage}ReviewData`]: JSON.stringify({
        decision,
        comments,
        signature,
        reviewedBy: req.user.email,
        reviewedAt: new Date().toISOString()
      })
    };

    // Update status based on decision
    if (decision === 'approved') {
      const nextStages = {
        'pbp': 'procurement',
        'procurement': 'opw',
        'opw': 'contract',
        'contract': 'ap',
        'ap': 'completed'
      };
      updateData.currentStage = nextStages[stage] || stage;
      updateData.status = `${stage}_approved`;
    } else if (decision === 'rejected') {
      updateData.status = 'rejected';
    } else if (decision === 'info_required') {
      updateData.status = 'info_required';
    }

    await submissionService.update(id, updateData, req.user);

    // Log audit
    await logAudit({
      submissionId: id,
      action: `${stage.toUpperCase()}_REVIEW_${decision.toUpperCase()}`,
      user: req.user.email,
      newStatus: updateData.status
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// AUDIT ROUTES
// ===========================================

/**
 * GET /api/audit/:id
 * Get audit trail for submission
 */
router.get('/audit/:id', requireAuth, canAccessSubmission, async (req, res, next) => {
  try {
    const trail = await getAuditTrail(req.params.id);
    res.json(trail);
  } catch (error) {
    next(error);
  }
});

// ===========================================
// UTILITIES ROUTES
// ===========================================

/**
 * GET /api/companies-house/:crn
 * Proxy Companies House lookup (keeps API key server-side)
 * SECURITY: Requires authentication in production, bypassed in dev mode
 */
router.get('/companies-house/:crn', devBypassAuth, validateCRNLookup, async (req, res, next) => {
  try {
    const { crn } = req.params;
    const apiKey = process.env.CH_API_KEY;

    const response = await fetch(
      `${process.env.CH_API_URL}/company/${crn}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Company not found' });
      }
      throw new Error('Companies House API error');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/vendors/check
 * Check for duplicate vendors
 */
router.get('/vendors/check', requireAuth, validateVendorCheck, async (req, res, next) => {
  try {
    const { companyName, vatNumber, crn } = req.query;

    // Call stored procedure to check for duplicates
    const pool = require('../config/database').getPool();
    const result = await pool.request()
      .input('CompanyName', require('../config/database').sql.NVarChar(255), companyName)
      .input('VATNumber', require('../config/database').sql.NVarChar(20), vatNumber || null)
      .input('CRN', require('../config/database').sql.NVarChar(20), crn || null)
      .execute('dbo.CheckDuplicateVendor');

    const matches = result.recordset;
    const isDuplicate = matches.length > 0;

    res.json({
      isDuplicate,
      matches: matches.map(m => ({
        vendorNumber: m.VendorNumber,
        companyName: m.CompanyName,
        crn: m.CRN,
        vatNumber: m.VATNumber,
        matchType: m.MatchType
      }))
    });
  } catch (error) {
    next(error);
  }
});

// ===========================================
// DOCUMENT ROUTES
// ===========================================

/**
 * POST /api/documents/:submissionId
 * Upload document to SharePoint and save metadata
 */
router.post('/documents/:submissionId', requireAuth, validateDocumentUpload, canAccessSubmission, upload.single('file'), async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!documentType) {
      return res.status(400).json({ error: 'Document type required' });
    }

    // Validate file type using magic numbers (prevents MIME type spoofing)
    const fileValidation = validateFile(req.file, { maxSize: 10 * 1024 * 1024 });
    if (!fileValidation.isValid) {
      return res.status(400).json({
        error: 'INVALID_FILE',
        message: fileValidation.error
      });
    }

    // Upload to SharePoint
    const spResult = await sharePointService.uploadDocument(
      submissionId,
      documentType,
      req.file,
      req.user
    );

    // Save metadata to database
    const docResult = await documentService.saveDocumentMetadata({
      submissionId,
      documentType,
      fileName: req.file.originalname,
      sharePointPath: spResult.sharePointPath
    }, req.user);

    res.status(201).json({
      documentId: docResult.documentId,
      fileName: req.file.originalname,
      sharePointPath: spResult.sharePointPath,
      library: spResult.library,
      isSensitive: documentService.isSensitiveDocument(documentType),
      canSyncToAlemba: documentService.canSyncToAlemba(documentType)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:submissionId
 * Get all documents for a submission
 */
router.get('/documents/:submissionId', requireAuth, canAccessSubmission, async (req, res, next) => {
  try {
    const documents = await documentService.getDocumentsBySubmission(req.params.submissionId);
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:submissionId/alemba-eligible
 * Get documents that can be synced to Alemba (non-sensitive only)
 */
router.get('/documents/:submissionId/alemba-eligible', requireAuth, canAccessSubmission, async (req, res, next) => {
  try {
    const documents = await documentService.getAlembaEligibleDocuments(req.params.submissionId);
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/documents/:documentId
 * Delete a document
 * SECURITY: Ownership check added - user must have access to parent submission
 */
router.delete('/documents/:documentId', requireAuth, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    // Get document to find its submission ID
    const document = await documentService.getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Document not found' });
    }

    // Check if user has access to the submission this document belongs to
    const submission = await submissionService.getById(document.SubmissionID);

    if (!submission) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Parent submission not found' });
    }

    // Perform authorization check using same logic as canAccessSubmission middleware
    const user = req.user;
    const { ROLE_GROUPS } = require('../middleware/rbac');

    // Admins can access everything
    const isAdmin = (user.groups || []).some(g => ROLE_GROUPS.admin.includes(g));

    // Check if user is the owner
    const isOwner = submission.RequesterEmail?.toLowerCase() === user.email?.toLowerCase();

    // Check stage-based access
    const stage = submission.CurrentStage?.toLowerCase();
    const userGroups = user.groups || [];
    const stageRoleMap = {
      'pbp': ROLE_GROUPS.pbp,
      'procurement': ROLE_GROUPS.procurement,
      'opw': ROLE_GROUPS.opw,
      'contract': ROLE_GROUPS.contract,
      'ap_control': ROLE_GROUPS.apControl,
      'ap': ROLE_GROUPS.apControl
    };
    const allowedGroups = stageRoleMap[stage] || [];
    const hasStageAccess = userGroups.some(g => allowedGroups.includes(g));

    if (!isAdmin && !isOwner && !hasStageAccess) {
      logger.warn(`Unauthorized document deletion attempt: ${user.email} tried to delete document ${documentId}`);
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'You do not have permission to delete this document'
      });
    }

    const result = await documentService.deleteDocument(documentId, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/document-types
 * Get available document types with governance info
 */
router.get('/document-types', requireAuth, (req, res) => {
  res.json(documentService.DOCUMENT_TYPES);
});

// ===========================================
// CONTRACT ROUTES
// ===========================================

/**
 * POST /api/contracts/:submissionId/send-to-supplier
 * Send contract agreement template to supplier (State A -> State B)
 */
router.post('/contracts/:submissionId/send-to-supplier', requireAuth, requireRole('contract'), async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { templateName, instructions } = req.body;

    // Validate inputs
    if (!templateName || !instructions) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Template name and instructions are required'
      });
    }

    // Get submission
    const submission = await submissionService.getById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Submission not found' });
    }

    // Check if already sent
    if (submission.ContractReviewData && JSON.parse(submission.ContractReviewData).sentAt) {
      return res.status(400).json({
        error: 'INVALID_STATE',
        message: 'Agreement already sent to supplier'
      });
    }

    // Update submission with contract data
    const contractData = {
      sentAt: new Date().toISOString(),
      sentBy: req.user.email,
      templateUsed: templateName,
      instructions: instructions.trim()
    };

    await submissionService.update(submissionId, {
      ContractReviewData: JSON.stringify(contractData),
      CurrentStage: 'contract'
    }, req.user);

    // Log audit
    await logAudit({
      submissionId,
      action: 'CONTRACT_SENT',
      user: req.user.email,
      details: { templateName }
    });

    // In production, trigger notification email via Power Automate
    // Power Automate monitors ContractReviewData changes

    res.json({
      success: true,
      sentAt: contractData.sentAt
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/contracts/:submissionId/approve
 * Approve contract and forward to AP Control (State B -> State C)
 */
router.post('/contracts/:submissionId/approve', requireAuth, requireRole('contract'), async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { digitalSignature, comments, finalAgreement } = req.body;

    // Validate inputs
    if (!digitalSignature || !comments || !finalAgreement) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Digital signature, comments, and final agreement are required'
      });
    }

    // Get submission
    const submission = await submissionService.getById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Submission not found' });
    }

    // Check if agreement was sent
    const existingData = submission.ContractReviewData ? JSON.parse(submission.ContractReviewData) : {};
    if (!existingData.sentAt) {
      return res.status(400).json({
        error: 'INVALID_STATE',
        message: 'Agreement must be sent before approval'
      });
    }

    // Check if already approved
    if (existingData.decision) {
      return res.status(400).json({
        error: 'INVALID_STATE',
        message: 'Contract already decided'
      });
    }

    // Update submission with approval data
    const updatedContractData = {
      ...existingData,
      decision: 'approved',
      decidedBy: req.user.email,
      decidedAt: new Date().toISOString(),
      digitalSignature: digitalSignature.trim(),
      signedAt: new Date().toISOString(),
      approvalComments: comments.trim(),
      finalizedAgreement: finalAgreement
    };

    await submissionService.update(submissionId, {
      ContractReviewData: JSON.stringify(updatedContractData),
      CurrentStage: 'ap',
      Status: 'contract_approved'
    }, req.user);

    // Log audit
    await logAudit({
      submissionId,
      action: 'CONTRACT_APPROVED',
      user: req.user.email,
      newStatus: 'contract_approved'
    });

    // In production, trigger notification emails via Power Automate
    // Power Automate monitors ContractReviewData changes

    res.json({
      success: true,
      approvedAt: updatedContractData.decidedAt
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
