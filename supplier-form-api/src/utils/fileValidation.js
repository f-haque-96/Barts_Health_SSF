/**
 * File Type Validation Using Magic Numbers (File Signatures)
 * CRITICAL: Prevents MIME type spoofing attacks
 *
 * Magic numbers are the first few bytes of a file that identify the file type.
 * This is more secure than relying on MIME types or file extensions alone.
 */

/**
 * File type signatures (magic numbers)
 * First few bytes that identify each file type
 */
const FILE_SIGNATURES = {
  // PDF
  'pdf': [
    [0x25, 0x50, 0x44, 0x46] // %PDF
  ],
  // JPEG
  'jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0], // JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // Exif
    [0xFF, 0xD8, 0xFF, 0xE2]  // JPEG
  ],
  // PNG
  'png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  ],
  // Microsoft Word (.doc)
  'doc': [
    [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
  ],
  // Microsoft Word (.docx) - ZIP-based
  'docx': [
    [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP file)
    [0x50, 0x4B, 0x05, 0x06], // PK.. (ZIP file, empty archive)
    [0x50, 0x4B, 0x07, 0x08]  // PK.. (ZIP file, spanned archive)
  ]
};

/**
 * MIME type to file signature mapping
 */
const MIME_TO_SIGNATURE = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

/**
 * Check if buffer starts with given signature
 */
function matchesSignature(buffer, signature) {
  if (buffer.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Validate file type using magic numbers
 *
 * @param {Buffer} fileBuffer - File buffer to validate
 * @param {string} declaredMimeType - MIME type declared by client
 * @returns {Object} - { isValid: boolean, actualType: string|null, error: string|null }
 */
function validateFileType(fileBuffer, declaredMimeType) {
  if (!Buffer.isBuffer(fileBuffer)) {
    return {
      isValid: false,
      actualType: null,
      error: 'Invalid file buffer'
    };
  }

  if (fileBuffer.length === 0) {
    return {
      isValid: false,
      actualType: null,
      error: 'Empty file'
    };
  }

  // Get expected file type from MIME type
  const expectedType = MIME_TO_SIGNATURE[declaredMimeType];

  if (!expectedType) {
    return {
      isValid: false,
      actualType: null,
      error: `Unsupported MIME type: ${declaredMimeType}`
    };
  }

  // Check if file matches the declared type
  const signatures = FILE_SIGNATURES[expectedType];
  const matchesExpected = signatures.some(sig => matchesSignature(fileBuffer, sig));

  if (matchesExpected) {
    return {
      isValid: true,
      actualType: expectedType,
      error: null
    };
  }

  // File doesn't match declared type - check what it actually is
  let actualType = null;
  for (const [type, sigs] of Object.entries(FILE_SIGNATURES)) {
    if (sigs.some(sig => matchesSignature(fileBuffer, sig))) {
      actualType = type;
      break;
    }
  }

  return {
    isValid: false,
    actualType,
    error: `File type mismatch: declared as ${declaredMimeType} but appears to be ${actualType || 'unknown'}`
  };
}

/**
 * Validate file size
 *
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
function validateFileSize(fileSize, maxSize = 10 * 1024 * 1024) {
  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: `File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Comprehensive file validation
 * Validates both magic numbers and file size
 */
function validateFile(file, options = {}) {
  const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default

  // Validate file size
  const sizeValidation = validateFileSize(file.size, maxSize);
  if (!sizeValidation.isValid) {
    return {
      isValid: false,
      error: sizeValidation.error
    };
  }

  // Validate file type using magic numbers
  const typeValidation = validateFileType(file.buffer, file.mimetype);
  if (!typeValidation.isValid) {
    return {
      isValid: false,
      error: typeValidation.error
    };
  }

  return {
    isValid: true,
    validatedType: typeValidation.actualType,
    error: null
  };
}

module.exports = {
  validateFileType,
  validateFileSize,
  validateFile
};
