const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const { fetchCalendarEvents, addCalendarEvent } = require("../utils/googleCalendar");
const Event = require("../models/Event"); // Import Event model
const router = express.Router();

router.get("/events", verifyToken, async (req, res) => {
    try {
        const accessToken = req.headers["x-access-token"];
        const googleEvents = await fetchCalendarEvents(accessToken);

        const userId = req.user.googleId; // Extracted from verifyToken

        // Save Google events to the database
        const dbEvents = googleEvents.items.map(async (event) => {
            return await Event.findOneAndUpdate(
                { eventId: event.id }, // Check if the event already exists
                {
                    userId,
                    eventId: event.id,
                    summary: event.summary,
                    start: event.start,
                    end: event.end,
                },
                { upsert: true, new: true } // Insert if not found, update if exists
            );
        });

        // Wait for all database operations to complete
        const savedEvents = await Promise.all(dbEvents);

        res.status(200).json(savedEvents); // Return the saved events
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Failed to fetch events" });
    }
});

router.post("/events", verifyToken, async (req, res) => {
    try {
        const accessToken = req.headers["x-access-token"];
        const event = req.body; // Event details sent from the frontend

        // Add the event to Google Calendar
        const googleEvent = await addCalendarEvent(accessToken, event);

        // Save the event to the database
        const newEvent = new Event({
            userId: req.user.googleId, // From verifyToken
            eventId: googleEvent.id, // Google event ID
            summary: googleEvent.summary,
            start: googleEvent.start,
            end: googleEvent.end,
        });

        await newEvent.save(); // Save to MongoDB

        res.status(200).json(newEvent); // Return the saved event
    } catch (error) {
        console.error("Error adding event:", error);
        res.status(500).json({ message: "Failed to add event" });
    }
});
