/**
 * Contract Negotiation Service
 * Centralized logic for contract workflow management
 * Simplified for offline email-based negotiation workflow
 */

import { ROLE_GROUPS, ROLES } from '../context/AuthContext';

export const contractNegotiationService = {
  /**
   * Get appropriate agreement template based on OPW determination
   * @param {string} determination - 'outside_ir35', 'self_employed', 'outside', or legacy 'inside_ir35'
   * @returns {object} Template information
   */
  getAgreementTemplate(determination) {
    const templates = {
      outside_ir35: {
        name: 'Barts Consultancy Agreement',
        filename: 'BartsConsultancyAgreement.1.2.docx',
        version: '1.2',
        description: 'For intermediaries outside IR35 (Consultancy Agreement)',
        path: '/templates/BartsConsultancyAgreement.1.2.docx',
      },
      outside: {
        name: 'Barts Consultancy Agreement',
        filename: 'BartsConsultancyAgreement.1.2.docx',
        version: '1.2',
        description: 'For intermediaries outside IR35 (Consultancy Agreement)',
        path: '/templates/BartsConsultancyAgreement.1.2.docx',
      },
      self_employed: {
        name: 'Sole Trader Agreement',
        filename: 'Sole Trader Agreement latest version 22.docx',
        version: '22',
        description: 'For self-employed sole traders (Sole Trader Agreement)',
        path: '/templates/Sole Trader Agreement latest version 22.docx',
      },
      // Legacy key - kept for backwards compatibility
      inside_ir35: {
        name: 'Sole Trader Agreement',
        filename: 'Sole Trader Agreement latest version 22.docx',
        version: '22',
        description: 'For self-employed sole traders (Sole Trader Agreement)',
        path: '/templates/Sole Trader Agreement latest version 22.docx',
      },
    };
    return templates[determination] || null;
  },

  /**
   * Validate signed contract upload
   * @param {File} file - Uploaded file object
   * @returns {object} Validation result with valid boolean and error message
   */
  validateSignedContract(file) {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only PDF or DOCX files allowed' };
    }

    // 10MB limit
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be under 10MB' };
    }

    return { valid: true };
  },

  /**
   * Check if contract stage is required for this submission
   * @param {object} submission - Submission object
   * @returns {boolean} Whether contract stage is needed
   */
  requiresContractStage(submission) {
    // Skip for standard suppliers
    if (submission.procurementReview?.classification === 'standard') {
      return false;
    }

    // Required for IR35 cases (both inside and outside)
    if (submission.opwReview?.ir35Status) {
      return true;
    }

    // Required if procurement marked as needing contract review
    if (submission.procurementReview?.requiresContract) {
      return true;
    }

    return false;
  },

  /**
   * Check if user can approve/reject contract
   * @param {object} submission - Submission object
   * @param {object} user - Current user object
   * @returns {boolean} Whether user has permission
   */
  canApproveContract(submission, user) {
    const userGroups = user.groups || [];
    // H5: Use ROLE_GROUPS constant instead of hardcoded AD group strings
    const contractGroups = ROLE_GROUPS[ROLES.CONTRACT] || [];
    const isContract = userGroups.some(g => contractGroups.includes(g));
    if (!isContract) return false;
    if (!submission.contractDrafter?.sentAt) return false;
    if (submission.contractDrafter?.decision) return false;
    return true;
  },
};

export default contractNegotiationService;
