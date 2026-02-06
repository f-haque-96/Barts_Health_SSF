/**
 * Authentication Middleware
 * Verifies user is authenticated before allowing access
 * Updated: February 2026 - Security enhancements and CSRF protection
 */

const passport = require('passport');
const logger = require('../config/logger');

/**
 * Require authentication for a route
 */
const requireAuth = (req, res, next) => {
  passport.authenticate('oauth-bearer', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('Authentication error:', err);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Optional authentication - doesn't fail if not authenticated
 */
const optionalAuth = (req, res, next) => {
  passport.authenticate('oauth-bearer', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

/**
 * Development bypass - allows public access in dev mode, requires auth in production
 * Use this for endpoints that should work during local development but require auth in production
 */
const devBypassAuth = (req, res, next) => {
  // In development mode, allow access without authentication
  if (process.env.NODE_ENV !== 'production') {
    // Create a mock user for development
    req.user = req.user || {
      oid: 'dev-user',
      email: 'dev@localhost',
      name: 'Development User',
      roles: ['developer']
    };
    logger.info('Dev mode: Bypassing authentication');
    return next();
  }

  // In production, require authentication
  return requireAuth(req, res, next);
};

module.exports = {
  requireAuth,
  optionalAuth,
  devBypassAuth
};
