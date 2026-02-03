/**
 * SQL Server Database Configuration
 * Connects to SupplierSetupDB for form data storage
 */

const sql = require('mssql');
const logger = require('./logger');

const config = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'SupplierSetupDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV !== 'production',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Use Windows Authentication if configured
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  delete config.user;
  delete config.password;
  config.options.trustedConnection = true;
}

let pool = null;

async function initializeDatabase() {
  try {
    pool = await sql.connect(config);
    logger.info('Connected to SQL Server database');
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return pool;
}

async function query(queryString, params = []) {
  const pool = getPool();
  const request = pool.request();

  // Add parameters
  params.forEach((param, index) => {
    request.input(`param${index}`, param);
  });

  return request.query(queryString);
}

module.exports = {
  initializeDatabase,
  getPool,
  query,
  sql
};
