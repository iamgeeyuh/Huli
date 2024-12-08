const UserChat = require("../models/UserChat"); // Adjust the path as needed

/**
 * Get conversation history from MongoDB for a specific user.
 * @param {string} email - The email of the user.
 * @returns {Array} - The conversation history formatted for LLM.
 */
async function getConversationHistory(email) {
  try {
    // Find the user's chat history in the database
    const userChat = await UserChat.findOne({ email });

    // If the user doesn't exist, return an empty history
    if (!userChat) {
      return [];
    }

    // Map the chat history to the format required by the LLM
    const conversationHistory = userChat.chatHistory.map((message) => ({
      role: message.isUserMessage ? "user" : "model",
      parts: [{ text: message.text }],
    }));

    return conversationHistory;
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    throw error;
  }
}

module.exports = { getConversationHistory };
