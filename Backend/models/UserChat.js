const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    isUserMessage: { type: Boolean, required: true }, // true for user messages, false for chatbot responses
    timestamp: { type: Date, default: Date.now }
});

const UserChatSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, 
    chatHistory: [MessageSchema]
});

module.exports = mongoose.model("UserChat", UserChatSchema);