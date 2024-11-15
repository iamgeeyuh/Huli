const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });

        const payload = ticket.getPayload();

        req.user = {
            email: payload.email, 
            name: payload.name, 
        };

        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
}

module.exports = verifyToken;