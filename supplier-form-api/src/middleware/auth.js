/**
 * Authentication Middleware
 * Verifies user is authenticated before allowing access
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

module.exports = {
  requireAuth,
  optionalAuth
};
