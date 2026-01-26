/**
 * useCRNVerification Hook
 * Handles Companies House CRN verification with caching
 * Uses mock data for testing, with fallback for CORS/API errors
 */

import { useState, useCallback } from 'react';
import useFormStore from '../stores/formStore';
import { formatCRN } from '../utils/helpers';
import { getCompanyDetails, CRN_ERROR_TYPES } from '../utils/companiesHouse';

// Mock CRN data for testing
const MOCK_CRN_DATA = {
  '12345678': {
    company_name: 'Test Company Ltd',
    company_status: 'active',
    registered_office_address: {
      address_line_1: '123 Test Street',
      locality: 'London',
      postal_code: 'EC1A 1BB',
    },
    date_of_creation: '2020-01-15',
  },
  '00445790': {
    company_name: 'TESCO PLC',
    company_status: 'active',
    registered_office_address: {
      address_line_1: 'Tesco House, Shire Park',
      locality: 'Welwyn Garden City',
      postal_code: 'AL7 1GA',
    },
    date_of_creation: '1947-11-27',
  },
  '04234715': {
    company_name: "SAINSBURY'S SUPERMARKETS LTD",
    company_status: 'active',
    registered_office_address: {
      address_line_1: '33 Holborn',
      locality: 'London',
      postal_code: 'EC1N 2HT',
    },
    date_of_creation: '2001-05-23',
  },
  '01234567': {
    company_name: 'Dissolved Test Company Ltd',
    company_status: 'dissolved',
    registered_office_address: {
      address_line_1: '456 Old Street',
      locality: 'Manchester',
      postal_code: 'M1 1AA',
    },
    date_of_creation: '2010-03-20',
  },
};

const useCRNVerification = () => {
  // Status: 'idle' | 'verifying' | 'valid' | 'invalid' | 'dissolved' | 'cors_blocked' | 'not_found'
  const [status, setStatus] = useState('idle');
  const [companyData, setCompanyData] = useState(null);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const { getCRNData, setCRNData } = useFormStore();

  const verify = useCallback(
    async (crn) => {
      if (!crn || crn.length < 7) {
        setStatus('idle');
        setCompanyData(null);
        setError(null);
        setErrorType(null);
        return null;
      }

      // Format and normalize CRN
      const cleanCRN = formatCRN(crn);

      if (cleanCRN.length !== 8) {
        setStatus('invalid');
        setError('CRN must be 7 or 8 characters');
        setErrorType(CRN_ERROR_TYPES.INVALID_CRN);
        return null;
      }

      // Check cache first
      const cached = getCRNData(cleanCRN);
      if (cached) {
        setStatus(cached.valid ? (cached.company?.status === 'dissolved' ? 'dissolved' : 'valid') : 'invalid');
        setCompanyData(cached.company);
        return cached;
      }

      // Start verification
      setStatus('verifying');
      setError(null);
      setErrorType(null);

      try {
        // First check mock data (for testing)
        const mockCompany = MOCK_CRN_DATA[cleanCRN];

        if (mockCompany) {
          // Company found in mock data
          const data = {
            valid: true,
            company: {
              name: mockCompany.company_name,
              status: mockCompany.company_status,
              address: `${mockCompany.registered_office_address.address_line_1}, ${mockCompany.registered_office_address.locality}, ${mockCompany.registered_office_address.postal_code}`,
              dateOfCreation: mockCompany.date_of_creation,
              // Individual address fields for auto-population
              registeredAddress: mockCompany.registered_office_address.address_line_1 || '',
              addressLine2: mockCompany.registered_office_address.address_line_2 || '',
              city: mockCompany.registered_office_address.locality || '',
              county: mockCompany.registered_office_address.region || '',
              postcode: mockCompany.registered_office_address.postal_code || '',
              country: mockCompany.registered_office_address.country || 'United Kingdom',
            },
          };

          // Cache the result
          setCRNData(cleanCRN, data);

          if (mockCompany.company_status === 'dissolved') {
            setStatus('dissolved');
            setCompanyData(data.company);
            setError('This company is dissolved');
          } else {
            setStatus('valid');
            setCompanyData(data.company);
          }

          return data;
        }

        // Try actual API call (may be blocked by CORS)
        const apiResult = await getCompanyDetails(cleanCRN);

        if (apiResult.success && apiResult.data) {
          // API call succeeded
          const companyInfo = apiResult.data;
          const data = {
            valid: true,
            company: {
              name: companyInfo.companyName,
              status: companyInfo.companyStatus,
              address: `${companyInfo.registeredAddress.addressLine1}, ${companyInfo.registeredAddress.city}, ${companyInfo.registeredAddress.postcode}`,
              dateOfCreation: companyInfo.dateOfCreation,
              // Individual address fields for auto-population
              registeredAddress: companyInfo.registeredAddress.addressLine1 || '',
              addressLine2: companyInfo.registeredAddress.addressLine2 || '',
              city: companyInfo.registeredAddress.city || '',
              county: companyInfo.registeredAddress.county || '',
              postcode: companyInfo.registeredAddress.postcode || '',
              country: companyInfo.registeredAddress.country || 'United Kingdom',
            },
          };

          setCRNData(cleanCRN, data);

          if (companyInfo.companyStatus === 'dissolved') {
            setStatus('dissolved');
            setCompanyData(data.company);
            setError('This company is dissolved');
          } else {
            setStatus('valid');
            setCompanyData(data.company);
          }

          return data;
        }

        // Handle specific error types
        if (apiResult.error === CRN_ERROR_TYPES.CORS_BLOCKED) {
          setStatus('cors_blocked');
          setError(apiResult.message);
          setErrorType(CRN_ERROR_TYPES.CORS_BLOCKED);
          setCompanyData(null);
          return { valid: false, error: CRN_ERROR_TYPES.CORS_BLOCKED, message: apiResult.message };
        }

        if (apiResult.error === CRN_ERROR_TYPES.NOT_FOUND) {
          setStatus('not_found');
          setError(apiResult.message);
          setErrorType(CRN_ERROR_TYPES.NOT_FOUND);
          setCompanyData(null);
          return { valid: false, error: CRN_ERROR_TYPES.NOT_FOUND, message: apiResult.message };
        }

        // Generic invalid status for other errors
        setStatus('invalid');
        setError(apiResult.message || 'Company not found. Please check the CRN and try again.');
        setCompanyData(null);
        return { valid: false, message: apiResult.message };

      } catch (err) {
        console.error('CRN verification error:', err);
        setStatus('cors_blocked');
        setError('Unable to verify CRN. You can proceed by entering company details manually in the next section.');
        setErrorType(CRN_ERROR_TYPES.CORS_BLOCKED);
        return { valid: false, error: CRN_ERROR_TYPES.CORS_BLOCKED, message: err.message };
      }
    },
    [getCRNData, setCRNData]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setCompanyData(null);
    setError(null);
    setErrorType(null);
  }, []);

  return {
    verify,
    reset,
    status,
    companyData,
    error,
    errorType,
    isVerifying: status === 'verifying',
    isValid: status === 'valid',
    isInvalid: status === 'invalid' || status === 'dissolved',
    isCorsBlocked: status === 'cors_blocked',
    isNotFound: status === 'not_found',
    canProceedManually: status === 'cors_blocked' || status === 'not_found' || status === 'invalid',
  };
};

export default useCRNVerification;
