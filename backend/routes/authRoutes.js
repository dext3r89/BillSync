const express = require('express');
const router = express.Router();
const {
  getAuthCodeUrl,
  acquireTokenByCode,
  isAuthenticated,
  clearTokenCache
} = require('../services/microsoftAuthService');

/**
 * GET /auth/microsoft
 * Redirect user to Microsoft login page
 */
router.get('/microsoft', async (req, res) => {
  try {
    const authCodeUrl = await getAuthCodeUrl();
    console.log('📱 Redirecting to Microsoft login...');
    res.redirect(authCodeUrl);
  } catch (error) {
    console.error('Error during Microsoft login:', error.message);
    res.status(500).json({
      error: 'Failed to initiate Microsoft login',
      message: error.message
    });
  }
});

/**
 * GET /auth/microsoft/callback
 * Handle OAuth callback from Microsoft
 */
router.get('/microsoft/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  // Handle errors from Microsoft
  if (error) {
    console.error('Microsoft OAuth error:', error_description);
    return res.status(400).json({
      error: error,
      description: error_description
    });
  }

  if (!code) {
    return res.status(400).json({
      error: 'Missing authorization code'
    });
  }

  try {
    // Exchange code for token
    const tokenResponse = await acquireTokenByCode(code);

    console.log('✅ User authenticated successfully');

    // Return success response
    // In a real app, you'd set an HTTP-only cookie or redirect to a dashboard
    res.json({
      success: true,
      message: 'Authentication successful',
      expiresOn: tokenResponse.expiresOn,
      scopes: tokenResponse.scopes
    });
  } catch (error) {
    console.error('Error during token exchange:', error.message);
    res.status(500).json({
      error: 'Token exchange failed',
      message: error.message
    });
  }
});

/**
 * GET /auth/status
 * Check authentication status
 */
router.get('/status', (req, res) => {
  const authenticated = isAuthenticated();
  res.json({
    authenticated,
    message: authenticated ? 'User is authenticated' : 'User is not authenticated'
  });
});

/**
 * POST /auth/logout
 * Clear authentication token
 */
router.post('/logout', (req, res) => {
  clearTokenCache();
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
