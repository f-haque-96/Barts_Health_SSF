/**
 * Server-Side Validation Middleware
 * Using express-validator for request validation
 * CRITICAL: Never trust client-side validation alone
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Custom sanitizer to remove HTML tags
 * Prevents XSS by stripping all HTML/script tags from user input
 */
const sanitizeHTML = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, ''); // Remove all HTML tags
};

/**
 * Middleware to handle validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for submission creation
 */
const validateSubmissionCreate = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/).withMessage('First name contains invalid characters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/).withMessage('Last name contains invalid characters'),

  body('jobTitle')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty().withMessage('Job title is required')
    .isLength({ max: 100 }).withMessage('Job title must not exceed 100 characters'),

  body('department')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty().withMessage('Department is required')
    .isLength({ max: 100 }).withMessage('Department must not exceed 100 characters'),

  body('nhsEmail')
    .trim()
    .isEmail().withMessage('Invalid email address')
    .matches(/@(nhs\.net|nhs\.uk|bartshealth\.nhs\.uk|nhs\.scot|wales\.nhs\.uk)$/).withMessage('Email must be an NHS email address'),

  body('phoneNumber')
    .trim()
    .matches(/^[+]?[0-9 ()-]{7,15}$/).withMessage('Invalid UK phone number'),

  body('companyName')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ max: 255 }).withMessage('Company name must not exceed 255 characters'),

  validate
];

/**
 * Validation rules for submission update
 */
const validateSubmissionUpdate = [
  param('id')
    .matches(/^SUP-\d{4}-[0-9A-Fa-f]{8}$/).withMessage('Invalid submission ID format'),

  body('status')
    .optional()
    .isIn(['pending_review', 'approved', 'rejected', 'pending_procurement_review', 'pending_opw_review', 'pending_contract', 'pending_ap_control', 'completed'])
    .withMessage('Invalid status value'),

  body('currentStage')
    .optional()
    .isIn(['pbp', 'procurement', 'opw', 'contract', 'ap'])
    .withMessage('Invalid current stage value'),

  body('companyName')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ max: 255 }).withMessage('Company name must not exceed 255 characters'),

  body('crn')
    .optional()
    .matches(/^[0-9]{8}$/).withMessage('CRN must be 8 digits'),

  body('vatNumber')
    .optional()
    .matches(/^(GB)?[0-9]{9,12}$/).withMessage('Invalid VAT number format'),

  body('contractValue')
    .optional()
    .isDecimal().withMessage('Contract value must be a valid decimal number'),

  validate
];

/**
 * Validation rules for document upload
 */
const validateDocumentUpload = [
  param('submissionId')
    .matches(/^SUP-\d{4}-[0-9A-Fa-f]{8}$/).withMessage('Invalid submission ID format'),

  body('documentType')
    .notEmpty().withMessage('Document type is required')
    .isIn([
      'passport', 'driving_licence', 'identity_document',
      'vat_certificate', 'company_registration', 'insurance_certificate',
      'bank_letter', 'signed_contract', 'purchase_order', 'quote', 'other'
    ]).withMessage('Invalid document type'),

  validate
];

/**
 * Validation rules for CRN lookup
 */
const validateCRNLookup = [
  param('crn')
    .matches(/^[0-9]{7,8}$/).withMessage('CRN must be 7 or 8 digits'),

  validate
];

/**
 * Validation rules for vendor duplicate check
 */
const validateVendorCheck = [
  query('companyName')
    .notEmpty().withMessage('Company name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Company name must be between 2 and 255 characters'),

  query('vatNumber')
    .optional()
    .matches(/^(GB)?[0-9]{9,12}$/).withMessage('Invalid VAT number format'),

  validate
];

module.exports = {
  validate,
  validateSubmissionCreate,
  validateSubmissionUpdate,
  validateDocumentUpload,
  validateCRNLookup,
  validateVendorCheck
};
