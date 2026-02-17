/**
 * Storage Provider Abstraction
 * Allows switching between localStorage (development) and API (production)
 *
 * CRITICAL: In production, all data access goes through the API which enforces RBAC
 */

// Development-only LocalStorageProvider
class LocalStorageProvider {
  async getSession() {
    // In dev, simulate a logged-in user based on devAuth.js configuration
    // Dynamically import devAuth only in development to keep it out of production bundle
    if (import.meta.env.DEV) {
      const { getDevUser } = await import('../config/devAuth');
      return { user: getDevUser() };
    }
    // Should never reach here in production, but return error if it does
    throw new Error('LocalStorageProvider should not be used in production');
  }

  async getSubmission(id) {
    // Try multiple key formats for backwards compatibility
    const keys = [
      `submission_${id}`,
      `submission-${id}`,
      id
    ];

    for (const key of keys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          console.error(`Error parsing submission ${key}:`, e);
        }
      }
    }
    return null;
  }

  async saveSubmission(data) {
    const id = data.id || data.submissionId || this.generateId();
    const submissionData = { ...data, id, submissionId: id };
    localStorage.setItem(`submission_${id}`, JSON.stringify(submissionData));
    return { success: true, id };
  }

  async updateSubmission(id, data) {
    const existing = await this.getSubmission(id);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(`submission_${id}`, JSON.stringify(updated));
    return { success: true };
  }

  async getWorkQueue(stage) {
    // In dev, return all submissions for the stage
    const submissions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('submission_') || key?.startsWith('submission-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (this.matchesStage(data, stage)) {
            submissions.push(data);
          }
        } catch (e) {
          console.error(`Error parsing submission ${key}:`, e);
        }
      }
    }
    return submissions;
  }

  matchesStage(submission, stage) {
    const status = submission?.status?.toLowerCase();
    const stageStatusMap = {
      'pbp': ['pending_review', 'pending_pbp_review', 'info_required'],
      'procurement': ['approved', 'pending_procurement_review', 'pbp_approved'],
      'opw': ['pending_opw_review', 'procurement_approved_opw', 'opw_pending'],
      'contract': ['pending_contract', 'opw_complete', 'opw_approved'],
      'ap': ['pending_ap_control', 'contract_uploaded', 'pending_ap_review']
    };
    return stageStatusMap[stage]?.some(s => status?.includes(s.toLowerCase()));
  }

  async uploadDocument(submissionId, file, documentType) {
    // In dev, store as base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const key = `doc-${submissionId}-${documentType}`;
        localStorage.setItem(key, JSON.stringify({
          name: file.name,
          type: documentType,
          mimeType: file.type,
          size: file.size,
          data: reader.result,
          uploadedAt: new Date().toISOString()
        }));
        resolve({ success: true, documentId: key });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async getDocument(documentId) {
    const data = localStorage.getItem(documentId);
    return data ? JSON.parse(data) : null;
  }

  generateId() {
    // C4: Unified format matching backend validation: SUP-YYYY-XXXXXXXX (8 hex chars)
    const year = new Date().getFullYear();
    const hex = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
    return `SUP-${year}-${hex}`;
  }
}

class ApiStorageProvider {
  // H9: Request timeout (30 seconds)
  static REQUEST_TIMEOUT_MS = 30000;
  // H9: Retry config for 5xx errors and network failures
  static MAX_RETRIES = 3;
  static RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

  constructor(baseUrl) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || '';
    this.csrfToken = null;
  }

  /**
   * Get CSRF token from server
   */
  async _getCSRFToken() {
    if (this.csrfToken) return this.csrfToken;

    try {
      const response = await fetch(`${this.baseUrl}/api/csrf-token`, {
        credentials: 'include'
      });
      const data = await response.json();
      this.csrfToken = data.csrfToken;
      return this.csrfToken;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return null;
    }
  }

  /**
   * Clear cached CSRF token (call this on 403 errors to retry with fresh token)
   */
  _clearCSRFToken() {
    this.csrfToken = null;
  }

  /**
   * H8: Safely parse JSON response with Content-Type validation
   */
  _parseJSON(response) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        'The server returned an unexpected response. ' +
        'This may be caused by a network proxy or content filter. ' +
        'Please try again or contact the helpdesk.'
      );
    }
    return response.json();
  }

  /**
   * H9: Sleep helper for retry delays
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request(endpoint, options = {}) {
    // For state-changing requests, include CSRF token
    const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method);
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (needsCSRF) {
      const token = await this._getCSRFToken();
      if (token) {
        headers['X-CSRF-Token'] = token;
      }
    }

    // H9: Retry loop with exponential backoff for 5xx and network errors
    let lastError;
    for (let attempt = 0; attempt < ApiStorageProvider.MAX_RETRIES; attempt++) {
      // H9: AbortController for request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ApiStorageProvider.REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          credentials: 'include',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }

        if (response.status === 403) {
          this._clearCSRFToken();
          throw new Error('ACCESS_DENIED');
        }

        // H9: Only retry on 5xx server errors, not 4xx client errors
        if (response.status >= 500 && attempt < ApiStorageProvider.MAX_RETRIES - 1) {
          lastError = new Error(`Server error: ${response.status}`);
          await this._sleep(ApiStorageProvider.RETRY_DELAYS[attempt]);
          continue;
        }

        if (!response.ok) {
          const error = await this._parseJSON(response).catch(() => ({}));
          throw new Error(error.message || 'API_ERROR');
        }

        // H8: Validate Content-Type before parsing JSON
        return this._parseJSON(response);
      } catch (error) {
        clearTimeout(timeoutId);

        // Don't retry auth errors or client errors
        if (error.message === 'UNAUTHORIZED' || error.message === 'ACCESS_DENIED') {
          throw error;
        }

        // H9: Retry on network errors and timeouts
        if (error.name === 'AbortError') {
          lastError = new Error('Request timed out. Please check your connection and try again.');
        } else {
          lastError = error;
        }

        if (attempt < ApiStorageProvider.MAX_RETRIES - 1) {
          await this._sleep(ApiStorageProvider.RETRY_DELAYS[attempt]);
          continue;
        }
      }
    }

    throw lastError;
  }

  async getSession() {
    return this.request('/api/session');
  }

  async getSubmission(id) {
    return this.request(`/api/submissions/${id}`);
  }

  async saveSubmission(data) {
    return this.request('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSubmission(id, data) {
    return this.request(`/api/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getWorkQueue(stage) {
    return this.request(`/api/reviews/${stage}/queue`);
  }

  async submitReview(stage, submissionId, reviewData) {
    return this.request(`/api/reviews/${stage}/${submissionId}`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  async uploadDocument(submissionId, file, documentType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('submissionId', submissionId);

    // Get CSRF token for upload
    const token = await this._getCSRFToken();
    const headers = {};
    if (token) {
      headers['X-CSRF-Token'] = token;
    }

    // H9: Upload timeout (60s for large files)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${this.baseUrl}/api/documents/${submissionId}`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 403) {
        this._clearCSRFToken();
        throw new Error('ACCESS_DENIED');
      }

      if (!response.ok) {
        throw new Error('UPLOAD_FAILED');
      }

      // H8: Validate Content-Type before parsing
      return this._parseJSON(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out. The file may be too large or the connection too slow.');
      }
      throw error;
    }
  }

  async getDocument(documentId) {
    return this.request(`/api/documents/${documentId}`);
  }

  async checkCompaniesHouse(crn) {
    return this.request(`/api/companies-house/${crn}`);
  }

  async checkDuplicateVendor(companyName, vatNumber) {
    const params = new URLSearchParams();
    if (companyName) params.append('companyName', companyName);
    if (vatNumber) params.append('vatNumber', vatNumber);
    return this.request(`/api/vendors/check?${params}`);
  }
}

// Determine which provider to use based on environment
const isProduction = import.meta.env.PROD;
const useApi = import.meta.env.VITE_USE_API === 'true';

let storage;

if (isProduction || useApi) {
  storage = new ApiStorageProvider(import.meta.env.VITE_API_URL);
} else {
  storage = new LocalStorageProvider();
}

export { storage, LocalStorageProvider, ApiStorageProvider };
export default storage;
