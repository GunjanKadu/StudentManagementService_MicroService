const express = require("express");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const publicKeyRoute = require("./routes/auth/publicKeyRoute");
const { correlationIdMiddleware } = require("../correlationId");
const loginRoute = require("./routes/auth/loginRoute");

dotenv.config();
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  max: 10, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  headers: true, // Include rate limit info in response headers
});
// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
// app.use(limiter);
app.use(express.json());
app.use(correlationIdMiddleware);

// Public Key
app.use("/.well-known/jwks.json", publicKeyRoute);
// app.use("/.well-known/jwks.json", limiter, publicKeyRoute);

// Routes
app.use("/api/login", loginRoute);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Auth Server running on port ${PORT}`);
});
