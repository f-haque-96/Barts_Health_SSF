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
    return done(null, user);
  }));

  // SECURITY: Only store user OID in session, not full user object
  // This prevents session hijacking and role escalation attacks
  passport.serializeUser((user, done) => {
    // Store only the OID (Azure AD Object ID)
    done(null, { oid: user.oid });
  });

  // SECURITY: Reconstruct user from OID on each request
  // In production, groups should be looked up from Azure AD or cached server-side
  passport.deserializeUser((sessionData, done) => {
    // TODO: In production, implement Azure AD group lookup via Microsoft Graph API
    // For now, we'll need to look up user data from another source
    // This is a placeholder - full implementation requires Graph API integration

    // Minimal user object with OID only
    // Groups will need to be fetched from Azure AD or database on each request
    const user = {
      oid: sessionData.oid,
      // In production, call Azure AD Graph API here to get current user info
      // Example: const graphUser = await getAzureADUser(sessionData.oid);
    };

    done(null, user);
  });

  logger.info('Passport authentication configured');
}

module.exports = { configurePassport };
