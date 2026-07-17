/**
 * MSAL (Azure AD) authentication for the production Graph provider.
 *
 * Only loaded when VITE_AZURE_CLIENT_ID is configured — dev/demo builds never
 * import this module (see StorageProvider selection). Sign-in uses the
 * redirect flow (NHS managed browsers often block popups).
 *
 * Scopes: User.Read (identity) + Sites.Selected via the Graph default scope —
 * the app's real SharePoint reach is whatever the admin granted on the site
 * (design doc 06 §3 / IT_REQUEST_EMAIL.md technical annex).
 */

import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

const GRAPH_SCOPES = ['User.Read', 'Sites.Selected'];

let msalInstance = null;
let initPromise = null;

const getConfig = () => ({
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    // sessionStorage: tokens die with the tab — right default for shared
    // NHS workstations
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
});

/** Initialise MSAL and complete any pending redirect. Idempotent. */
export const initAuth = () => {
  if (!initPromise) {
    msalInstance = new PublicClientApplication(getConfig());
    initPromise = msalInstance
      .initialize()
      .then(() => msalInstance.handleRedirectPromise())
      .then((result) => {
        if (result?.account) {
          msalInstance.setActiveAccount(result.account);
        } else {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) msalInstance.setActiveAccount(accounts[0]);
        }
        return msalInstance;
      });
  }
  return initPromise;
};

/** The signed-in account, or null. */
export const getAccount = async () => {
  await initAuth();
  return msalInstance.getActiveAccount();
};

/** Start sign-in (full-page redirect — does not resolve). */
export const signIn = async () => {
  await initAuth();
  await msalInstance.loginRedirect({ scopes: GRAPH_SCOPES });
};

/**
 * Access token for Microsoft Graph. Silent first; falls back to a redirect
 * when interaction is required (expired session, consent).
 */
export const getGraphToken = async () => {
  await initAuth();
  const account = msalInstance.getActiveAccount();
  if (!account) {
    await signIn();
    return null; // unreachable — redirect navigates away
  }
  try {
    const result = await msalInstance.acquireTokenSilent({ scopes: GRAPH_SCOPES, account });
    return result.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes: GRAPH_SCOPES, account });
      return null;
    }
    throw err;
  }
};

export const signOut = async () => {
  await initAuth();
  await msalInstance.logoutRedirect();
};
