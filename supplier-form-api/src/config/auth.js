/**
 * Passport Authentication Configuration
 * Supports Azure AD / ADFS authentication
 */

const passport = require('passport');
const { BearerStrategy } = require('passport-azure-ad');
const session = require('express-session');
const MSSQLStore = require('connect-mssql-v2');
const logger = require('./logger');
const { getPool } = require('./database');
const { getUserByOid, cacheUserFromToken, getCachedUser, isGraphConfigured } = require('../services/graphService');

const azureConfig = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_AD_CLIENT_ID,
  validateIssuer: true,
  passReqToCallback: false,
  loggingLevel: 'warn'
};

function configurePassport(app) {
  // CRITICAL: SESSION_SECRET must be set via environment variable
  // This is validated in app.js on startup
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  // Session configuration with SQL Server store
  const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    }
  };

  // Use SQL Server session store in production
  if (process.env.NODE_ENV === 'production') {
    try {
      const pool = getPool();
      sessionConfig.store = new MSSQLStore({
        client: pool,
        ttl: 8 * 60 * 60, // 8 hours in seconds
        autoRemove: true,
        autoRemoveInterval: 60 * 60 * 1000, // Clean up expired sessions every hour
        autoRemoveCallback: (err) => {
          if (err) logger.error('Session cleanup error:', err);
        }
      });
      logger.info('SQL Server session store configured');
    } catch (error) {
      logger.error('Failed to configure SQL Server session store:', error);
      logger.warn('Falling back to in-memory session store (not recommended for production)');
    }
  } else {
    logger.warn('Using in-memory session store (development mode)');
  }

  app.use(session(sessionConfig));

  app.use(passport.initialize());
  app.use(passport.session());

  // Azure AD Bearer Strategy
  passport.use(new BearerStrategy(azureConfig, (token, done) => {
    // Token contains user info from Azure AD
    const user = {
      email: token.preferred_username || token.email,
      name: token.name,
      oid: token.oid,
      groups: token.groups || []
    };

    // C3: Pre-populate server-side cache from bearer token
    // This ensures deserializeUser has fresh data if session auth is used
    cacheUserFromToken(user);

    return done(null, user);
  }));

  // SECURITY: Only store user OID in session, not full user object
  // This prevents session hijacking and role escalation attacks
  passport.serializeUser((user, done) => {
    // Store only the OID (Azure AD Object ID)
    done(null, { oid: user.oid });
  });

  // C3 FIX: Reconstruct user from OID using server-side cache + Graph API fallback
  // Groups are NEVER stored in the session - always resolved from trusted sources
  passport.deserializeUser(async (sessionData, done) => {
    try {
      const { oid } = sessionData;
      if (!oid) {
        return done(null, false);
      }

      // 1. Try server-side cache first (populated by BearerStrategy on each API call)
      const cachedUser = getCachedUser(oid);
      if (cachedUser) {
        return done(null, cachedUser);
      }

      // 2. If Graph API is configured, look up user and groups from Azure AD
      if (isGraphConfigured()) {
        try {
          const graphUser = await getUserByOid(oid);
          logger.debug(`deserializeUser: Resolved user ${graphUser.email} via Graph API (${graphUser.groups.length} groups)`);
          return done(null, graphUser);
        } catch (graphError) {
          logger.error(`deserializeUser: Graph API lookup failed for OID ${oid}:`, graphError.message);
          // Fall through to minimal user (fail closed - no groups = no access)
        }
      } else {
        logger.warn('deserializeUser: Graph API not configured - user will have no groups (RBAC will deny access)');
      }

      // 3. Fallback: return user with no groups (RBAC will deny access - fail closed)
      // This is intentional: we never grant access without verified group membership
      done(null, { oid, email: null, name: null, groups: [] });
    } catch (error) {
      logger.error('deserializeUser error:', error);
      done(error);
    }
  });

  logger.info('Passport authentication configured');
}

module.exports = { configurePassport };
