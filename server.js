require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const faucetRoutes = require("./routes/faucet");

const app = express();

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
app.listen(PORT, () => {
  console.log(`CCX Faucet API running on port ${PORT}`);
});
