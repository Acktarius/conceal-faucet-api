const express = require("express");
const CCX = require("conceal-api");
const { createSession, verifySessionToken, deleteSession } = require("../middleware/sessionToken");
const { checkCooldown, setCooldownOnSuccess } = require("../middleware/antiAbuse");
const getClientIP = require("../utils/getClientIP");

const router = express.Router();

const ccx = new CCX({
  daemonHost: process.env.DAEMON_HOST || "http://host.docker.internal",
  walletHost: process.env.WALLET_HOST || "http://host.docker.internal",
  daemonRpcPort: parseInt(process.env.DAEMON_RPC_PORT || "16000", 10),
  walletRpcPort: parseInt(process.env.WALLET_RPC_PORT || "3333", 10),
  walletRpcUser: process.env.WALLET_RPC_USER,
  walletRpcPass: process.env.WALLET_RPC_PASSWORD,
  timeout: parseInt(process.env.RPC_TIMEOUT || "5000", 10),
});

// GET /api/health
router.get("/health", async (req, res) => {
  try {
    const address = process.env.FAUCET_ADDRESS;
    if (!address) {
      throw new Error("FAUCET_ADDRESS not configured");
    }
    const balance = await ccx.getBalance(address);
    const needed = parseInt(process.env.FAUCET_AMOUNT || "100000", 10);
    res.json({
      status: "ok",
      available: balance.availableBalance >= needed,
      balance: balance.availableBalance,
    });
  } catch (e) {
    console.error("Health error:", e.message || e);
    res.status(500).json({ status: "error", error: e.message || "Wallet unavailable" });
  }
});

// GET /api/start-game?address=ccx...
router.get("/start-game", async (req, res) => {
  const address = req.query.address;

  if (!address || !address.startsWith("ccx")) {
    return res.status(400).json({ error: "Invalid CCX address" });
  }

  try {
    // Get real client IP (handles proxy headers from nginx)
    const clientIP = getClientIP(req);
    const token = await createSession(clientIP, address);

    // Set HttpOnly cookie for security (cross-domain)
    res.cookie("faucet-token", token, {
      httpOnly: true, // JavaScript cannot access
      secure: true, // Only sent over HTTPS
      sameSite: "none", // Required for cross-domain
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.json({ success: true, message: "Session started" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// POST /api/claim  (headers: X-Faucet-Token; body: { address, score })
router.post("/claim", verifySessionToken, checkCooldown, setCooldownOnSuccess, async (req, res) => {
  const { address, score } = req.body;
  const { address: sessionAddr } = req.sessionData;
  const token = req.sessionToken;

  if (!address || address !== sessionAddr) {
    return res.status(400).json({ error: "Address mismatch with session" });
  }

  const minScore = parseInt(process.env.MIN_SCORE || "1000", 10);
  if (!score || score < minScore) {
    return res.status(400).json({ error: "Score too low" });
  }

  const amount = parseInt(process.env.FAUCET_AMOUNT || "1123456", 10);
  const sourceAddress = process.env.FAUCET_ADDRESS;

  try {
    const opts = {
      transfers: [{ address, amount }],
      addresses: [sourceAddress],
      changeAddress: sourceAddress,
      anonymity: 5,
      fee: 10,
    };

    const result = await ccx.sendTransaction(opts);

    await deleteSession(token);

    // Clear the cookie after successful claim
    res.clearCookie("faucet-token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.json({
      success: true,
      txHash: result.transactionHash,
      amount: amount / 1000000,
    });
  } catch (e) {
    console.error("Payment error:", e.message || e);
    res.status(500).json({ error: e.message || "Payment failed" });
  }
});

module.exports = router;
