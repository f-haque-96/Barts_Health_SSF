/**
 * Authentication Context
 * Updated: Mar 2026 - CI compliance
 * Provides authentication state and role-based access control throughout the app
 *
 * CRITICAL: This enforces RBAC on the frontend. Backend API must also enforce RBAC.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import storage from '../services/StorageProvider';
import { STAGE, STAGE_QUEUE_STATUSES } from '../utils/workflowStatus';

const AuthContext = createContext(null);

// Role definitions matching the SSF-* SharePoint groups
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

// Mapping of roles to group names.
// These are the SSF-* SharePoint groups created by playbook Task 3 (the AD
// NHS-SupplierForm-* groups from the retired Express design were cancelled).
// SharePoint group membership is NOT in the Azure AD token — the production
// Graph provider must resolve the signed-in user's groups from the site and
// put them on session.user.groups (design doc 06 §3 / readiness review S1).
const ROLE_GROUPS = {
  [ROLES.PBP]: ['SSF-PBP', 'SSF-Admin'],
  [ROLES.PROCUREMENT]: ['SSF-Procurement', 'SSF-Admin'],
  [ROLES.OPW]: ['SSF-OPW', 'SSF-Admin'],
  [ROLES.CONTRACT]: ['SSF-Contract', 'SSF-Admin'],
  [ROLES.AP_CONTROL]: ['SSF-APControl', 'SSF-Admin'],
  [ROLES.ADMIN]: ['SSF-Admin']
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

    // Check stage-based access — EXACT matches only against the canonical
    // status model. Substring matching here previously granted cross-stage
    // access ('approved'.includes('ap') let AP Control open PBP-approved
    // items) — readiness review finding S2.
    const status = submission.status?.toLowerCase() || '';
    const currentStage = submission.currentStage?.toLowerCase();

    const stageAccess = [
      [STAGE.PBP, ROLES.PBP],
      [STAGE.PROCUREMENT, ROLES.PROCUREMENT],
      [STAGE.OPW, ROLES.OPW],
      [STAGE.CONTRACT, ROLES.CONTRACT],
      [STAGE.AP, ROLES.AP_CONTROL],
    ];

    for (const [stage, role] of stageAccess) {
      const inQueue = (STAGE_QUEUE_STATUSES[stage] || []).includes(status);
      // 'ap_control' is a legacy alias for the AP stage still present in
      // some stored submissions
      const atStage = currentStage === stage ||
        (stage === STAGE.AP && currentStage === 'ap_control');
      if ((inQueue || atStage) && hasRole(role)) {
        return true;
      }
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
