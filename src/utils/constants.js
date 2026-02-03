/**
 * Constants
 * Reusable constants for the application
 */

export const SERVICE_TYPES = [
  { value: 'training', label: 'Training/Conferences' },
  { value: 'legal', label: 'Legal related' },
  { value: 'goods', label: 'Physical goods/Equipment' },
  { value: 'consultancy', label: 'Consultancy' },
  { value: 'construction', label: 'Construction/Maintenance' },
  { value: 'software', label: 'Software/IT related' },
  { value: 'other', label: 'Other' },
];

export const EMPLOYEE_COUNTS = [
  { value: 'micro', label: 'Micro (0-9 employees)' },
  { value: 'small', label: 'Small (10-49 employees)' },
  { value: 'medium', label: 'Medium (50-249 employees)' },
  { value: 'large', label: 'Large (250+ employees)' },
];

export const PAYMENT_METHODS = [
  { value: 'bacs', label: 'BACS (Bank Transfer)' },
  { value: 'faster_payments', label: 'Faster Payments' },
  { value: 'cheque', label: 'Cheque' },
];

export const PUBLIC_SECTOR_TYPES = [
  { value: 'nhs', label: 'NHS Organisation' },
  { value: 'local_authority', label: 'Local Authority' },
  { value: 'government', label: 'Government Department' },
  { value: 'education', label: 'Educational Institution' },
  { value: 'other', label: 'Other Public Sector' },
];

export const SUPPLIER_TYPES = {
  LIMITED_COMPANY: {
    value: 'limited_company',
    label: 'Limited Company',
    icon: '🏢',
    description: 'Registered with Companies House',
    tooltip: 'A company registered with Companies House with limited liability protection',
  },
  CHARITY: {
    value: 'charity',
    label: 'Charity/Non-Profit',
    icon: '❤️',
    description: 'Registered charity or non-profit organisation',
    tooltip: 'A registered charity or non-profit organisation with a charity number',
  },
  SOLE_TRADER: {
    value: 'sole_trader',
    label: 'Sole Trader',
    icon: '👤',
    description: 'Individual trading as a business',
    tooltip: 'An individual trading as a self-employed business owner',
  },
  PUBLIC_SECTOR: {
    value: 'public_sector',
    label: 'Public Sector',
    icon: '🏛️',
    description: 'Public sector organisation',
    tooltip: 'Government bodies, NHS organisations, councils, or other public institutions',
  },
};

export const USAGE_FREQUENCIES = [
  { value: 'one-off', label: 'One-off' },
  { value: 'occasional', label: 'Occasional' },
  { value: 'frequent', label: 'Frequent' },
];

export const FILE_UPLOAD_CONFIG = {
  maxSize: 3 * 1024 * 1024, // 3MB
  acceptedTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
};

export const API_ENDPOINTS = {
  VALIDATE_CRN: '/validate-crn',
  SUBMIT_FORM: '/submit-supplier-form',
  SAVE_DRAFT: '/api/save-for-later',
  SHARE_WITH_SUPPLIER: '/api/share-with-supplier',
};
