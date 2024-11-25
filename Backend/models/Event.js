const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // The Google user ID (from ID token)
    eventId: { type: String, required: true }, // Google Calendar event ID
    summary: { type: String, required: true }, // Event title
    start: {
        dateTime: { type: String, required: true },
        timeZone: { type: String, required: true },
    },
    end: {
        dateTime: { type: String, required: true },
        timeZone: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", EventSchema);
