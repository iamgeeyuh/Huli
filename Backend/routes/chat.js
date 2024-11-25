const express = require("express");
const UserChat = require("../models/UserChat");
const verifyToken = require("../middleware/verifyToken"); 
const { runChat } = require("../utils/LLM");

const router = express.Router();

// Testing Route: Chatbot Responds with a Predefined or Dynamic Message
router.post("/test-chat", verifyToken, async (req, res) => {
    const { message } = req.body;

    if (!message || !message.text) {
        return res.status(400).json({ message: "Message text is required" });
    }

    try {
        const email = "jzh9076@nyu.edu"
        //req.user.email; // Extract user email from token (handled in verifyToken middleware)

        // Find or create a user chat document
        let userChat = await UserChat.findOne({ email });

        if (!userChat) {
            userChat = new UserChat({
                email,
                chatHistory: []
            });
        }

        // Add the user message to the chat history
        userChat.chatHistory.push({
            text: message.text,
            isUserMessage: true
        });

        // Generate a bot response
        const botResponse = "This is a bot response!";

        // Add the bot response to the chat history
        userChat.chatHistory.push({
            text: botResponse,
            isUserMessage: false
        });

        // Save the updated chat history to the database
        await userChat.save();

        // Return the bot response to the frontend
        res.status(200).json({
            text: botResponse,
            isUserMessage: false
        });
    } catch (err) {
        console.error("Error generating chatbot response:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Create or Update User and Add a New Message
router.post("/", verifyToken, async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ message: "Message is required" });
    }

    try {
        const email = "ly2375@nyu.edu";
        //req.user.email; 

        let userChat = await UserChat.findOne({ email });

        if (!userChat) {
            // If the user doesn't exist, create a new user
            userChat = new UserChat({
                email,
                chatHistory: []
            });
        }

        // Add the new message to the chat history
        userChat.chatHistory.push({
            text: message.text,
            isUserMessage: message.isUserMessage
        });
        
        // Generate the bot response using `runChat`
        const botResponse = await runChat(message.text);
        
        // Add the bot response to the chat history
        userChat.chatHistory.push({
            text: botResponse,
            isUserMessage: false
        });

        await userChat.save();

        // Send the bot response back to the frontend
        res.status(200).json(botResponse);

    } catch (err) {
        console.error("Error adding message:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get Chat History for a User
router.get("/", verifyToken, async (req, res) => {
    const email = req.user.email; 
    const { page = 1, limit = 10 } = req.query; // Default values: page 1, 10 messages per page

    try {
        const userChat = await UserChat.findOne({ email });

        if (!userChat) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate the start index for pagination
        const startIndex = (page - 1) * limit;

        // Paginate chat history
        const paginatedChatHistory = userChat.chatHistory
            .slice(startIndex, startIndex + parseInt(limit));

        res.status(200).json({
            totalMessages: userChat.chatHistory.length,
            currentPage: parseInt(page),
            totalPages: Math.ceil(userChat.chatHistory.length / limit),
            messages: paginatedChatHistory
        });
    } catch (err) {
        console.error("Error fetching chat history:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Clear Chat History for a User
router.delete("/", verifyToken, async (req, res) => {
    const email = req.user.email; 

    try {
        const userChat = await UserChat.findOne({ email });

        if (!userChat) {
            return res.status(404).json({ message: "User not found" });
        }

        userChat.chatHistory = [];
        await userChat.save();

        res.status(200).json({ message: "Chat history cleared" });
    } catch (err) {
        console.error("Error clearing chat history:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;