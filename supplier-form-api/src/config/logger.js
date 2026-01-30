/**
 * Winston Logger Configuration
 */

const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'supplier-form-api' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File output
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || './logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Error file
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error'
    })
  ]
});

module.exports = logger;
