const { runChat } = require("../utils/LLM");
require("dotenv").config();

(async () => {
    const userInput = "Add 'Lunch with John' to my calendar tomorrow at 12 PM.";
    try {
      const botResponse = await runChat(userInput);
      console.log("Huli Assistant Response:", botResponse);
    } catch (error) {
      console.error("Error running chat:", error);
    }
  })();

