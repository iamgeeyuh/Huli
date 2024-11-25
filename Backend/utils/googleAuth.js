const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

// Environment variables for your Google OAuth credentials
const CLIENT_ID = process.env.CLIENT_ID; // Google Client ID
const CLIENT_SECRET = process.env.CLIENT_SECRET; // Google Client Secret
const REDIRECT_URI = process.env.REDIRECT_URI; // Redirect URI (e.g., http://localhost:5001/auth/callback)

// Create an OAuth2 client instance
const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

/**
 * Generate the Google OAuth authentication URL.
 * Redirect users to this URL to log in and authorize access.
 */
function getAuthUrl() {
  const scopes = [
    "https://www.googleapis.com/auth/calendar", // Access to Google Calendar
    "https://www.googleapis.com/auth/calendar.events", // Manage calendar events
    "openid", // For Google Sign-In (ID token)
    "email", // Access the user's email
    "profile", // Access the user's profile
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline", // Allows token refresh
    prompt: "consent", // Force consent screen every time
    scope: scopes,
  });
}

/**
 * Exchange an authorization code for access and refresh tokens.
 * @param {string} code - Authorization code from Google's callback.
 * @returns {Promise<object>} - Tokens (access_token, refresh_token, etc.).
 */
async function getTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

/**
 * Set the OAuth2 client credentials.
 * @param {object} tokens - The tokens to set (access_token, refresh_token, etc.).
 */
function setCredentials(tokens) {
  oauth2Client.setCredentials(tokens);
}

/**
 * Get the OAuth2 client instance (with current credentials).
 * @returns {OAuth2} - Configured OAuth2 client.
 */
function getClient() {
  return oauth2Client;
}

/**
 * Refresh the access token if it has expired.
 * @returns {Promise<object>} - New access token.
 */
async function refreshAccessToken() {
  const newTokens = await oauth2Client.refreshAccessToken();
  oauth2Client.setCredentials(newTokens.credentials);
  return newTokens.credentials;
}

module.exports = {
  getAuthUrl,
  getTokens,
  setCredentials,
  getClient,
  refreshAccessToken,
};
