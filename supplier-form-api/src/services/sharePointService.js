/**
 * SharePoint Service
 * Handles document uploads to SharePoint libraries
 */

const { getSharePointClient } = require('../config/sharepoint');
const { logAudit } = require('./auditService');
const { isSensitiveDocument, getSharePointLibrary } = require('./documentService');
const logger = require('../config/logger');

/**
 * Upload document to SharePoint
 */
async function uploadDocument(submissionId, documentType, file, user) {
  try {
    const client = await getSharePointClient();
    const library = getSharePointLibrary(documentType);
    const isSensitive = isSensitiveDocument(documentType);

    // Create folder path: /submissionId/documentType/
    const folderPath = `${submissionId}/${documentType}`;
    const fileName = file.originalname;
    const fullPath = `${library}/${folderPath}/${fileName}`;

    // Ensure folder exists
    await ensureFolderExists(client, library, folderPath);

    // Upload file
    const siteUrl = process.env.SP_SITE_URL;
    const uploadUrl = `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${library}/${folderPath}')/Files/add(url='${fileName}',overwrite=true)`;

    const response = await client.api(uploadUrl)
      .put(file.buffer);

    const sharePointPath = response.ServerRelativeUrl || fullPath;

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
async function ensureFolderExists(client, library, folderPath) {
  try {
    const siteUrl = process.env.SP_SITE_URL;
    const parts = folderPath.split('/').filter(p => p);
    let currentPath = library;

    for (const part of parts) {
      currentPath = `${currentPath}/${part}`;
      try {
        await client.api(`${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${currentPath}')`)
          .get();
      } catch {
        // Folder doesn't exist, create it
        await client.api(`${siteUrl}/_api/web/folders`)
          .post({ ServerRelativeUrl: currentPath });
      }
    }
  } catch (error) {
    logger.error('Failed to ensure folder exists:', error);
    throw error;
  }
}

/**
 * Get document download URL from SharePoint
 */
async function getDocumentUrl(sharePointPath) {
  try {
    const client = await getSharePointClient();
    const siteUrl = process.env.SP_SITE_URL;

    const response = await client.api(
      `${siteUrl}/_api/web/GetFileByServerRelativeUrl('${sharePointPath}')`
    ).get();

    return response['@odata.id'] || `${siteUrl}${sharePointPath}`;
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
    const client = await getSharePointClient();
    const siteUrl = process.env.SP_SITE_URL;

    await client.api(
      `${siteUrl}/_api/web/GetFileByServerRelativeUrl('${sharePointPath}')`
    ).delete();

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
    const client = await getSharePointClient();
    const siteUrl = process.env.SP_SITE_URL;
    const folderPath = `${library}/${submissionId}`;

    const response = await client.api(
      `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${folderPath}')/Files`
    ).get();

    return response.value.map(file => ({
      name: file.Name,
      path: file.ServerRelativeUrl,
      size: file.Length,
      created: file.TimeCreated,
      modified: file.TimeLastModified
    }));
  } catch (error) {
    if (error.statusCode === 404) {
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
