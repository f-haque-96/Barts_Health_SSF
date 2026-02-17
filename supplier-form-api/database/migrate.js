/**
 * L9: Database Migration Runner
 *
 * Tracks and applies numbered SQL migrations against SQL Server.
 * Uses a _MigrationHistory table to record which migrations have been applied.
 *
 * Usage:
 *   node database/migrate.js                  # Apply pending migrations
 *   node database/migrate.js --status         # Show migration status
 *   node database/migrate.js --baseline       # Mark all migrations as applied (for existing DBs)
 *
 * Migration files must be in database/migrations/ with format: NNN_description.sql
 * Files are applied in numeric order. Each file runs once and is recorded.
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'SupplierSetupDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV !== 'production',
    enableArithAbort: true,
  },
};

if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  delete dbConfig.user;
  delete dbConfig.password;
  dbConfig.options.trustedConnection = true;
}

/**
 * Ensure the _MigrationHistory tracking table exists
 */
async function ensureMigrationTable(pool) {
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.objects
      WHERE object_id = OBJECT_ID(N'[dbo].[_MigrationHistory]') AND type = 'U'
    )
    BEGIN
      CREATE TABLE _MigrationHistory (
        MigrationID INT IDENTITY(1,1) PRIMARY KEY,
        MigrationName NVARCHAR(255) NOT NULL UNIQUE,
        AppliedAt DATETIME DEFAULT GETUTCDATE(),
        AppliedBy NVARCHAR(255) DEFAULT SUSER_SNAME(),
        Checksum NVARCHAR(64) NULL
      );
      PRINT 'Created _MigrationHistory table';
    END
  `);
}

/**
 * Get list of already-applied migrations from the database
 */
async function getAppliedMigrations(pool) {
  const result = await pool.request().query(
    'SELECT MigrationName, AppliedAt FROM _MigrationHistory ORDER BY MigrationName'
  );
  return new Map(result.recordset.map(r => [r.MigrationName, r.AppliedAt]));
}

/**
 * Get list of migration files from disk, sorted by number
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

/**
 * Simple checksum for change detection
 */
function checksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Apply a single migration file
 */
async function applyMigration(pool, fileName, filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hash = checksum(content);

  console.log(`  Applying: ${fileName}...`);

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    // Split on GO statements (SQL Server batch separator)
    const batches = content
      .split(/^\s*GO\s*$/im)
      .map(b => b.trim())
      .filter(b => b.length > 0);

    for (const batch of batches) {
      const request = new sql.Request(transaction);
      await request.query(batch);
    }

    // Record the migration
    const recordRequest = new sql.Request(transaction);
    await recordRequest
      .input('name', sql.NVarChar(255), fileName)
      .input('hash', sql.NVarChar(64), hash)
      .query('INSERT INTO _MigrationHistory (MigrationName, Checksum) VALUES (@name, @hash)');

    await transaction.commit();
    console.log(`  Done: ${fileName}`);
  } catch (error) {
    try { await transaction.rollback(); } catch (_) { /* ignore rollback errors */ }
    throw new Error(`Migration ${fileName} failed: ${error.message}`);
  }
}

/**
 * Show status of all migrations
 */
async function showStatus(pool) {
  const applied = await getAppliedMigrations(pool);
  const files = getMigrationFiles();

  console.log('\nMigration Status');
  console.log('================');
  console.log('');

  if (files.length === 0) {
    console.log('  No migration files found.');
    return;
  }

  let pendingCount = 0;
  for (const file of files) {
    const appliedAt = applied.get(file);
    if (appliedAt) {
      console.log(`  [APPLIED]  ${file}  (${appliedAt.toISOString()})`);
    } else {
      console.log(`  [PENDING]  ${file}`);
      pendingCount++;
    }
  }

  console.log('');
  console.log(`  Total: ${files.length} | Applied: ${files.length - pendingCount} | Pending: ${pendingCount}`);
  console.log('');
}

/**
 * Mark all migrations as applied without executing (for existing databases)
 */
async function baseline(pool) {
  const applied = await getAppliedMigrations(pool);
  const files = getMigrationFiles();

  console.log('\nBaselining all migrations...');

  let baselinedCount = 0;
  for (const file of files) {
    if (!applied.has(file)) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const hash = checksum(content);

      await pool.request()
        .input('name', sql.NVarChar(255), file)
        .input('hash', sql.NVarChar(64), hash)
        .query('INSERT INTO _MigrationHistory (MigrationName, Checksum) VALUES (@name, @hash)');

      console.log(`  Baselined: ${file}`);
      baselinedCount++;
    }
  }

  if (baselinedCount === 0) {
    console.log('  All migrations already recorded.');
  } else {
    console.log(`\n  Baselined ${baselinedCount} migration(s).`);
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const isStatus = args.includes('--status');
  const isBaseline = args.includes('--baseline');

  let pool;
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(dbConfig);
    console.log('Connected.\n');

    await ensureMigrationTable(pool);

    if (isStatus) {
      await showStatus(pool);
      return;
    }

    if (isBaseline) {
      await baseline(pool);
      return;
    }

    // Default: apply pending migrations
    const applied = await getAppliedMigrations(pool);
    const files = getMigrationFiles();
    const pending = files.filter(f => !applied.has(f));

    if (pending.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);

    for (const file of pending) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      await applyMigration(pool, file, filePath);
    }

    console.log(`\nAll ${pending.length} migration(s) applied successfully.`);
  } catch (error) {
    console.error('\nMigration error:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

main();
