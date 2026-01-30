/**
 * Passport Authentication Configuration
 * Supports Azure AD / ADFS authentication
 */

const passport = require('passport');
const { BearerStrategy } = require('passport-azure-ad');
const session = require('express-session');
const logger = require('./logger');

const azureConfig = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_AD_CLIENT_ID,
  validateIssuer: true,
  passReqToCallback: false,
  loggingLevel: 'warn'
};

function configurePassport(app) {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    }
  }));

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

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  logger.info('Passport authentication configured');
}

module.exports = { configurePassport };
