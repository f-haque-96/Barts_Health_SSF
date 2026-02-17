/**
 * Development Authentication Configuration
 *
 * C7: SECURITY GUARD - This file MUST NOT execute in production.
 * It provides mock users that bypass Azure AD authentication.
 * The dynamic import in StorageProvider.js ensures it's only loaded in dev mode.
 *
 * Modify this to test different role combinations without changing production code.
 */

// C7: Hard fail if this module is ever loaded in production
if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
  throw new Error(
    'SECURITY: devAuth.js must not be loaded in production. ' +
    'Check that all imports use dynamic import() guarded by import.meta.env.DEV.'
  );
}

// Available roles (must match ROLE_GROUPS in AuthContext.jsx)
export const DEV_ROLES = {
  ADMIN: 'NHS-SupplierForm-Admin',
  PBP: 'NHS-SupplierForm-PBP',
  PROCUREMENT: 'NHS-SupplierForm-Procurement',
  OPW: 'NHS-SupplierForm-OPW',
  CONTRACT: 'NHS-SupplierForm-Contract',
  AP_CONTROL: 'NHS-SupplierForm-APControl'
};

/**
 * Test User Profiles
 * Switch between these to test different access levels
 */
export const TEST_USERS = {
  // Full admin access - can see everything
  ADMIN: {
    email: 'admin@nhs.net',
    name: 'Admin User',
    groups: [DEV_ROLES.ADMIN]
  },

  // Procurement only
  PROCUREMENT: {
    email: 'procurement@nhs.net',
    name: 'Procurement User',
    groups: [DEV_ROLES.PROCUREMENT]
  },

  // AP Control only
  AP_CONTROL: {
    email: 'ap.control@nhs.net',
    name: 'AP Control User',
    groups: [DEV_ROLES.AP_CONTROL]
  },

  // PBP only
  PBP: {
    email: 'pbp@nhs.net',
    name: 'PBP User',
    groups: [DEV_ROLES.PBP]
  },

  // OPW only
  OPW: {
    email: 'opw@nhs.net',
    name: 'OPW Panel Member',
    groups: [DEV_ROLES.OPW]
  },

  // Contract only
  CONTRACT: {
    email: 'contract@nhs.net',
    name: 'Contract User',
    groups: [DEV_ROLES.CONTRACT]
  },

  // Multiple roles (Procurement + AP Control)
  MULTI_ROLE: {
    email: 'multi.role@nhs.net',
    name: 'Multi-Role User',
    groups: [DEV_ROLES.PROCUREMENT, DEV_ROLES.AP_CONTROL]
  },

  // No special roles (requester only)
  REQUESTER: {
    email: 'requester@nhs.net',
    name: 'Regular Requester',
    groups: []
  }
};

/**
 * Current active test user
 * Change this to switch between user profiles
 *
 * Options: 'ADMIN', 'PROCUREMENT', 'AP_CONTROL', 'PBP', 'OPW', 'CONTRACT', 'MULTI_ROLE', 'REQUESTER'
 */
export const ACTIVE_TEST_USER = 'ADMIN';

/**
 * Get the current test user based on ACTIVE_TEST_USER setting
 */
export const getDevUser = () => {
  return TEST_USERS[ACTIVE_TEST_USER] || TEST_USERS.ADMIN;
};

/**
 * Enable/disable authentication in development
 * Set to false to bypass all authentication checks (use with caution!)
 */
export const DEV_AUTH_ENABLED = true;
