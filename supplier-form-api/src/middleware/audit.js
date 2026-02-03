/**
 * Audit Logging Middleware
 * Logs all API requests for compliance and security
 */

const logger = require('../config/logger');
const { logAudit } = require('../services/auditService');

const auditMiddleware = async (req, res, next) => {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  res.end = function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    // Log after response is sent
    const duration = Date.now() - startTime;

    const auditData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.email || 'anonymous',
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      // Don't log sensitive body data
      bodyKeys: req.body ? Object.keys(req.body) : []
    };

    // Log to file
    logger.info('API Request', auditData);

    // For sensitive operations, log to database
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.user) {
      logAudit({
        action: `API_${req.method}`,
        resource: req.path,
        user: req.user.email,
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        statusCode: res.statusCode
      }).catch(err => logger.error('Failed to log audit:', err));
    }
  };

  next();
};

module.exports = { auditMiddleware };
