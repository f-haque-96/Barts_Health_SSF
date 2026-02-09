/**
 * Contract Negotiation Service
 * Centralized logic for contract workflow management
 */

export const contractNegotiationService = {
  /**
   * Get appropriate agreement template based on IR35 status
   * @param {string} ir35Status - 'outside_ir35' or 'inside_ir35'
   * @returns {object} Template information
   */
  getAgreementTemplate(ir35Status) {
    const templates = {
      outside_ir35: {
        name: 'Barts Consultancy Agreement',
        filename: 'BartsConsultancyAgreement.1.2.docx',
        version: '1.2',
        description: 'For suppliers outside IR35',
        path: '/templates/BartsConsultancyAgreement.1.2.docx',
      },
      inside_ir35: {
        name: 'Sole Trader Agreement',
        filename: 'Sole Trader Agreement latest version 22.docx',
        version: '22',
        description: 'For suppliers inside IR35',
        path: '/templates/Sole Trader Agreement latest version 22.docx',
      },
    };
    return templates[ir35Status] || null;
  },

  /**
   * Create new contract exchange entry
   * @param {object} params - Exchange parameters
   * @returns {object} Formatted exchange entry
   */
  createContractExchange({ type, from, fromName, message, attachments = [], decision = null }) {
    return {
      id: `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type, // 'contract_request', 'supplier_response', 'contract_approved', 'changes_requested'
      from, // 'contract_drafter', 'supplier', 'requester'
      fromName,
      message,
      attachments,
      decision,
      timestamp: new Date().toISOString(),
    };
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
   * Determine contract status from submission data
   * @param {object} submission - Submission object
   * @returns {string} Status: 'not_required', 'pending', 'sent', 'negotiating', 'approved', 'rejected'
   */
  getContractStatus(submission) {
    if (!this.requiresContractStage(submission)) {
      return 'not_required';
    }

    const contractData = submission.contractDrafter;
    if (!contractData) {
      return 'pending';
    }

    if (contractData.decision === 'approved') {
      return 'approved';
    }

    if (contractData.decision === 'rejected') {
      return 'rejected';
    }

    if (contractData.exchanges && contractData.exchanges.length > 0) {
      return 'negotiating';
    }

    if (contractData.status === 'sent') {
      return 'sent';
    }

    return 'pending';
  },

  /**
   * Format contract exchange for display
   * @param {object} exchange - Exchange object
   * @returns {object} Formatted exchange with display properties
   */
  formatExchangeForDisplay(exchange) {
    const typeLabels = {
      contract_request: 'Agreement Sent',
      supplier_response: 'Supplier Response',
      changes_requested: 'Changes Requested',
      contract_approved: 'Contract Approved',
      contract_rejected: 'Contract Rejected',
    };

    const badgeColors = {
      contract_drafter: { bg: '#059669', text: 'white', label: 'CONTRACT DRAFTER' },
      supplier: { bg: '#3b82f6', text: 'white', label: 'SUPPLIER' },
      requester: { bg: '#ca8a04', text: 'white', label: 'REQUESTER' },
    };

    return {
      ...exchange,
      typeLabel: typeLabels[exchange.type] || exchange.type,
      badge: badgeColors[exchange.from] || { bg: '#94a3b8', text: 'white', label: 'UNKNOWN' },
      formattedDate: new Date(exchange.timestamp).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  },

  /**
   * Check if user can approve/reject contract
   * @param {object} submission - Submission object
   * @param {object} user - Current user object
   * @returns {boolean} Whether user has permission
   */
  canApproveContract(submission, user) {
    // Only contract drafter can approve
    if (!user.roles?.includes('contract') && !user.roles?.includes('admin')) {
      return false;
    }

    // Must have exchanges (supplier must have responded)
    if (!submission.contractDrafter?.exchanges?.length) {
      return false;
    }

    // Must not already be decided
    if (submission.contractDrafter?.decision) {
      return false;
    }

    return true;
  },
};

export default contractNegotiationService;
