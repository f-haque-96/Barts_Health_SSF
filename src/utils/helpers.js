/**
 * Helper Functions
 * Utility functions for formatting, validation, etc.
 */

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format phone number as user types
 */
export const formatPhoneNumber = (value) => {
  // Remove all non-numeric characters except + at start
  let cleaned = value.replace(/[^0-9+]/g, '');

  // Ensure + only appears at the start
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    cleaned = '+' + parts.filter((p) => p).join('');
  }

  return cleaned;
};

/**
 * Format postcode to uppercase
 */
export const formatPostcode = (value) => {
  return value.toUpperCase().replace(/\s+/g, ' ').trim();
};

/**
 * Validate and format CRN
 */
export const formatCRN = (value) => {
  // Remove all non-alphanumeric characters
  let cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Pad with leading zero if 7 digits
  if (cleaned.length === 7 && /^\d+$/.test(cleaned)) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
};

/**
 * Generate unique submission ID
 */
export const generateSubmissionId = (prefix = 'SUB') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Format currency value
 */
export const formatCurrency = (value) => {
  if (!value) return '';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value) => {
  if (!value) return 0;
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format date for input[type="date"]
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * Check if date is in the past
 */
export const isDateInPast = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Sanitize input (basic)
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<[^>]*>/g, '');
};

/**
 * Get query parameter from URL
 */
export const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

/**
 * Scroll to first error
 */
export const scrollToFirstError = () => {
  const firstError = document.querySelector('.error-message, .form-control.error');
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Try to focus the associated input
    const input = firstError.previousElementSibling || firstError.closest('.form-group')?.querySelector('input, select, textarea');
    input?.focus();
  }
};

/**
 * Live Validation Functions
 * Return error message string if invalid, null if valid
 */
export const validators = {
  required: (value) => !value?.trim() ? 'This field is required' : null,

  email: (value) => {
    if (!value) return null;
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Please enter a valid email address' : null;
  },

  nhsEmail: (value) => {
    if (!value) return null;
    return !value.endsWith('@nhs.net') ? 'Must be an NHS email address (@nhs.net)' : null;
  },

  phone: (value) => {
    if (!value) return null;
    return !/^[\d\s\+\-()]{7,15}$/.test(value) ? 'Please enter a valid phone number' : null;
  },

  postcode: (value) => {
    if (!value) return null;
    return !/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value) ? 'Please enter a valid UK postcode' : null;
  },

  crn: (value) => {
    if (!value) return null;
    return !/^\d{7,8}$/.test(value) ? 'CRN must be 7-8 digits' : null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    return value.length > max ? `Maximum ${max} characters allowed` : null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    return value.length < min ? `Minimum ${min} characters required` : null;
  },

  combine: (...validatorFns) => (value) => {
    for (const validator of validatorFns) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  },
};

/**
 * Financial Field Validators
 * Specific validators for banking and tax-related fields
 */
export const financialValidators = {
  iban: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\s/g, '').toUpperCase();

    // Must be 15-34 characters
    if (cleaned.length < 15 || cleaned.length > 34) {
      return 'IBAN must be between 15 and 34 characters';
    }

    // Must start with 2-letter country code
    if (!/^[A-Z]{2}/.test(cleaned)) {
      return 'IBAN must start with a 2-letter country code (e.g., GB)';
    }

    // Must contain alphanumeric characters only
    if (!/^[A-Z]{2}[0-9A-Z]+$/.test(cleaned)) {
      return 'IBAN must contain only letters and numbers';
    }

    return null;
  },

  swiftBic: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\s/g, '').toUpperCase();

    // Must be exactly 8 or 11 characters
    if (cleaned.length !== 8 && cleaned.length !== 11) {
      return 'SWIFT/BIC code must be 8 or 11 characters (format: AAAABBCCXXX)';
    }

    // Format: 4 letters (bank) + 2 letters (country) + 2 alphanumeric (location) + optional 3 alphanumeric (branch)
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
      return 'Invalid SWIFT/BIC format. Should be: 4 letters (bank) + 2 letters (country) + 2 chars (location) + optional 3 chars (branch)';
    }

    return null;
  },

  sortCode: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/[\s-]/g, '');

    // Must be exactly 6 digits
    if (!/^[0-9]{6}$/.test(cleaned)) {
      return 'UK Sort Code must be exactly 6 digits (e.g., 12-34-56)';
    }

    return null;
  },

  accountNumber: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\s/g, '');

    // Must be exactly 8 digits
    if (!/^[0-9]{8}$/.test(cleaned)) {
      return 'UK Account Number must be exactly 8 digits';
    }

    return null;
  },

  vatNumber: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\s/g, '').toUpperCase();

    // Check if it starts with GB (optional)
    const withoutGB = cleaned.startsWith('GB') ? cleaned.slice(2) : cleaned;

    // Must be 9 or 12 digits after removing GB prefix
    if (!/^[0-9]{9}$/.test(withoutGB) && !/^[0-9]{12}$/.test(withoutGB)) {
      return 'UK VAT Number must be 9 or 12 digits (GB prefix optional, e.g., GB123456789)';
    }

    return null;
  },

  utrNumber: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\s/g, '');

    // Must be exactly 10 digits
    if (!/^[0-9]{10}$/.test(cleaned)) {
      return 'UTR (Unique Taxpayer Reference) must be exactly 10 digits';
    }

    return null;
  },

  dunsNumber: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/[\s-]/g, '');

    // Must be exactly 9 digits
    if (!/^[0-9]{9}$/.test(cleaned)) {
      return 'DUNS number must be exactly 9 digits';
    }

    return null;
  },

  routingNumber: (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\s/g, '');

    // Must be exactly 9 digits (US routing number)
    if (!/^[0-9]{9}$/.test(cleaned)) {
      return 'Bank Routing Number must be exactly 9 digits';
    }

    return null;
  },
};

/**
 * Auto-format helpers for financial fields
 */
export const formatSortCode = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/[\s-]/g, '');

  // Add dashes after every 2 digits (12-34-56)
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 6)}`;
};

export const formatIBAN = (value) => {
  if (!value) return '';
  // Remove all spaces and convert to uppercase
  const cleaned = value.replace(/\s/g, '').toUpperCase();

  // Add space every 4 characters for readability
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
};

export const formatAccountNumber = (value) => {
  if (!value) return '';
  // Remove all non-digits and limit to 8 characters
  return value.replace(/\D/g, '').slice(0, 8);
};

export const formatSwiftBic = (value) => {
  if (!value) return '';
  // Remove spaces and convert to uppercase, limit to 11 characters
  return value.replace(/\s/g, '').toUpperCase().slice(0, 11);
};

/**
 * =============================================================================
 * FUZZY MATCHING UTILITIES
 * Used to detect potential duplicate suppliers and flag for review
 * =============================================================================
 */

/**
 * Calculate Levenshtein distance between two strings
 * This measures how many single-character edits are needed to transform one string into another
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
export const levenshteinDistance = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
};

/**
 * Calculate similarity score between two strings (0-100)
 * Higher score = more similar
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity percentage (0-100)
 */
export const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 100;

  const distance = levenshteinDistance(s1, s2);
  return Math.round((1 - distance / maxLength) * 100);
};

/**
 * Normalize company name for comparison
 * Removes common suffixes and standardizes format
 * @param {string} name - Company name
 * @returns {string} - Normalized name
 */
export const normalizeCompanyName = (name) => {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Remove common company suffixes
    .replace(/\b(ltd|limited|plc|llp|inc|incorporated|corp|corporation|uk|group)\b/gi, '')
    // Remove special characters
    .replace(/[^a-z0-9\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Check if two company names are potentially the same
 * Uses fuzzy matching with a threshold
 * @param {string} name1 - First company name
 * @param {string} name2 - Second company name
 * @param {number} threshold - Similarity threshold (default 80%)
 * @returns {object} - { isMatch: boolean, similarity: number, normalized: { name1, name2 } }
 */
export const fuzzyMatchCompanyNames = (name1, name2, threshold = 80) => {
  const norm1 = normalizeCompanyName(name1);
  const norm2 = normalizeCompanyName(name2);

  const similarity = calculateSimilarity(norm1, norm2);

  return {
    isMatch: similarity >= threshold,
    similarity,
    normalized: { name1: norm1, name2: norm2 },
    original: { name1, name2 }
  };
};

/**
 * Find potential duplicate suppliers from a list
 * @param {string} newSupplierName - Name of new supplier being added
 * @param {Array} existingSuppliers - Array of existing supplier objects with 'name' property
 * @param {number} threshold - Similarity threshold (default 75%)
 * @returns {Array} - Array of potential matches with similarity scores
 */
export const findPotentialDuplicates = (newSupplierName, existingSuppliers, threshold = 75) => {
  if (!newSupplierName || !existingSuppliers || existingSuppliers.length === 0) {
    return [];
  }

  const potentialMatches = [];

  for (const supplier of existingSuppliers) {
    const supplierName = supplier.name || supplier.companyName || supplier.supplierName;
    if (!supplierName) continue;

    const result = fuzzyMatchCompanyNames(newSupplierName, supplierName, threshold);

    if (result.isMatch) {
      potentialMatches.push({
        ...result,
        existingSupplier: supplier,
        flagReason: result.similarity >= 95
          ? 'EXACT_MATCH'
          : result.similarity >= 85
            ? 'HIGH_SIMILARITY'
            : 'POTENTIAL_MATCH'
      });
    }
  }

  // Sort by similarity (highest first)
  return potentialMatches.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Check supplier against blocklist/watchlist
 * @param {string} supplierName - Supplier name to check
 * @param {Array} watchlist - Array of names to watch for
 * @returns {object} - { flagged: boolean, matches: Array }
 */
export const checkSupplierWatchlist = (supplierName, watchlist = []) => {
  if (!supplierName || !watchlist.length) {
    return { flagged: false, matches: [] };
  }

  const matches = findPotentialDuplicates(supplierName,
    watchlist.map(name => ({ name })),
    70 // Lower threshold for watchlist
  );

  return {
    flagged: matches.length > 0,
    matches,
    highestSimilarity: matches.length > 0 ? matches[0].similarity : 0
  };
};
