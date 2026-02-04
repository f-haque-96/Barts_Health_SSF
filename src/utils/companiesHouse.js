// Companies House API Integration
const COMPANIES_HOUSE_API_KEY = '7ed689df-a9a5-456b-a5dd-b160465be531';
const API_BASE_URL = 'https://api.company-information.service.gov.uk';

// Error types for better handling
export const CRN_ERROR_TYPES = {
  CORS_BLOCKED: 'CORS_BLOCKED',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_CRN: 'INVALID_CRN',
  API_ERROR: 'API_ERROR',
};

export const searchCompany = async (query) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/search/companies?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(COMPANIES_HOUSE_API_KEY + ':')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Company search failed');
    }

    const data = await response.json();
    return { success: true, data: data.items || [] };
  } catch (error) {
    console.error('Companies House search error:', error);

    // Check if it's a CORS error
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      return {
        success: false,
        error: CRN_ERROR_TYPES.CORS_BLOCKED,
        message: 'Unable to verify CRN due to browser restrictions. Please enter company details manually.'
      };
    }

    return { success: false, error: CRN_ERROR_TYPES.API_ERROR, data: [] };
  }
};

export const getCompanyDetails = async (companyNumber) => {
  try {
    // Validate CRN format
    const cleanedNumber = companyNumber.toString().replace(/\s/g, '');
    if (!/^[A-Z0-9]{6,8}$/i.test(cleanedNumber)) {
      return {
        success: false,
        error: CRN_ERROR_TYPES.INVALID_CRN,
        message: 'Invalid CRN format. CRN should be 6-8 alphanumeric characters.'
      };
    }

    // Use backend API proxy to avoid CORS issues
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${API_URL}/api/companies-house/${cleanedNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Include cookies for auth
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: CRN_ERROR_TYPES.NOT_FOUND,
          message: 'Company not found. Please check the CRN and try again.'
        };
      }
      throw new Error(`Backend API error: ${response.status}`);
    }

    const result = await response.json();

    // Companies House API returns the company data directly
    // Transform to our expected format
    return {
      success: true,
      data: {
        companyName: result.company_name,
        companyNumber: result.company_number,
        companyStatus: result.company_status,
        companyType: result.type,
        dateOfCreation: result.date_of_creation,
        registeredAddress: {
          addressLine1: result.registered_office_address?.address_line_1 || '',
          addressLine2: result.registered_office_address?.address_line_2 || '',
          city: result.registered_office_address?.locality || '',
          county: result.registered_office_address?.region || '',
          postcode: result.registered_office_address?.postal_code || '',
          country: result.registered_office_address?.country || 'United Kingdom',
        },
        sicCodes: result.sic_codes || [],
        accounts: result.accounts || {},
        confirmationStatement: result.confirmation_statement || {},
        hasCharges: result.has_charges || false,
        hasInsolvencyHistory: result.has_insolvency_history || false,
        jurisdiction: result.jurisdiction || 'england-wales',
        verified: true,
      }
    };

  } catch (error) {
    console.error('CRN verification error:', error);

    // Check if backend is unavailable
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      return {
        success: false,
        error: CRN_ERROR_TYPES.NETWORK_ERROR,
        message: 'Unable to connect to verification service. Please check your connection or enter company details manually in the next section.'
      };
    }

    return {
      success: false,
      error: CRN_ERROR_TYPES.API_ERROR,
      message: 'An error occurred during verification. Please enter company details manually in the next section.'
    };
  }
};

// Format company type for display
export const formatCompanyType = (type) => {
  const typeMap = {
    'ltd': 'Private Limited Company',
    'private-limited-guarant-nsc': 'Private Limited by Guarantee',
    'plc': 'Public Limited Company',
    'llp': 'Limited Liability Partnership',
    'private-unlimited': 'Private Unlimited Company',
    'old-public-company': 'Old Public Company',
    'private-limited-guarant-nsc-limited-exemption': 'Private Limited (Exempt)',
    'limited-partnership': 'Limited Partnership',
    'registered-society-non-jurisdictional': 'Registered Society',
    'charitable-incorporated-organisation': 'Charitable Incorporated Organisation',
  };

  return typeMap[type] || type?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};
