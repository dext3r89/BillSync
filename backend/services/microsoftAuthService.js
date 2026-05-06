const { ConfidentialClientApplication } = require('@azure/msal-node');

// Store tokens in memory (for demo; use Redis/DB in production)
let tokenCache = {};

const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID || '',
    clientSecret: process.env.MS_CLIENT_SECRET || '',
    authority: `https://login.microsoftonline.com/common` // Multi-tenant
  }
};

const scopes = ['User.Read', 'Mail.Read', 'Calendars.Read'];

let cca;

function initializeMsal() {
  if (!msalConfig.auth.clientId || !msalConfig.auth.clientSecret) {
    console.warn('Microsoft Graph credentials not configured. Skipping MSAL initialization.');
    return null;
  }

  try {
    cca = new ConfidentialClientApplication(msalConfig);
    console.log('✓ MSAL initialized successfully');
    return cca;
  } catch (error) {
    console.error('Failed to initialize MSAL:', error.message);
    return null;
  }
}

/**
 * Generate the Microsoft login URL
 */
async function getAuthCodeUrl() {
  if (!cca) {
    throw new Error('MSAL not initialized. Check MS_CLIENT_ID and MS_CLIENT_SECRET');
  }

  const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3001/auth/microsoft/callback';

  try {
    const authCodeUrl = await cca.getAuthCodeUrl({
      scopes,
      redirectUri,
      codeChallenge: undefined // Use PKCE if needed, omit for simplicity
    });

    return authCodeUrl;
  } catch (error) {
    console.error('Error generating auth code URL:', error.message);
    throw error;
  }
}

/**
 * Exchange authorization code for access token
 */
async function acquireTokenByCode(code) {
  if (!cca) {
    throw new Error('MSAL not initialized');
  }

  const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3001/auth/microsoft/callback';

  try {
    const tokenResponse = await cca.acquireTokenByCode({
      code,
      scopes,
      redirectUri
    });

    if (!tokenResponse || !tokenResponse.accessToken) {
      throw new Error('No access token received');
    }

    // Store token in memory cache (demo approach)
    tokenCache.accessToken = tokenResponse.accessToken;
    tokenCache.expiresOn = tokenResponse.expiresOn;
    tokenCache.refreshToken = tokenResponse.refreshToken;

    console.log('✓ Token acquired and cached');

    return tokenResponse;
  } catch (error) {
    console.error('Error acquiring token by code:', error.message);
    throw error;
  }
}

/**
 * Get stored access token
 */
function getAccessToken() {
  if (!tokenCache.accessToken) {
    throw new Error('No access token found. User must authenticate first.');
  }

  // Check if token is expired
  if (tokenCache.expiresOn && new Date() > new Date(tokenCache.expiresOn)) {
    console.warn('Access token expired. Attempting refresh...');
    // In production, refresh the token using refreshToken
    return null;
  }

  return tokenCache.accessToken;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!tokenCache.accessToken;
}

/**
 * Clear token cache (logout)
 */
function clearTokenCache() {
  tokenCache = {};
  console.log('✓ Token cache cleared');
}

module.exports = {
  initializeMsal,
  getAuthCodeUrl,
  acquireTokenByCode,
  getAccessToken,
  isAuthenticated,
  clearTokenCache
};
