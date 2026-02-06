/**
 * API Integration Module
 * Handles all communication with Power Automate flows and backend services
 * SECURITY: Includes CSRF token handling for all state-changing requests
 */

// API Endpoints - Configure in .env.production
const API_ENDPOINTS = {
  submitPBP: import.meta.env.VITE_API_SUBMIT_PBP,
  pbpDecision: import.meta.env.VITE_API_PBP_DECISION,
  submitForm: import.meta.env.VITE_API_SUBMIT_FORM,
  getSubmission: import.meta.env.VITE_API_GET_SUBMISSION,
  procurementDecision: import.meta.env.VITE_API_PROCUREMENT_DECISION,
  owpDecision: import.meta.env.VITE_API_OPW_DECISION,
  apComplete: import.meta.env.VITE_API_AP_COMPLETE,
  uploadDocument: import.meta.env.VITE_API_UPLOAD_DOCUMENT,
  verifyCRN: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/VerifyCRN` : null,
  csrfToken: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/csrf-token` : null,
};

// CSRF Token Cache
let csrfToken = null;
let csrfTokenPromise = null;

/**
 * Check if backend is configured
 */
export const isBackendConfigured = () => {
  return Boolean(API_ENDPOINTS.submitPBP || API_ENDPOINTS.submitForm);
};

/**
 * Fetch CSRF token from backend
 * SECURITY: Required for all state-changing requests (POST/PUT/DELETE)
 */
export const fetchCSRFToken = async () => {
  // If we already have a token fetch in progress, wait for it
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // If we already have a cached token, return it
  if (csrfToken) {
    return csrfToken;
  }

  // No token endpoint configured (development/mock mode)
  if (!API_ENDPOINTS.csrfToken) {
    return null;
  }

  // Fetch new token
  csrfTokenPromise = fetch(API_ENDPOINTS.csrfToken, {
    credentials: 'include', // Include cookies
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      csrfToken = data.csrfToken;
      csrfTokenPromise = null;
      return csrfToken;
    })
    .catch(error => {
      console.error('CSRF token fetch failed:', error);
      csrfTokenPromise = null;
      return null;
    });

  return csrfTokenPromise;
};

/**
 * Clear cached CSRF token (call this on 403 errors to refresh)
 */
export const clearCSRFToken = () => {
  csrfToken = null;
  csrfTokenPromise = null;
};

/**
 * Generic API call handler with CSRF protection
 * SECURITY: Automatically includes CSRF token in all state-changing requests
 */
const apiCall = async (endpoint, data, options = {}) => {
  if (!endpoint) {
    return mockApiResponse(options.mockType, data);
  }

  try {
    // Get CSRF token for state-changing requests
    const method = options.method || 'POST';
    let headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const token = await fetchCSRFToken();
      if (token) {
        headers['X-CSRF-Token'] = token;
      }
    }

    const response = await fetch(endpoint, {
      method,
      headers,
      credentials: 'include', // Include cookies for CSRF
      body: JSON.stringify(data),
    });

    // If we get a 403, the CSRF token might be invalid - clear it and retry once
    if (response.status === 403 && csrfToken) {
      console.warn('CSRF token rejected, refreshing and retrying...');
      clearCSRFToken();
      const newToken = await fetchCSRFToken();
      if (newToken) {
        headers['X-CSRF-Token'] = newToken;
        const retryResponse = await fetch(endpoint, {
          method,
          headers,
          credentials: 'include',
          body: JSON.stringify(data),
        });

        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          throw new Error(`API Error: ${retryResponse.status} - ${errorText}`);
        }

        return await retryResponse.json();
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

/**
 * Mock API responses for development/testing
 */
const mockApiResponse = (type, data) => {
  const submissionId = `SUP-${new Date().getFullYear()}-${Math.random().toString().substr(2, 5)}`;

  switch (type) {
    case 'submitPBP':
      return Promise.resolve({
        success: true,
        submissionId,
        message: 'Questionnaire submitted for PBP review (MOCK)',
        mockMode: true,
      });
    case 'submitForm':
      return Promise.resolve({
        success: true,
        submissionId: data.submissionId || submissionId,
        message: 'Form submitted successfully (MOCK)',
        mockMode: true,
      });
    case 'getSubmission':
      return Promise.resolve({
        success: true,
        submission: JSON.parse(localStorage.getItem(`submission_${data.submissionId}`) || '{}'),
        mockMode: true,
      });
    case 'decision':
      return Promise.resolve({
        success: true,
        message: 'Decision recorded (MOCK)',
        mockMode: true,
      });
    default:
      return Promise.resolve({
        success: true,
        message: 'Operation completed (MOCK)',
        mockMode: true,
      });
  }
};

// ============================================================================
// PBP (Pre-Buy Panel) API Functions
// ============================================================================

/**
 * Submit Section 2 questionnaire for PBP review
 * Called when user completes Section 2 pre-screening
 */
export const submitPBPQuestionnaire = async (formData) => {
  const payload = {
    requesterName: formData.requesterName,
    requesterEmail: formData.nhsEmail,
    requesterDepartment: formData.department,
    requesterPhone: formData.phoneNumber,
    questionnaireData: {
      // Section 1 data
      requesterName: formData.requesterName,
      nhsEmail: formData.nhsEmail,
      department: formData.department,
      phoneNumber: formData.phoneNumber,
      // Section 2 data
      purchaseJustification: formData.purchaseJustification,
      alternativesConsidered: formData.alternativesConsidered,
      budgetConfirmed: formData.budgetConfirmed,
      estimatedValue: formData.estimatedValue,
      supplierConnection: formData.supplierConnection,
      connectionDetails: formData.connectionDetails,
      urgencyReason: formData.urgencyReason,
      // Any other pre-screening fields
    },
    submittedAt: new Date().toISOString(),
  };

  return apiCall(API_ENDPOINTS.submitPBP, payload, { mockType: 'submitPBP' });
};

/**
 * Submit PBP panel decision
 * Called from PBP review page
 */
export const submitPBPDecision = async (submissionId, decision, reviewerData) => {
  const payload = {
    submissionId,
    decision, // 'Approved', 'Rejected', 'MoreInfoRequested'
    reviewerName: reviewerData.name,
    reviewerEmail: reviewerData.email,
    comments: reviewerData.comments,
    moreInfoRequest: reviewerData.moreInfoRequest,
    decidedAt: new Date().toISOString(),
  };

  return apiCall(API_ENDPOINTS.pbpDecision, payload, { mockType: 'decision' });
};

// ============================================================================
// Full Form Submission API Functions
// ============================================================================

/**
 * Submit complete supplier form (after PBP approval)
 * Called from Section 7 when user submits final form
 */
export const submitSupplierForm = async (submissionId, formData, uploadedFiles) => {
  const payload = {
    submissionId,
    formData: {
      // Section 1: Requester Info
      requesterName: formData.requesterName,
      nhsEmail: formData.nhsEmail,
      department: formData.department,
      phoneNumber: formData.phoneNumber,

      // Section 2: Pre-Screening (already submitted to PBP)
      purchaseJustification: formData.purchaseJustification,
      alternativesConsidered: formData.alternativesConsidered,
      budgetConfirmed: formData.budgetConfirmed,
      estimatedValue: formData.estimatedValue,
      supplierConnection: formData.supplierConnection,
      connectionDetails: formData.connectionDetails,
      pbpApprovalCertificate: formData.pbpApprovalCertificate,

      // Section 3: Classification
      companiesHouseRegistered: formData.companiesHouseRegistered,
      supplierType: formData.supplierType,
      crn: formData.crn,
      crnVerification: formData.crnVerification,
      charityNumber: formData.charityNumber,
      organisationType: formData.organisationType,

      // Section 4: Supplier Details
      companyName: formData.companyName,
      tradingName: formData.tradingName,
      registeredAddress: formData.registeredAddress,
      city: formData.city,
      postcode: formData.postcode,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      website: formData.website,

      // Section 5: Service Description
      serviceDescription: formData.serviceDescription,
      serviceCategory: formData.serviceCategory,
      serviceTypes: formData.serviceTypes,

      // Section 6: Financial Info
      overseasSupplier: formData.overseasSupplier,
      bankName: formData.bankName,
      sortCode: formData.sortCode,
      accountNumber: formData.accountNumber,
      iban: formData.iban,
      swiftCode: formData.swiftCode,
      contractValue: formData.contractValue,
      paymentTerms: formData.paymentTerms,
      letterheadAvailable: formData.letterheadAvailable,

      // Section 7: Acknowledgements
      dataAccuracyConfirmed: formData.dataAccuracyConfirmed,
      termsAccepted: formData.termsAccepted,
    },
    uploadedFiles: Object.keys(uploadedFiles || {}),
    submittedAt: new Date().toISOString(),
  };

  return apiCall(API_ENDPOINTS.submitForm, payload, { mockType: 'submitForm' });
};

/**
 * Get submission by ID
 * Used by review pages to load submission data
 */
export const getSubmission = async (submissionId) => {
  // For GET requests, we might use query params instead
  const endpoint = API_ENDPOINTS.getSubmission;

  if (!endpoint) {
    // Mock mode - try localStorage
    const stored = localStorage.getItem(`submission_${submissionId}`);
    if (stored) {
      return { success: true, submission: JSON.parse(stored), mockMode: true };
    }
    return { success: false, error: 'Submission not found', mockMode: true };
  }

  return apiCall(endpoint, { submissionId }, { mockType: 'getSubmission' });
};

// ============================================================================
// Procurement Review API Functions
// ============================================================================

/**
 * Submit Procurement decision
 * Called from Procurement review page
 */
export const submitProcurementDecision = async (submissionId, decision, reviewerData) => {
  const payload = {
    submissionId,
    decision, // 'Standard', 'OPW', 'Rejected'
    reviewerName: reviewerData.name,
    reviewerEmail: reviewerData.email,
    comments: reviewerData.comments,
    rejectionReason: reviewerData.rejectionReason,
    decidedAt: new Date().toISOString(),
  };

  return apiCall(API_ENDPOINTS.procurementDecision, payload, { mockType: 'decision' });
};

// ============================================================================
// OPW Panel Review API Functions
// ============================================================================

/**
 * Submit OPW Panel decision
 * Called from OPW review page
 */
export const submitOPWDecision = async (submissionId, decision, reviewerData) => {
  const payload = {
    submissionId,
    decision, // 'Inside_IR35', 'Outside_IR35'
    reviewerName: reviewerData.name,
    reviewerEmail: reviewerData.email,
    comments: reviewerData.comments,
    ir35Determination: reviewerData.ir35Determination,
    decidedAt: new Date().toISOString(),
  };

  return apiCall(API_ENDPOINTS.owpDecision, payload, { mockType: 'decision' });
};

// ============================================================================
// Contract Drafter API Functions
// ============================================================================

/**
 * Submit signed contract
 * Called from Contract Drafter page
 */
export const submitSignedContract = async (submissionId, contractData) => {
  const payload = {
    submissionId,
    contractType: contractData.contractType,
    contractDocumentUrl: contractData.documentUrl,
    signedDate: contractData.signedDate,
    uploaderName: contractData.uploaderName,
    uploaderEmail: contractData.uploaderEmail,
    submittedAt: new Date().toISOString(),
  };

  // Uses same endpoint as form submission with different action
  return apiCall(API_ENDPOINTS.submitForm, { ...payload, action: 'contractUpload' }, { mockType: 'decision' });
};

// ============================================================================
// AP Control API Functions
// ============================================================================

/**
 * Submit AP Control completion
 * Called from AP Control page when supplier setup is complete
 */
export const submitAPCompletion = async (submissionId, approvalData) => {
  const payload = {
    submissionId,
    approverName: approvalData.name,
    approverEmail: approvalData.email,
    approverSignature: approvalData.signature,
    bankDetailsVerified: approvalData.bankDetailsVerified,
    supplierCreatedInSystem: approvalData.supplierCreatedInSystem,
    vendorNumber: approvalData.vendorNumber,
    comments: approvalData.comments,
    completedAt: new Date().toISOString(),
  };

  return apiCall(API_ENDPOINTS.apComplete, payload, { mockType: 'decision' });
};

// ============================================================================
// Document Upload API Functions
// ============================================================================

/**
 * Upload document to SharePoint with CSRF protection
 * Returns URL of uploaded document
 */
export const uploadDocument = async (submissionId, file, documentType) => {
  const endpoint = API_ENDPOINTS.uploadDocument;

  if (!endpoint) {
    // Mock mode - return fake URL
    return {
      success: true,
      documentUrl: `mock://documents/${submissionId}/${file.name}`,
      mockMode: true,
    };
  }

  // For file uploads, we need FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('submissionId', submissionId);
  formData.append('documentType', documentType);

  try {
    // Get CSRF token
    const token = await fetchCSRFToken();
    const headers = {};
    if (token) {
      headers['X-CSRF-Token'] = token;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      credentials: 'include', // Include cookies for CSRF
      body: formData, // Don't set Content-Type - browser sets it with boundary
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Document upload failed:', error);
    throw error;
  }
};

// ============================================================================
// Alemba Integration (Called from Power Automate, not directly)
// ============================================================================

/**
 * Note: Alemba ticket creation is handled by Power Automate flows,
 * not directly from the frontend. These functions are for reference
 * if you need to check ticket status.
 */

export const getAlembaTicketStatus = async (ticketId) => {
  // This would typically be called through a Power Automate flow
  // that has the Alemba credentials
  return { status: 'Open', ticketId };
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check API health/connectivity
 */
export const checkAPIHealth = async () => {
  const configured = {
    pbp: Boolean(API_ENDPOINTS.submitPBP),
    form: Boolean(API_ENDPOINTS.submitForm),
    crn: Boolean(API_ENDPOINTS.verifyCRN),
  };

  return {
    configured,
    allConfigured: Object.values(configured).every(Boolean),
    mockMode: !Object.values(configured).some(Boolean),
  };
};

/**
 * Get current submission status
 */
export const getSubmissionStatus = async (submissionId) => {
  try {
    const result = await getSubmission(submissionId);
    if (result.success && result.submission) {
      return {
        status: result.submission.status || 'Unknown',
        stage: result.submission.currentStage || 'Unknown',
        lastUpdated: result.submission.lastUpdated,
      };
    }
    return { status: 'Not Found', stage: null };
  } catch (error) {
    console.error('Error getting submission status:', error);
    return { status: 'Error', error: error.message };
  }
};

/**
 * Initialize API service (call this on app startup)
 * Preloads CSRF token if backend is configured
 */
export const initializeAPI = async () => {
  if (isBackendConfigured() && API_ENDPOINTS.csrfToken) {
    console.log('Initializing API service and fetching CSRF token...');
    await fetchCSRFToken();
  }
};

export default {
  isBackendConfigured,
  initializeAPI,
  fetchCSRFToken,
  clearCSRFToken,
  submitPBPQuestionnaire,
  submitPBPDecision,
  submitSupplierForm,
  getSubmission,
  submitProcurementDecision,
  submitOPWDecision,
  submitSignedContract,
  submitAPCompletion,
  uploadDocument,
  checkAPIHealth,
  getSubmissionStatus,
};
