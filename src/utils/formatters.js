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
