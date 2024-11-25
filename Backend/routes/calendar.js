const express = require("express");
const { getAuthURL, getAccessToken, oauth2Client } = require("../utils/googleAuth");
const router = express.Router();

// Step 1: Redirect to Google Auth URL
router.get("/google", (req, res) => {
    const authURL = getAuthURL();
    res.redirect(authURL); // Redirects user to Google's login page
});

// Step 2: Handle Google OAuth callback
router.get("/google/callback", async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send("Authorization code not provided!");
    }

    try {
        // Exchange the code for tokens
        const tokens = await getAccessToken(code);

        // Save tokens securely (e.g., database, session, etc.)
        // Example:
        // await User.update({ email: req.user.email }, { googleTokens: tokens });

        res.send("Google Calendar linked successfully!");
    } catch (error) {
        console.error("Error exchanging code for tokens:", error);
        res.status(500).send("Failed to authenticate with Google");
    }
});

module.exports = router;
