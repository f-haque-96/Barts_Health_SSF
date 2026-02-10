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
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `SUP-${year}-${random}`;
  }
}

class ApiStorageProvider {
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

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: 'include', // Important for auth cookies
      headers
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (response.status === 403) {
      // Clear CSRF token on 403 to force refresh on retry
      this._clearCSRFToken();
      throw new Error('ACCESS_DENIED');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API_ERROR');
    }

    return response.json();
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

    const response = await fetch(`${this.baseUrl}/api/documents/${submissionId}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData
    });

    if (response.status === 403) {
      this._clearCSRFToken();
      throw new Error('ACCESS_DENIED');
    }

    if (!response.ok) {
      throw new Error('UPLOAD_FAILED');
    }

    return response.json();
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
