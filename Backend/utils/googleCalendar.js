const axios = require("axios");

// Fetch events (with pagination support to fetch all future events)
async function fetchCalendarEvents(accessToken) {
  try {
    let events = [];
    let pageToken;

    console.log(accessToken)

    do {
      const response = await axios.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            timeMin: new Date().toISOString(), // Fetch events starting from now
            singleEvents: true, // Expand recurring events
            orderBy: "startTime", // Order by start time
            pageToken: pageToken, // For pagination
          },
        }
      );

      events = events.concat(response.data.items);
      pageToken = response.data.nextPageToken; // Get the next page token
    } while (pageToken);

    return events;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
}

// Add event
async function addCalendarEvent(accessToken, event) {
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

// Update event
async function updateCalendarEvent(accessToken, eventId, updatedEvent) {
  try {
    const response = await axios.put(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      JSON.stringify(updatedEvent),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating calendar event:", error);
    throw error;
  }
}

// Delete event
async function deleteCalendarEvent(accessToken, eventId) {
  try {
    await axios.delete(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    throw error;
  }
}

module.exports = {
  fetchCalendarEvents,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};