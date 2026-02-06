/**
 * NHS Supplier Setup Form API
 * Main Application Entry Point
 *
 * CRITICAL: This API must be deployed on an internal server only.
 * It handles sensitive supplier and banking data.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// SECURITY: Replaced deprecated 'csurf' with maintained 'csrf-csrf' package
const { doubleCsrf } = require('csrf-csrf');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { initializeDatabase, getPool } = require('./config/database');
const { initializeSharePoint, getSP } = require('./config/sharepoint');
const { configurePassport } = require('./config/auth');
const { auditMiddleware } = require('./middleware/audit');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Validate required environment variables on startup
const requiredEnvVars = [
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'AZURE_AD_CLIENT_ID', 'AZURE_AD_TENANT_ID',
  'SP_SITE_URL', 'SP_CLIENT_ID', 'SP_CLIENT_SECRET',
  'SESSION_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  logger.error('Please set all required environment variables before starting the server');
  process.exit(1);
}

// Security middleware with enhanced CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration - only allow frontend origin
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'] // Allow CSRF token header
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Configure Passport authentication
configurePassport(app);

// CSRF Protection using maintained csrf-csrf library (double-submit cookie pattern)
// SECURITY: Replaced deprecated 'csurf' with 'csrf-csrf'
const {
  generateToken, // Generates a CSRF token
  validateRequest, // Validates CSRF token in request
  doubleCsrfProtection, // Middleware for protection
} = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET, // Use session secret
  cookieName: '__Host-csrf-token', // Cookie name (secure prefix)
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
  size: 64, // Token size
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Don't require CSRF for these
  getTokenFromRequest: (req) => req.headers['x-csrf-token'], // Read from header
});

// Apply CSRF protection to all state-changing API routes
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return doubleCsrfProtection(req, res, next);
  }
  next();
});

// Provide CSRF token to clients
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = generateToken(req, res);
  res.json({ csrfToken });
});

// Audit logging middleware
app.use('/api', auditMiddleware);

// Public health check endpoint (minimal information)
// SECURITY: Does not expose infrastructure details to unauthenticated users
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check endpoint (requires authentication)
// SECURITY: Only authenticated users can see dependency status
app.get('/api/health/detailed', async (req, res) => {
  // TODO: Add authentication middleware here (requireAuth)
  // For now, checking if user is authenticated via session
  if (!req.user && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown',
      sharepoint: 'unknown'
    }
  };

  // Check database connection
  try {
    const pool = getPool();
    await pool.request().query('SELECT 1');
    health.checks.database = 'connected';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'unhealthy';
    logger.error('Health check: Database connection failed', error);
  }

  // Check SharePoint connection
  try {
    const sp = getSP();
    await sp.web.get();
    health.checks.sharepoint = 'connected';
  } catch (error) {
    health.checks.sharepoint = 'error';
    health.status = 'unhealthy';
    logger.error('Health check: SharePoint connection failed', error);
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Validate required environment variables for production
function validateEnvironmentVariables() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const requiredVars = [
    'SESSION_SECRET',
    'CORS_ORIGIN',
  ];

  const productionRequiredVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'AZURE_AD_TENANT_ID',
    'AZURE_AD_CLIENT_ID',
    'AZURE_AD_CLIENT_SECRET',
    'SP_SITE_URL',
    'SP_CLIENT_ID',
    'SP_CLIENT_SECRET',
    'SP_TENANT_ID',
  ];

  const missing = [];
  const warnings = [];

  // Check always-required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check SESSION_SECRET is not the development default
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.includes('dev-secret')) {
    if (!isDevelopment) {
      missing.push('SESSION_SECRET (using insecure development default)');
    } else {
      warnings.push('SESSION_SECRET is using development default - generate a secure one for production');
    }
  }

  // Check production-only required variables
  if (!isDevelopment) {
    productionRequiredVars.forEach(varName => {
      const value = process.env[varName];
      if (!value || value.includes('placeholder') || value.includes('00000000-0000-0000-0000-000000000000')) {
        missing.push(`${varName} (has placeholder value)`);
      }
    });
  } else {
    // In development, just warn about missing production variables
    productionRequiredVars.forEach(varName => {
      if (!process.env[varName] || process.env[varName].includes('placeholder')) {
        warnings.push(`${varName} not configured - some features may not work`);
      }
    });
  }

  // Log warnings for development
  if (warnings.length > 0 && isDevelopment) {
    warnings.forEach(warning => logger.warn(warning));
  }

  // Fail fast in production or for critical missing vars
  if (missing.length > 0) {
    logger.error('FATAL: Missing or invalid required environment variables:');
    missing.forEach(varName => logger.error(`  - ${varName}`));
    if (!isDevelopment) {
      logger.error('Cannot start in production mode without all required environment variables');
      logger.error('Please check your .env file and ensure all placeholders are replaced');
      process.exit(1);
    }
  }
}

// Initialize services and start server
async function startServer() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  try {
    // Validate environment variables first
    validateEnvironmentVariables();

    // Initialize database connection (optional in development)
    try {
      await initializeDatabase();
      logger.info('Database connection established');
    } catch (dbError) {
      if (isDevelopment) {
        logger.warn('Database connection failed (continuing in dev mode):', dbError.message);
        logger.warn('Database-dependent features will not work');
      } else {
        logger.error('Database connection failed in production:', dbError.message);
        throw dbError;
      }
    }

    // Initialize SharePoint connection (optional in development)
    try {
      await initializeSharePoint();
      logger.info('SharePoint connection established');
    } catch (spError) {
      if (isDevelopment) {
        logger.warn('SharePoint connection failed (continuing in dev mode):', spError.message);
        logger.warn('Document upload features will not work');
      } else {
        logger.error('SharePoint connection failed in production:', spError.message);
        throw spError;
      }
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`NHS Supplier Form API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      if (isDevelopment) {
        logger.info('Development mode: Some features may be limited if database/SharePoint are not configured');
      } else {
        logger.info('Production mode: All systems operational');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
