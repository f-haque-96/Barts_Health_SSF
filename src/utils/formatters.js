/**
 * Formatters for capitalisation and display values
 * Used across review pages and PDF generation
 */

/**
 * Capitalise first letter of a string
 */
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Capitalise first letter of each word
 * Handles hyphenated, underscored, and space-separated words
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format yes/no values consistently
 */
export const formatYesNo = (value) => {
  if (value === null || value === undefined || value === '') return 'Not specified';
  const lower = value.toString().toLowerCase();
  if (lower === 'yes' || lower === 'true') return 'Yes';
  if (lower === 'no' || lower === 'false') return 'No';
  return capitalizeFirst(value);
};

/**
 * Format any field value with appropriate capitalisation
 * Handles various patterns: yes/no, hyphenated, underscored, etc.
 */
export const formatFieldValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Not specified';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  const str = value.toString();

  // Handle common yes/no patterns
  const lower = str.toLowerCase();
  if (lower === 'yes' || lower === 'true') return 'Yes';
  if (lower === 'no' || lower === 'false') return 'No';

  // Handle hyphenated or underscored values (e.g., "public-sector", "sole_trader")
  if (str.includes('-') || str.includes('_')) {
    return capitalizeWords(str);
  }

  // For simple strings, just capitalise first letter
  return capitalizeFirst(str);
};

/**
 * Format supplier type for display
 * Converts values like "sole_trader", "public-sector" to uppercase display format
 */
export const formatSupplierType = (value) => {
  if (!value) return 'Not specified';
  const mappings = {
    'limited_company': 'LIMITED COMPANY',
    'limited-company': 'LIMITED COMPANY',
    'charity': 'CHARITY',
    'sole_trader': 'SOLE TRADER',
    'sole-trader': 'SOLE TRADER',
    'individual': 'INDIVIDUAL / SOLE TRADER',
    'public_sector': 'PUBLIC SECTOR',
    'public-sector': 'PUBLIC SECTOR',
    'partnership': 'PARTNERSHIP',
    'llp': 'LIMITED LIABILITY PARTNERSHIP (LLP)',
  };
  const lower = value.toLowerCase();
  return mappings[lower] || value.replace(/[-_]/g, ' ').toUpperCase();
};

/**
 * Format service category for display
 */
export const formatServiceCategory = (value) => {
  if (!value) return 'Not specified';
  // Handle special cases
  const mappings = {
    'clinical': 'Clinical',
    'non-clinical': 'Non-Clinical',
    'non_clinical': 'Non-Clinical',
    'nonclinical': 'Non-Clinical',
  };
  const lower = value.toLowerCase();
  return mappings[lower] || capitalizeWords(value);
};

/**
 * Format usage frequency for display
 */
export const formatUsageFrequency = (value) => {
  if (!value) return 'Not specified';
  const mappings = {
    'one_time': 'One Time',
    'one-time': 'One Time',
    'onetime': 'One Time',
    'occasional': 'Occasional',
    'regular': 'Regular',
    'ongoing': 'Ongoing',
  };
  const lower = value.toLowerCase();
  return mappings[lower] || capitalizeWords(value);
};

/**
 * Format service types array for display
 * Takes an array of service types and capitalises each one
 * e.g., ["goods", "services", "consultancy"] → "Goods, Services, Consultancy"
 */
export const formatServiceTypes = (types) => {
  if (!types || !Array.isArray(types) || types.length === 0) return 'Not specified';
  return types.map(type => capitalizeFirst(type)).join(', ');
};

/**
 * Format organisation type for display
 * Maps stored values to their proper display labels (preserving acronyms like NHS)
 */
export const formatOrganisationType = (value) => {
  if (!value) return 'Not specified';
  const mappings = {
    'nhs': 'NHS Organisation',
    'local_authority': 'Local Authority',
    'government': 'Government Department',
    'education': 'Educational Institution',
    'other': 'Other Public Sector',
  };
  const lower = value.toLowerCase();
  return mappings[lower] || value;
};

/**
 * Format employee count with range description
 */
export const formatEmployeeCount = (value) => {
  if (!value) return 'Not specified';
  const mappings = {
    'micro': 'Micro (1-9 employees)',
    'small': 'Small (10-49 employees)',
    'medium': 'Medium (50-249 employees)',
    'large': 'Large (250+ employees)',
  };
  const lower = value.toLowerCase();
  return mappings[lower] || value;
};

/**
 * Format submission status for display with human-readable labels
 * Handles all pipeline states including terminal states
 */
export const formatSubmissionStatus = (status) => {
  if (!status) return 'Unknown';
  const mappings = {
    'pending_review': 'Pending Review',
    'pending_pbp_review': 'Pending PBP Review',
    'info_required': 'Information Required',
    'pbp_approved': 'PBP Approved',
    'pending_procurement_review': 'Pending Procurement Review',
    'procurement_approved': 'Procurement Approved',
    'procurement_approved_opw': 'Routed to OPW Panel',
    'pending_opw_review': 'Pending OPW Review',
    'opw_approved': 'OPW Approved',
    'Pending_Contract': 'Pending Contract',
    'pending_contract': 'Pending Contract',
    'opw_complete': 'OPW Complete',
    'contract_uploaded': 'Contract Uploaded',
    'Pending_AP': 'Pending AP Control',
    'pending_ap_control': 'Pending AP Control',
    // Terminal states
    'completed': 'Completed \u2014 Oracle/AP',
    'Completed_Payroll': 'Completed \u2014 Payroll/ESR Route',
    'completed_payroll': 'Completed \u2014 Payroll/ESR Route',
    'inside_ir35_sds_issued': 'SDS Issued \u2014 Awaiting Response',
    'sds_issued': 'SDS Issued \u2014 Awaiting Response',
    'sds_appeal': 'SDS Appeal \u2014 Under Reconsideration',
    'rejected': 'Rejected',
  };
  return mappings[status] || status;
};

/**
 * Format current stage for display
 */
export const formatCurrentStage = (stage) => {
  if (!stage) return 'Unknown';
  const mappings = {
    'pbp': 'PBP Review',
    'procurement': 'Procurement Review',
    'opw': 'OPW Panel Review',
    'contract': 'Contract Drafter',
    'ap': 'AP Control',
    'completed': 'Completed \u2014 Oracle/AP',
    'completed_payroll': 'Completed \u2014 Payroll/ESR',
    'sds_issued': 'SDS Issued \u2014 Awaiting Response',
    'Completed': 'Completed',
  };
  return mappings[stage] || stage;
};

/**
 * Format OPW determination labels for display
 */
export const formatDetermination = (determination) => {
  if (!determination) return 'Not determined';
  const mappings = {
    'outside_ir35': 'Outside IR35 (Consultancy Agreement)',
    'outside': 'Outside IR35 (Consultancy Agreement)',
    'inside_ir35': 'Inside IR35 (Payroll/ESR Route)',
    'inside': 'Inside IR35 (Payroll/ESR Route)',
    'self_employed': 'Self-Employed (Sole Trader Agreement)',
    'employed': 'Employed (Payroll/ESR Route)',
    'rejected': 'Rejected',
  };
  return mappings[determination] || determination;
};
