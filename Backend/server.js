const express = require("express");
const connectDB = require("./config/mongodb");
const chatRouter = require("./routes/chat");
const calendarRoutes = require("./routes/calendar");
require("dotenv").config();

const app = express();
const port = 5001;

connectDB()
  .then(() => {
    app.use(express.json());

    app.use("/chat", chatRouter);
    app.use("/calendar", calendarRoutes);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
