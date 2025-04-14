const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const studentRoutes = require("./routes/studentRoute");

const { correlationIdMiddleware } = require("../correlationId");

dotenv.config();

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(correlationIdMiddleware);

// Routes
app.use("/api/students", studentRoutes);

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Student Server running on port ${PORT}`);
});
