/**
 * Role-Based Access Control Middleware
 * Enforces role requirements for protected routes
 *
 * CRITICAL: Update ROLE_GROUPS with actual AD group names from IT
 */

const logger = require('../config/logger');
const { logAudit } = require('../services/auditService');

// H5: Role to AD group mapping - keys MUST MATCH FRONTEND AuthContext.jsx ROLES values
// These are the AD security groups that IT will create
// If IT uses different names, update BOTH here AND in frontend AuthContext.jsx
const ROLE_GROUPS = {
  pbp: ['NHS-SupplierForm-PBP', 'NHS-SupplierForm-Admin'],
  procurement: ['NHS-SupplierForm-Procurement', 'NHS-SupplierForm-Admin'],
  opw: ['NHS-SupplierForm-OPW', 'NHS-SupplierForm-Admin'],
  contract: ['NHS-SupplierForm-Contract', 'NHS-SupplierForm-Admin'],
  ap_control: ['NHS-SupplierForm-APControl', 'NHS-SupplierForm-Admin'],
  admin: ['NHS-SupplierForm-Admin']
};

/**
 * Check if user has required role
 */
const requireRole = (role) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    const userGroups = req.user.groups || [];
    const allowedGroups = ROLE_GROUPS[role] || [];
    const hasAccess = userGroups.some(g => allowedGroups.includes(g));

    if (!hasAccess) {
      // Log unauthorized access attempt
      await logAudit({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        user: req.user.email,
        userGroups: userGroups,
        resource: req.originalUrl,
        requiredRole: role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      logger.warn(`Unauthorized access attempt: ${req.user.email} tried to access ${req.originalUrl} (requires ${role})`);

      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Check if user has any of the required roles
 */
const requireAnyRole = (roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    const userGroups = req.user.groups || [];
    const hasAccess = roles.some(role => {
      const allowedGroups = ROLE_GROUPS[role] || [];
      return userGroups.some(g => allowedGroups.includes(g));
    });

    if (!hasAccess) {
      logger.warn(`Unauthorized access attempt: ${req.user.email} tried to access ${req.originalUrl}`);

      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Check if user can access a specific submission
 */
const canAccessSubmission = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  // Admins can access everything
  const isAdmin = (user.groups || []).some(g => ROLE_GROUPS.admin.includes(g));
  if (isAdmin) {
    return next();
  }

  // Load submission to check ownership and stage
  const submissionService = require('../services/submissionService');
  const submission = await submissionService.getById(id);

  if (!submission) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Submission not found'
    });
  }

  // Check if user is the owner
  if (submission.RequesterEmail?.toLowerCase() === user.email?.toLowerCase()) {
    return next();
  }

  // Check stage-based access
  const stage = submission.CurrentStage?.toLowerCase();
  const userGroups = user.groups || [];

  const stageRoleMap = {
    'pbp': ROLE_GROUPS.pbp,
    'procurement': ROLE_GROUPS.procurement,
    'opw': ROLE_GROUPS.opw,
    'contract': ROLE_GROUPS.contract,
    'ap_control': ROLE_GROUPS.ap_control,
    'ap': ROLE_GROUPS.ap_control
  };

  const allowedGroups = stageRoleMap[stage] || [];
  const hasStageAccess = userGroups.some(g => allowedGroups.includes(g));

  if (hasStageAccess) {
    return next();
  }

  return res.status(403).json({
    error: 'ACCESS_DENIED',
    message: 'You do not have permission to view this submission'
  });
};

module.exports = {
  requireRole,
  requireAnyRole,
  canAccessSubmission,
  ROLE_GROUPS
};
