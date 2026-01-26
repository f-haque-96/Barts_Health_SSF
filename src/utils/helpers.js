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
