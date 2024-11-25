const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require("dotenv").config();

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.API_KEY;

let conversationHistory = [
    {
      role: "user",
      parts: [{ text: "Hi Huli, can you help me with my tasks?" }],
    },
    {
      role: "model",
      parts: [{ text: "Of course! What's on your mind?" }],
    },
    {
      role: "user",
      parts: [{ text: "Schedule a meeting tomorrow at 10 AM with the team." }],
    },
    {
      role: "model",
      parts: [{ text: "Sure! I've scheduled your meeting with the team at 10 AM tomorrow." }],
    },
    {
      role: "user",
      parts: [{ text: "What’s on my schedule today?" }],
    },
    {
      role: "model",
      parts: [
        { text: "Today, you have:\n1. Project review at 11 AM.\n2. Lunch with Sarah at 1 PM.\n3. Call with the client at 3 PM." },
      ],
    },
    {
      role: "user",
      parts: [{ text: "Remind me to exercise at 7 PM." }],
    },
    {
      role: "model",
      parts: [{ text: "Got it! I'll remind you to exercise at 7 PM." }],
    },
  
    // Personal Productivity and Study Assistance
    {
      role: "user",
      parts: [{ text: "Help me plan my study schedule for finals week." }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Sure! Here's a suggestion:\n1. Monday: Study math for 3 hours in the morning and review notes in the evening.\n2. Tuesday: Focus on writing essays for 4 hours.\n3. Wednesday: Practice coding problems for 3 hours.\nWould you like me to block these times on your calendar?",
        },
      ],
    },
    {
      role: "user",
      parts: [{ text: "Yes, that works. Thanks!" }],
    },
    {
      role: "model",
      parts: [
        { text: "You're welcome! I've added these study sessions to your calendar." },
      ],
    },
  
    // Health and Fitness Tracking
    {
      role: "user",
      parts: [{ text: "Track my water intake today." }],
    },
    {
      role: "model",
      parts: [
        { text: "You’ve logged 3 glasses of water today. The recommended daily amount is 8 glasses. Keep it up!" },
      ],
    },
    {
      role: "user",
      parts: [{ text: "Suggest a quick workout for me." }],
    },
    {
      role: "model",
      parts: [
        {
          text: "How about a 20-minute full-body workout? Here's the plan:\n1. 5 minutes: Warm-up (jumping jacks, light stretches).\n2. 10 minutes: Bodyweight exercises (push-ups, squats, lunges).\n3. 5 minutes: Cool down with yoga stretches.",
        },
      ],
    },
  
    // Career and Skill Development
    {
      role: "user",
      parts: [{ text: "How can I improve my time management skills?" }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Here are a few tips:\n1. Use time-blocking to allocate specific time slots for tasks.\n2. Prioritize using the Eisenhower Matrix (urgent vs. important).\n3. Review your progress at the end of the day.\nWould you like me to schedule a daily review session for you?",
        },
      ],
    },
    {
      role: "user",
      parts: [{ text: "Yes, schedule it for 8 PM." }],
    },
    {
      role: "model",
      parts: [
        { text: "Done! Your daily review session is scheduled for 8 PM." },
      ],
    },
  
    // Goal Setting and Tracking
    {
      role: "user",
      parts: [{ text: "Help me set a goal to learn Python in 3 months." }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Great goal! Here's a plan:\n1. Month 1: Learn Python basics (variables, loops, functions).\n2. Month 2: Work on projects like a calculator or to-do list app.\n3. Month 3: Solve coding problems and explore libraries like NumPy.\nI’ll remind you weekly to track your progress. Sound good?",
        },
      ],
    },
    {
      role: "user",
      parts: [{ text: "Yes, thanks!" }],
    },
    {
      role: "model",
      parts: [
        { text: "You're welcome! I'll send weekly reminders to check your progress." },
      ],
    },
  
    // Learning and Self-Improvement
    {
      role: "user",
      parts: [{ text: "Can you recommend books to improve my productivity?" }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Sure! Here are my top picks:\n1. 'Atomic Habits' by James Clear.\n2. 'Deep Work' by Cal Newport.\n3. 'The 7 Habits of Highly Effective People' by Stephen Covey.\nWould you like me to schedule a reading session?",
        },
      ],
    },
  
    // Playful and Friendly Interactions
    {
      role: "user",
      parts: [{ text: "Huli, tell me a fun fact." }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!",
        },
      ],
    },
    {
      role: "user",
      parts: [{ text: "Haha, that's cool!" }],
    },
  
    // Motivational Support
    {
      role: "user",
      parts: [{ text: "I feel unmotivated today." }],
    },
    {
      role: "model",
      parts: [
        {
          text: "I'm sorry to hear that. Remember, it's okay to take a break. How about starting with a small task to get back on track? You’ve got this!",
        },
      ],
    },
  
    // Calendar Integration
    {
      role: "user",
      parts: [{ text: "Add a reminder to prepare for the team presentation next Monday." }],
    },
    {
      role: "model",
      parts: [
        { text: "Sure! I've added a reminder to prepare for your team presentation next Monday." },
      ],
    },
  
    // Personalized Suggestions
    {
      role: "user",
      parts: [{ text: "What should I eat for lunch today?" }],
    },
    {
      role: "model",
      parts: [
        {
          text: "How about a healthy chicken salad with a side of fruit? Or would you like a quick recipe for a pasta dish?",
        },
      ],
    },
  ];
  
  

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: conversationHistory,
  });

  const result = await chat.sendMessage(userInput);

  // Update conversation history dynamically
  conversationHistory.push({ role: "user", parts: [{ text: userInput }] });
  conversationHistory.push({ role: "model", parts: [{ text: result.response.text() }] });

  return result.response.text();
}

module.exports = { runChat };
