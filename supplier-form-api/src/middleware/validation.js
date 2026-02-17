/**
 * Server-Side Validation Middleware
 * Using express-validator for request validation
 * CRITICAL: Never trust client-side validation alone
 *
 * AUDIT FIXES:
 * - C2: Unicode name validation (\p{L} instead of ASCII [a-zA-Z])
 * - M6: HTML sanitizer replaced with sanitize-html (TODO: install sanitize-html in production)
 * - M3: City validation allows apostrophes, periods, digits (Bishop's Stortford, St. Albans)
 * - H1: Comprehensive server-side validation for all form sections
 * - M8: Review comment length limits (5000 chars)
 */

const { body, param, query, validationResult } = require('express-validator');

// M6: Use sanitize-html for proper XSS prevention if available, fallback to regex
let sanitizeHtml;
try {
  sanitizeHtml = require('sanitize-html');
} catch {
  // Fallback: sanitize-html not yet installed - use improved regex sanitizer
  sanitizeHtml = null;
}

/**
 * Custom sanitizer to remove HTML tags
 * M6: Uses sanitize-html if available, otherwise falls back to entity encoding
 */
const sanitizeHTML = (value) => {
  if (typeof value !== 'string') return value;

  if (sanitizeHtml) {
    // Production: use sanitize-html with strict whitelist (no tags allowed)
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'recursiveEscape',
    });
  }

  // Fallback: escape HTML entities (safer than regex stripping)
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
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
 * C2: Uses Unicode-aware regex \p{L} for international name support
 */
const validateSubmissionCreate = [
  body('firstName')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters')
    .matches(/^[\p{L}\s\-']+$/u).withMessage('First name contains invalid characters'),

  body('lastName')
    .trim()
    .customSanitizer(sanitizeHTML)
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters')
    .matches(/^[\p{L}\s\-']+$/u).withMessage('Last name contains invalid characters'),

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
    .isIn(['pending_review', 'approved', 'rejected', 'pending_procurement_review', 'pending_opw_review', 'pending_contract', 'pending_ap_control', 'completed', 'Completed_Payroll', 'inside_ir35_sds_issued', 'sds_appeal', 'info_required', 'pbp_approved', 'procurement_approved_opw', 'opw_complete', 'contract_uploaded'])
    .withMessage('Invalid status value'),

  body('currentStage')
    .optional()
    .isIn(['pbp', 'procurement', 'opw', 'contract', 'ap', 'completed', 'completed_payroll', 'sds_issued'])
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
 * H1: Comprehensive validation for complete form submission
 * Validates all fields across Sections 2-7 that bypass basic create validation
 */
const validateSubmissionComplete = [
  // Section 2: Pre-screening
  body('formData.serviceCategory')
    .optional()
    .isIn(['clinical', 'non-clinical']).withMessage('Invalid service category'),

  body('formData.procurementEngaged')
    .optional()
    .isIn(['yes', 'no']).withMessage('Invalid procurement engagement value'),

  body('formData.justification')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ min: 10, max: 350 }).withMessage('Justification must be between 10 and 350 characters'),

  // Section 3: Classification
  body('formData.companiesHouseRegistered')
    .optional()
    .isIn(['yes', 'no']).withMessage('Invalid Companies House registration value'),

  body('formData.supplierType')
    .optional()
    .isIn(['limited_company', 'partnership', 'charity', 'sole_trader', 'public_sector'])
    .withMessage('Invalid supplier type'),

  body('formData.crn')
    .optional()
    .matches(/^[0-9]{7,8}$/).withMessage('CRN must be 7 or 8 digits'),

  body('formData.charityNumber')
    .optional()
    .isLength({ max: 8 }).withMessage('Charity number must not exceed 8 characters'),

  body('formData.annualValue')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Annual value must be a positive number'),

  // Section 4: Supplier Details
  body('formData.companyName')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ max: 100 }).withMessage('Company name must not exceed 100 characters'),

  body('formData.contactName')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ max: 100 }).withMessage('Contact name must not exceed 100 characters')
    .matches(/^[\p{L}\s\-']+$/u).withMessage('Contact name contains invalid characters'),

  body('formData.contactEmail')
    .optional()
    .isEmail().withMessage('Invalid contact email'),

  body('formData.contactPhone')
    .optional()
    .matches(/^[+]?[0-9 ()-]{7,15}$/).withMessage('Invalid contact phone number'),

  // M3: City validation allows apostrophes, periods, digits
  body('formData.city')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('City must not exceed 50 characters')
    .matches(/^[\p{L}\s\-'.0-9]+$/u).withMessage('City contains invalid characters'),

  // M4: GDS-recommended UK postcode regex (covers BFPO, GIR 0AA, all standard formats)
  body('formData.postcode')
    .optional()
    .matches(/^(GIR\s?0AA|[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}|BFPO\s?[0-9]{1,4})$/i)
    .withMessage('Invalid UK postcode format'),

  // Section 5: Service Description
  body('formData.serviceDescription')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ min: 10, max: 350 }).withMessage('Service description must be between 10 and 350 characters'),

  // Section 6: Financial Info
  body('formData.overseasSupplier')
    .optional()
    .isIn(['yes', 'no']).withMessage('Invalid overseas supplier value'),

  body('formData.sortCode')
    .optional()
    .matches(/^[0-9\s-]{6,8}$/).withMessage('Invalid sort code format'),

  body('formData.accountNumber')
    .optional()
    .matches(/^[0-9]{8}$/).withMessage('Account number must be 8 digits'),

  body('formData.iban')
    .optional()
    .matches(/^[A-Z]{2}[0-9A-Z\s]{13,32}$/i).withMessage('Invalid IBAN format'),

  body('formData.swiftCode')
    .optional()
    .matches(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i)
    .withMessage('Invalid SWIFT/BIC code format'),

  body('formData.vatNumber')
    .optional()
    .matches(/^(GB)?[0-9]{9,12}$/).withMessage('Invalid VAT number format'),

  body('formData.utrNumber')
    .optional()
    .matches(/^[0-9\s]{10,13}$/).withMessage('UTR must be 10 digits'),

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
      'bank_letter', 'signed_contract', 'purchase_order', 'quote',
      'letterhead', 'procurement_approval', 'cest_form', 'other'
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

/**
 * M8: Validation for review comments (5000 character limit)
 */
const validateReviewComment = [
  body('comments')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ max: 5000 }).withMessage('Review comments must not exceed 5,000 characters'),

  body('rationale')
    .optional()
    .trim()
    .customSanitizer(sanitizeHTML)
    .isLength({ max: 5000 }).withMessage('Rationale must not exceed 5,000 characters'),

  validate
];

module.exports = {
  validate,
  sanitizeHTML,
  validateSubmissionCreate,
  validateSubmissionUpdate,
  validateSubmissionComplete,
  validateDocumentUpload,
  validateCRNLookup,
  validateVendorCheck,
  validateReviewComment
};
