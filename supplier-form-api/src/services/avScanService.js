/**
 * Antivirus Scanning Service
 * C8: Scans uploaded files before storage
 *
 * Supports:
 *   1. Windows Defender (MpCmdRun.exe) - default on NHS Windows servers
 *   2. ClamAV (clamscan) - cross-platform fallback
 *   3. Configurable skip for development environments
 *
 * Required environment variables (optional - auto-detected):
 *   AV_SCANNER    - 'defender' | 'clamav' | 'none' (default: auto-detect)
 *   AV_SCAN_PATH  - Custom path to scanner binary (optional)
 */

const { execFile } = require('child_process');
const { writeFile, unlink, mkdtemp } = require('fs/promises');
const { tmpdir } = require('os');
const path = require('path');
const logger = require('../config/logger');

// Default paths for AV scanners
const DEFENDER_PATH = 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';
const CLAMAV_PATH = '/usr/bin/clamscan';

/**
 * Detect which AV scanner is available
 * @returns {'defender'|'clamav'|'none'}
 */
function detectScanner() {
  const configured = process.env.AV_SCANNER;
  if (configured) return configured;

  // In development, skip AV scanning
  if (process.env.NODE_ENV !== 'production') {
    logger.info('AV scanning: Skipped in development mode');
    return 'none';
  }

  // Auto-detect on Windows → Defender
  if (process.platform === 'win32') {
    return 'defender';
  }

  // Auto-detect on Linux → ClamAV
  return 'clamav';
}

/**
 * Run Windows Defender scan on a file
 * @param {string} filePath - Path to file to scan
 * @returns {Promise<{clean: boolean, details: string}>}
 */
function scanWithDefender(filePath) {
  const scannerPath = process.env.AV_SCAN_PATH || DEFENDER_PATH;

  return new Promise((resolve, reject) => {
    execFile(scannerPath, ['-Scan', '-ScanType', '3', '-File', filePath, '-DisableRemediation'], {
      timeout: 60000, // 60-second timeout
    }, (error, stdout, stderr) => {
      // Defender exit codes: 0 = clean, 2 = threat found
      if (!error || error.code === 0) {
        resolve({ clean: true, details: 'No threats detected (Windows Defender)' });
      } else if (error.code === 2) {
        logger.warn(`AV THREAT DETECTED in ${filePath}: ${stdout}`);
        resolve({ clean: false, details: `Threat detected: ${stdout.trim()}` });
      } else {
        // Scanner error (not a threat detection)
        logger.error(`Windows Defender scan error: ${stderr || error.message}`);
        reject(new Error(`AV scan failed: ${error.message}`));
      }
    });
  });
}

/**
 * Run ClamAV scan on a file
 * @param {string} filePath - Path to file to scan
 * @returns {Promise<{clean: boolean, details: string}>}
 */
function scanWithClamAV(filePath) {
  const scannerPath = process.env.AV_SCAN_PATH || CLAMAV_PATH;

  return new Promise((resolve, reject) => {
    execFile(scannerPath, ['--no-summary', filePath], {
      timeout: 60000,
    }, (error, stdout, stderr) => {
      // ClamAV exit codes: 0 = clean, 1 = virus found, 2 = error
      if (!error || error.code === 0) {
        resolve({ clean: true, details: 'No threats detected (ClamAV)' });
      } else if (error.code === 1) {
        logger.warn(`AV THREAT DETECTED in ${filePath}: ${stdout}`);
        resolve({ clean: false, details: `Threat detected: ${stdout.trim()}` });
      } else {
        logger.error(`ClamAV scan error: ${stderr || error.message}`);
        reject(new Error(`AV scan failed: ${error.message}`));
      }
    });
  });
}

/**
 * Scan a file buffer for malware
 *
 * @param {Buffer} buffer - File content to scan
 * @param {string} originalName - Original filename (for temp file extension)
 * @returns {Promise<{clean: boolean, details: string, scanned: boolean}>}
 */
async function scanBuffer(buffer, originalName) {
  const scanner = detectScanner();

  // Skip scanning in development or if explicitly disabled
  if (scanner === 'none') {
    return { clean: true, details: 'AV scanning skipped (development mode)', scanned: false };
  }

  // Write buffer to a temporary file for scanning
  let tempDir;
  let tempFile;

  try {
    tempDir = await mkdtemp(path.join(tmpdir(), 'av-scan-'));
    const ext = path.extname(originalName) || '.bin';
    tempFile = path.join(tempDir, `scan${ext}`);
    await writeFile(tempFile, buffer);

    // Run the appropriate scanner
    let result;
    if (scanner === 'defender') {
      result = await scanWithDefender(tempFile);
    } else if (scanner === 'clamav') {
      result = await scanWithClamAV(tempFile);
    } else {
      return { clean: true, details: `Unknown scanner: ${scanner}`, scanned: false };
    }

    return { ...result, scanned: true };
  } catch (error) {
    logger.error('AV scan failed:', error.message);
    // SECURITY: Fail closed - reject the upload if scanning fails
    throw new Error(`Antivirus scan failed: ${error.message}. Upload rejected for security.`);
  } finally {
    // Clean up temp file
    if (tempFile) {
      try {
        await unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
    if (tempDir) {
      try {
        const { rmdir } = require('fs/promises');
        await rmdir(tempDir);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

module.exports = { scanBuffer, detectScanner };
