const express = require("express");
const UserChat = require("../models/UserChat");
const verifyToken = require("../middleware/verifyToken");
const { runChat } = require("../utils/LLM");
const { addCalendarEvent } = require("../utils/googleCalendar");

const router = express.Router();

// Testing Route: Chatbot Responds with a Predefined or Dynamic Message
router.post("/test-chat", verifyToken, async (req, res) => {
  console.log("test chat");
  const { message } = req.body;

  const accessToken = req.headers["x-access-token"];

  if (!message || !message.text) {
    return res.status(400).json({ message: "Message text is required" });
  }

  try {
    const email = req.user.email; // Extract user email from token (handled in verifyToken middleware)

    // Find or create a user chat document
    let userChat = await UserChat.findOne({ email });

    if (!userChat) {
      userChat = new UserChat({
        email,
        chatHistory: [],
      });
    }

    const userMessage = message.text.trim();
    let botResponse = "";

    // Scenario logic
    if (userMessage.toLowerCase().includes("schedule laundry")) {
      (botResponse = `Sure! Adding “Laundry” to your calendar for 9 PM tonight. Would you like me to set a reminder?`),
        addCalendarEvent(accessToken, {
          summary: "Laundry",
          start: {
            dateTime: "2024-11-27T02:00:00Z",
          },
          end: {
            dateTime: "2024-11-27T03:00:00Z",
          },
        });
    } else if (userMessage.toLowerCase().includes("yes, please")) {
      botResponse = `Reminder set for 8:45 PM. Anything else?`;

      addCalendarEvent(accessToken, {
        summary: "Laundry reminder",
        start: {
          dateTime: "2024-11-27T01:45:00Z",
        },
        end: { dateTime: "2024-11-27T01:45:00Z" },
      });
    } else if (userMessage.toLowerCase().includes("schedule a meeting")) {
      botResponse = `Got it. Since you’ll be on main campus for class this Friday, I noticed a free slot right after that—would you like to move the meeting to Friday instead? It could save you a trip and minimize commute time!`;
    } else if (userMessage.toLowerCase().includes("let’s do friday")) {
      botResponse = `Great choice! Scheduling “Meeting on main campus” for Friday at 12 PM. Let me know if anything changes.`;

      addCalendarEvent(accessToken, {
        summary: "Meeting",
        start: {
          dateTime: "2024-11-29T17:00:00Z",
        },
        end: { dateTime: "2024-11-29T18:00:00Z" },
      });
    } else if (userMessage.toLowerCase().includes("stressed with school")) {
      botResponse = `I’m sorry to hear that. What’s been stressing you out?`;
    } else if (userMessage.toLowerCase().includes("assignments and exams")) {
      botResponse = `That sounds overwhelming. Want me to block out some study sessions in your calendar?`;
    } else if (userMessage.toLowerCase().includes("study sessions")) {
      botResponse = `Got it. I’ll schedule study sessions from 7 PM to 9 PM every evening. And remember, taking breaks is just as important as studying!`;
      addCalendarEvent(accessToken, {
        summary: "study session",
        start: {
          dateTime: "2024-11-28T00:00:00Z",
        },
        end: { dateTime: "2024-11-28T02:00:00Z" },
      });
      addCalendarEvent(accessToken, {
        summary: "study session",
        start: {
          dateTime: "2024-11-29T00:00:00Z",
        },
        end: { dateTime: "2024-11-29T02:00:00Z" },
      });
      addCalendarEvent(accessToken, {
        summary: "study session",
        start: {
          dateTime: "2024-11-30T00:00:00Z",
        },
        end: { dateTime: "2024-11-30T02:00:00Z" },
      });
    } else if (userMessage.toLowerCase().includes("thank you")) {
      botResponse = `No problem!`;
    } else {
      botResponse = `I’m sorry, I’m not sure how to help with that. Can you rephrase?`;
    }

    // Add user message and bot responses to chat history
    userChat.chatHistory.push({
      text: userMessage,
      isUserMessage: true,
    });

    userChat.chatHistory.push({
      text: botResponse,
      isUserMessage: false,
    });

    // Save the updated chat history to the database
    await userChat.save();

    // Return the bot responses to the frontend
    res.status(200).json({
      text: botResponse,
      isUserMessage: false,
    });
  } catch (err) {
    console.error("Error generating chatbot response:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create or Update User and Add a New Message
router.post("/", verifyToken, async (req, res) => {
  console.log("chat");
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    const email = req.user.email;
    //req.user.email;

    let userChat = await UserChat.findOne({ email });

    if (!userChat) {
      // If the user doesn't exist, create a new user
      userChat = new UserChat({
        email,
        chatHistory: [],
      });
    }

    // Add the new message to the chat history
    userChat.chatHistory.push({
      text: message.text,
      isUserMessage: message.isUserMessage,
    });

    // Generate the bot response using `runChat`
    const botResponse = await runChat(message.text);

    // Add the bot response to the chat history
    userChat.chatHistory.push({
      text: botResponse,
      isUserMessage: false,
    });

    await userChat.save();

    // Send the bot response back to the frontend
    res.status(200).json({
      text: botResponse,
      isUserMessage: false,
    });
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
    const paginatedChatHistory = userChat.chatHistory.slice(
      startIndex,
      startIndex + parseInt(limit)
    );

    res.status(200).json({
      totalMessages: userChat.chatHistory.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(userChat.chatHistory.length / limit),
      messages: paginatedChatHistory,
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
