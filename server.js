require("dotenv").config();

// Validate critical environment variables at startup (fail fast)
const { assertEnv } = require("./assert");
assertEnv();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { initRedis } = require("./middleware/sessionToken");
const faucetRoutes = require("./routes/faucet");

const app = express();

// Trust proxy to get real client IP (nginx sets X-Real-IP and X-Forwarded-For)
app.set("trust proxy", true);

app.use(express.json());
app.use(cookieParser());

// CORS configuration for cross-domain cookies
const corsOptions = {
  origin: process.env.FRONTEND_DOMAIN || "http://localhost:3000",
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use("/api", faucetRoutes);

const PORT = process.env.PORT || 3066;

// Initialize Redis connection before starting server
async function startServer() {
  try {
    await initRedis();
    console.log("Redis connected");
    
    app.listen(PORT, () => {
      console.log(`CCX Faucet API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
