const axios = require("axios");

// Fetch events
async function fetchCalendarEvents(accessToken) {
    try {
        const response = await axios.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw error;
    }
}

// Add event
async function addCalendarEvent(accessToken, event) {
    console.log(event)
    try {
        const response = await axios.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            JSON.stringify(event),
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error adding calendar event:", error);
        throw error;
    }
}

module.exports = { fetchCalendarEvents, addCalendarEvent };
