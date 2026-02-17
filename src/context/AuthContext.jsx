/**
 * Authentication Context
 * Provides authentication state and role-based access control throughout the app
 *
 * CRITICAL: This enforces RBAC on the frontend. Backend API must also enforce RBAC.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import storage from '../services/StorageProvider';

const AuthContext = createContext(null);

// Role definitions matching AD security groups
// eslint-disable-next-line react-refresh/only-export-components
export const ROLES = {
  REQUESTER: 'requester',
  PBP: 'pbp',
  PROCUREMENT: 'procurement',
  OPW: 'opw',
  CONTRACT: 'contract',
  AP_CONTROL: 'ap_control',
  ADMIN: 'admin'
};

// Mapping of roles to AD group names
// NOTE: These must match the AD security groups created by IT
// Update these if IT uses different names - inform developer to sync with backend
const ROLE_GROUPS = {
  [ROLES.PBP]: ['NHS-SupplierForm-PBP', 'NHS-SupplierForm-Admin'],
  [ROLES.PROCUREMENT]: ['NHS-SupplierForm-Procurement', 'NHS-SupplierForm-Admin'],
  [ROLES.OPW]: ['NHS-SupplierForm-OPW', 'NHS-SupplierForm-Admin'],
  [ROLES.CONTRACT]: ['NHS-SupplierForm-Contract', 'NHS-SupplierForm-Admin'],
  [ROLES.AP_CONTROL]: ['NHS-SupplierForm-APControl', 'NHS-SupplierForm-Admin'],
  [ROLES.ADMIN]: ['NHS-SupplierForm-Admin']
};

// Stage to role mapping for access control
const STAGE_ROLES = {
  'pbp': ROLES.PBP,
  'procurement': ROLES.PROCUREMENT,
  'opw': ROLES.OPW,
  'contract': ROLES.CONTRACT,
  'ap_control': ROLES.AP_CONTROL,
  'ap': ROLES.AP_CONTROL
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await storage.getSession();
        setUser(session.user);
      } catch (err) {
        console.error('Failed to load session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  /**
   * Check if user has a specific role
   * M9: Wrapped in useCallback to prevent stale closures in useEffect dependencies
   */
  const hasRole = useCallback((role) => {
    if (!user?.groups) return false;
    const allowedGroups = ROLE_GROUPS[role] || [];
    return user.groups.some(g => allowedGroups.includes(g));
  }, [user]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles) => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  /**
   * Check if user is an admin
   */
  const isAdmin = useCallback(() => hasRole(ROLES.ADMIN), [hasRole]);

  /**
   * Check if user can access a specific submission based on its stage and ownership
   * M9: Wrapped in useCallback to prevent infinite re-renders when used in useEffect deps
   */
  const canAccessSubmission = useCallback((submission) => {
    if (!user) return false;

    // Admin can access everything
    if (isAdmin()) return true;

    // Owner can access their own submission
    const ownerEmail = submission.requesterEmail ||
                      submission.submittedBy ||
                      submission.formData?.section1?.nhsEmail ||
                      submission.formData?.nhsEmail;

    if (ownerEmail && ownerEmail.toLowerCase() === user.email?.toLowerCase()) {
      return true;
    }

    // Supplier can access their own submission via response page
    const supplierEmail = submission.formData?.contactEmail ||
                         submission.formData?.section4?.contactEmail;

    if (supplierEmail && supplierEmail.toLowerCase() === user.email?.toLowerCase()) {
      return true;
    }

    // Check stage-based access
    const status = submission.status?.toLowerCase() || '';
    const currentStage = submission.currentStage?.toLowerCase();

    // PBP access
    if ((status.includes('pending_review') || status.includes('pbp') || status === 'info_required') &&
        hasRole(ROLES.PBP)) {
      return true;
    }

    // Procurement access
    if ((status.includes('approved') || status.includes('procurement') || currentStage === 'procurement') &&
        hasRole(ROLES.PROCUREMENT)) {
      return true;
    }

    // OPW access
    if ((status.includes('opw') || currentStage === 'opw') && hasRole(ROLES.OPW)) {
      return true;
    }

    // Contract access
    if ((status.includes('contract') || currentStage === 'contract') && hasRole(ROLES.CONTRACT)) {
      return true;
    }

    // AP Control access
    if ((status.includes('ap') || currentStage === 'ap' || currentStage === 'ap_control') &&
        hasRole(ROLES.AP_CONTROL)) {
      return true;
    }

    return false;
  }, [user, isAdmin, hasRole]);

  /**
   * Get the role required for a specific stage
   */
  const getRoleForStage = useCallback((stage) => {
    return STAGE_ROLES[stage?.toLowerCase()] || null;
  }, []);

  /**
   * Check if user can perform review actions (not just view)
   */
  const canReview = useCallback((submission, stage) => {
    if (!user) return false;
    if (isAdmin()) return true;

    const requiredRole = getRoleForStage(stage);
    if (!requiredRole) return false;

    return hasRole(requiredRole) && canAccessSubmission(submission);
  }, [user, isAdmin, getRoleForStage, hasRole, canAccessSubmission]);

  // M9: Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    user,
    loading,
    error,
    hasRole,
    hasAnyRole,
    isAdmin,
    canAccessSubmission,
    canReview,
    getRoleForStage,
    isAuthenticated: !!user,
    ROLES,
    ROLE_GROUPS
  }), [user, loading, error, hasRole, hasAnyRole, isAdmin, canAccessSubmission, canReview, getRoleForStage]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export { ROLE_GROUPS };
export default AuthContext;
