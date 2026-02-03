/**
 * SharePoint Service
 * Handles document uploads to SharePoint libraries using @pnp/sp
 */

const { getSP } = require('../config/sharepoint');
const { logAudit } = require('./auditService');
const { isSensitiveDocument, getSharePointLibrary } = require('./documentService');
const logger = require('../config/logger');

/**
 * Upload document to SharePoint
 */
async function uploadDocument(submissionId, documentType, file, user) {
  try {
    const sp = getSP();
    const library = getSharePointLibrary(documentType);
    const isSensitive = isSensitiveDocument(documentType);

    // Create folder path: /submissionId/documentType/
    const folderPath = `${submissionId}/${documentType}`;
    const fileName = file.originalname;
    const fullPath = `/${library}/${folderPath}/${fileName}`;

    // Ensure folder exists
    await ensureFolderExists(sp, library, folderPath);

    // Upload file using @pnp/sp
    const folder = sp.web.getFolderByServerRelativeUrl(`/${library}/${folderPath}`);
    const uploadResult = await folder.files.addUsingPath(fileName, file.buffer, { Overwrite: true });

    const sharePointPath = uploadResult.data.ServerRelativeUrl;

    // Log audit
    await logAudit({
      submissionId,
      action: isSensitive ? 'SENSITIVE_DOCUMENT_UPLOADED' : 'DOCUMENT_UPLOADED',
      user: user.email,
      details: {
        documentType,
        fileName,
        library,
        sharePointPath,
        isSensitive
      }
    });

    logger.info(`Document uploaded to SharePoint: ${sharePointPath}`, {
      submissionId,
      documentType,
      library,
      user: user.email
    });

    return {
      sharePointPath,
      library,
      fileName
    };
  } catch (error) {
    logger.error('Failed to upload to SharePoint:', error);
    throw error;
  }
}

/**
 * Ensure folder structure exists in SharePoint
 */
async function ensureFolderExists(sp, library, folderPath) {
  try {
    const parts = folderPath.split('/').filter(p => p);
    let currentPath = `/${library}`;

    for (const part of parts) {
      currentPath = `${currentPath}/${part}`;
      try {
        // Try to get the folder - will throw if doesn't exist
        await sp.web.getFolderByServerRelativeUrl(currentPath).get();
      } catch {
        // Folder doesn't exist, create it
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        await sp.web.getFolderByServerRelativeUrl(parentPath).folders.addUsingPath(part);
      }
    }
  } catch (error) {
    logger.error('Failed to ensure folder exists:', error);
    throw error;
  }
}

/**
 * Get document download URL from SharePoint
 * CRITICAL: Logs document access for compliance
 */
async function getDocumentUrl(sharePointPath, user) {
  try {
    const sp = getSP();
    const siteUrl = process.env.SP_SITE_URL;

    const file = await sp.web.getFileByServerRelativeUrl(sharePointPath).get();

    // Log document access for audit trail
    await logAudit({
      action: 'DOCUMENT_ACCESSED',
      user: user?.email || 'system',
      details: {
        sharePointPath,
        fileName: file.Name,
        fileSize: file.Length
      }
    });

    logger.info(`Document accessed: ${sharePointPath}`, {
      user: user?.email
    });

    return `${siteUrl}${sharePointPath}`;
  } catch (error) {
    logger.error('Failed to get document URL:', error);
    throw error;
  }
}

/**
 * Delete document from SharePoint
 */
async function deleteDocument(sharePointPath, user) {
  try {
    const sp = getSP();

    await sp.web.getFileByServerRelativeUrl(sharePointPath).delete();

    logger.info(`Document deleted from SharePoint: ${sharePointPath}`, {
      user: user.email
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to delete from SharePoint:', error);
    throw error;
  }
}

/**
 * List documents in a submission folder
 */
async function listSubmissionDocuments(submissionId, library = 'SupplierDocuments') {
  try {
    const sp = getSP();
    const folderPath = `/${library}/${submissionId}`;

    const folder = sp.web.getFolderByServerRelativeUrl(folderPath);
    const files = await folder.files.select('Name', 'ServerRelativeUrl', 'Length', 'TimeCreated', 'TimeLastModified').get();

    return files.map(file => ({
      name: file.Name,
      path: file.ServerRelativeUrl,
      size: file.Length,
      created: file.TimeCreated,
      modified: file.TimeLastModified
    }));
  } catch (error) {
    if (error.status === 404) {
      return []; // Folder doesn't exist yet
    }
    logger.error('Failed to list SharePoint documents:', error);
    throw error;
  }
}

module.exports = {
  uploadDocument,
  getDocumentUrl,
  deleteDocument,
  listSubmissionDocuments
};
