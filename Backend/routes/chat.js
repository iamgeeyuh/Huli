const express = require("express");
const UserChat = require("../models/UserChat");
const verifyToken = require("../middleware/verifyToken");
const { runChat } = require("../utils/LLM");
const { addCalendarEvent, deleteCalendarEvent } = require("../utils/googleCalendar");

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

    // Scenario 1: Scheduling lunch
    if (userMessage.toLowerCase().includes("lunch")) {
      botResponse = `Got it! Adding “Lunch” to your calendar for tomorrow at 11 AM. Let me know if there’s anything else!`;

      addCalendarEvent(accessToken, {
        summary: "Lunch",
        start: {
          dateTime: "2024-12-11T16:00:00Z"
        },
        end: {
          dateTime: "2024-12-11T17:00:00Z"
        }, 
      });
    }
    // Scenario 2: Exam and study session personalization
    else if (userMessage.toLowerCase().includes("exam")) {

      if (req.user.email == "ly2375@nyu.edu") {
        botResponse = `Noted! You prefer studying in short sessions. I’ll schedule study blocks leading up to your exam. Stay hydrated and take breaks!`;

        // Schedule multiple small study sessions
        const studySessions = [
          { start: "2024-12-10T19:00:00Z", end: "2024-12-11T12:00:00Z" },
          { start: "2024-12-11T19:00:00Z", end: "2024-12-12T12:00:00Z" },
          { start: "2024-12-12T19:00:00Z", end: "2024-12-13T12:00:00Z" },
        ];
        studySessions.forEach((session) =>
          addCalendarEvent(accessToken, {
            summary: "Study Session",
            start: { dateTime: session.start },
            end: { dateTime: session.end },
          })
        );
      } else if (req.user.email == "jzh9076@nyu.edu") {
        botResponse = `Got it! You prefer focusing in one big session. I’ll schedule a study block the night before your exam. Good luck!`;

        // Schedule one large session
        addCalendarEvent(accessToken, {
          summary: "Big Study Session",
          start: { dateTime: "2024-12-12T23:00:00Z" }, // Night before the exam
          end: { dateTime: "2024-12-13T03:00:00Z" }, // 4-hour session
        });
      }
    }
    // Scenario 3: Burnout and relaxation
    else if (userMessage.toLowerCase().includes("burnt")) {
      botResponse = `I’m sorry to hear that. Would you like me to cancel your office hour visit and block time for relaxation? Rest is just as important as progress. You can also try the "Play with Huli" feature for a mental reset!`;

      // Offer to cancel existing study sessions and suggest relaxation
    } else if (userMessage.toLowerCase().includes("cancel")) {
      botResponse = `Understood. I’ll cancel your study sessions and block time for relaxation. You deserve a break. Let me know if there’s anything else I can help with!`;

      // Cancel scheduled study sessions
      // (This would require implementing a deleteCalendarEvent function to remove specific events from the calendar)
      deleteCalendarEvent(accessToken, "77qdr7fq49qcn3g2s6eij9vr77v")

      addCalendarEvent(accessToken, {
        summary: "relax!",
        start: { dateTime: "2024-13-12T17:00:00Z" }, // Night before the exam
        end: { dateTime: "2024-13-13T01:00:00Z" }, // 4-hour session
      });
    }
    // Default response
    else {
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
