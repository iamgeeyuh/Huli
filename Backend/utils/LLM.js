const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const {
  fetchCalendarEvents,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require("./googleCalendar");
const dotenv = require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "tunedModels/huli-calendar-assistant-9050"});

const { getConversationHistory } = require("../utils/conversationUtils");
const UserChat = require("../models/UserChat");

async function runChat(userInput, userEmail) {

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const conversationHistory = await getConversationHistory(userEmail);

  const functionDeclarations = [
    {
      name: "fetch_events",
      description: "Fetches all future events from the user's Google Calendar.",
      parameters: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            description: "The access token for authenticating with the Google Calendar API.",
          },
        },
        required: ["accessToken"],
      },
    },
    {
      name: "add_event",
      description: "Adds a new event to the user's Google Calendar.",
      parameters: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            description: "The access token for authenticating with the Google Calendar API.",
          },
          event: {
            type: "object",
            properties: {
              summary: { type: "string", description: "The title of the event." },
              startDateTime: { type: "string", format: "date-time", description: "The event start time in ISO format." },
              endDateTime: { type: "string", format: "date-time", description: "The event end time in ISO format." },
            },
            required: ["summary", "startDateTime", "endDateTime"],
          },
        },
        required: ["accessToken", "event"],
      },
    },
    {
      name: "update_event",
      description: "Updates an existing event in the user's Google Calendar.",
      parameters: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            description: "The access token for authenticating with the Google Calendar API.",
          },
          eventId: { type: "string", description: "The unique ID of the event to update." },
          updatedEvent: {
            type: "object",
            properties: {
              summary: { type: "string", description: "The updated title of the event." },
              startDateTime: { type: "string", format: "date-time", description: "The updated event start time in ISO format." },
              endDateTime: { type: "string", format: "date-time", description: "The updated event end time in ISO format." },
            },
            required: ["summary", "startDateTime", "endDateTime"],
          },
        },
        required: ["accessToken", "eventId", "updatedEvent"],
      },
    },
    {
      name: "delete_event",
      description: "Deletes an event from the user's Google Calendar.",
      parameters: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            description: "The access token for authenticating with the Google Calendar API.",
          },
          eventId: {
            type: "string",
            description: "The unique ID of the event to delete.",
          },
        },
        required: ["accessToken", "eventId"],
      },
    },
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: conversationHistory,
    functionDeclarations: functionDeclarations,
  });

  try {
    // Step 1: Fetch Events
    const events = await fetchCalendarEvents(); // Always fetch events
    const eventsData = events.map((event) => ({
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
    }));
  
  // Step 2: Combine User Input and Fetched Events
  const augmentedInput = `User input: "${userInput}". Relevant events: ${JSON.stringify(eventsData)}`;

  // Step 3: Get LLM Response
  const result = await chat.sendMessage(augmentedInput);
  
  // Step 4: Check for Function Calls
    if (result.response.functionCalls()) {
      const { functionName, arguments: args } = result.response.functionCalls();

      let functionResult;
      switch (functionName) {
        case "fetch_events":
          // Use already fetched events if needed
          functionResult = eventsData;
          break;
        case "add_event":
          functionResult = await addCalendarEvent(
            args.summary,
            args.startDateTime,
            args.endDateTime
          );
          break;
        case "update_event":
          functionResult = await updateCalendarEvent(
            args.eventId,
            args.summary,
            args.startDateTime,
            args.endDateTime
          );
          break;
        case "delete_event":
          functionResult = await deleteCalendarEvent(args.eventId);
          break;
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }

      // Step 5: Refine the Response with Function Output
      const finalResponse = await chat.sendMessage({
        functionResult: JSON.stringify(functionResult),
      });

      // Return the refined response
      return finalResponse.response.text();
    }

    // Step 6: Return the LLM's natural language response if no function call
    // Update conversation history dynamically
    conversationHistory.push({ role: "user", parts: [{ text: userInput }] });
    conversationHistory.push({ role: "model", parts: [{ text: result.response.text() }] });
    return result.response.text();
  } catch (error) {
    // Handle errors gracefully
    return "Sorry, something went wrong while processing your request.";
  }
}

module.exports = { runChat };
