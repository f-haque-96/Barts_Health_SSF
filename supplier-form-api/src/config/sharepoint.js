/**
 * SharePoint Configuration
 * Document storage and status list management
 */

const { SPFetchClient } = require('@pnp/nodejs');
const { sp } = require('@pnp/sp');
const logger = require('./logger');

let spContext = null;

async function initializeSharePoint() {
  try {
    // Configure SharePoint connection
    sp.setup({
      sp: {
        fetchClientFactory: () => {
          return new SPFetchClient(
            process.env.SP_SITE_URL,
            process.env.SP_CLIENT_ID,
            process.env.SP_CLIENT_SECRET
          );
        }
      }
    });

    // Test connection
    const web = await sp.web.get();
    logger.info(`Connected to SharePoint site: ${web.Title}`);

    spContext = sp;
    return sp;
  } catch (error) {
    logger.error('SharePoint connection failed:', error);
    throw error;
  }
}

function getSP() {
  if (!spContext) {
    throw new Error('SharePoint not initialized');
  }
  return spContext;
}

module.exports = {
  initializeSharePoint,
  getSP
};
