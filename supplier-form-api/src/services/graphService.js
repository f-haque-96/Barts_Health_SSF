/**
 * Microsoft Graph API Service
 * Provides user and group lookups from Azure AD
 *
 * AUDIT FIX C3: Implements server-side group lookup for passport.deserializeUser
 *
 * Required environment variables:
 *   AZURE_AD_TENANT_ID   - Azure AD tenant ID
 *   AZURE_AD_CLIENT_ID   - App registration client ID
 *   AZURE_AD_CLIENT_SECRET - App registration client secret
 *
 * Required Azure AD API permissions (Application type):
 *   - User.Read.All
 *   - GroupMember.Read.All
 */

const logger = require('../config/logger');

// In-memory cache for user data (keyed by OID)
// Production alternative: use Redis or the SQL Server session store
const userCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Get an access token for Microsoft Graph API using client credentials flow
 * @returns {Promise<string>} Access token
 */
async function getGraphToken() {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Graph API credentials not configured (AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET required)');
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Call Microsoft Graph API
 * @param {string} endpoint - Graph API endpoint (e.g., '/users/{oid}')
 * @param {string} token - Access token
 * @returns {Promise<object>} Response data
 */
async function callGraphApi(endpoint, token) {
  const url = `https://graph.microsoft.com/v1.0${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Graph API call failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Look up a user by OID from Azure AD via Microsoft Graph API
 * Returns user info including group memberships
 *
 * @param {string} oid - Azure AD Object ID
 * @returns {Promise<object>} User object with email, name, groups
 */
async function getUserByOid(oid) {
  // Check cache first
  const cached = userCache.get(oid);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.user;
  }

  try {
    const token = await getGraphToken();

    // Fetch user profile and group memberships in parallel
    const [profile, memberOf] = await Promise.all([
      callGraphApi(`/users/${oid}?$select=displayName,mail,userPrincipalName`, token),
      callGraphApi(`/users/${oid}/memberOf?$select=displayName,id`, token),
    ]);

    // Extract group display names (matching the ROLE_GROUPS format)
    const groups = (memberOf.value || [])
      .filter(entry => entry['@odata.type'] === '#microsoft.graph.group')
      .map(group => group.displayName);

    const user = {
      oid,
      email: profile.mail || profile.userPrincipalName,
      name: profile.displayName,
      groups,
    };

    // Cache the result
    userCache.set(oid, { user, timestamp: Date.now() });
    logger.debug(`Graph API: Cached user data for OID ${oid} (${groups.length} groups)`);

    return user;
  } catch (error) {
    logger.error(`Graph API lookup failed for OID ${oid}:`, error.message);
    throw error;
  }
}

/**
 * Cache user data from a bearer token authentication
 * Called during BearerStrategy callback to pre-populate the cache
 * This way, if deserializeUser is called, the cache is warm
 *
 * @param {object} user - User object from BearerStrategy { oid, email, name, groups }
 */
function cacheUserFromToken(user) {
  if (!user || !user.oid) return;

  userCache.set(user.oid, {
    user: {
      oid: user.oid,
      email: user.email,
      name: user.name,
      groups: user.groups || [],
    },
    timestamp: Date.now(),
  });
}

/**
 * Get user from cache without Graph API call
 * Returns null if not cached or expired
 *
 * @param {string} oid - Azure AD Object ID
 * @returns {object|null} Cached user or null
 */
function getCachedUser(oid) {
  const cached = userCache.get(oid);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.user;
  }
  return null;
}

/**
 * Invalidate cached user data (e.g., on logout)
 * @param {string} oid - Azure AD Object ID
 */
function invalidateCache(oid) {
  userCache.delete(oid);
}

/**
 * Check if Graph API credentials are configured
 * @returns {boolean}
 */
function isGraphConfigured() {
  return !!(
    process.env.AZURE_AD_TENANT_ID &&
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET
  );
}

/**
 * Clean up expired cache entries (called periodically)
 */
function cleanupCache() {
  const now = Date.now();
  for (const [oid, entry] of userCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      userCache.delete(oid);
    }
  }
}

// Periodic cache cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000).unref();

module.exports = {
  getUserByOid,
  cacheUserFromToken,
  getCachedUser,
  invalidateCache,
  isGraphConfigured,
};
