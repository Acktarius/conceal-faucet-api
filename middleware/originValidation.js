/**
 * Origin header validation middleware
 * Complements CORS by enforcing allowed origin server-side
 * Works even for tools that ignore CORS (curl, Postman, etc.)
 */

const allowedOrigin = process.env.FRONTEND_DOMAIN;
const getClientIP = require("../utils/getClientIP");
const { logSecurityEvent } = require("../utils/logger");

function requireTrustedOrigin(req, res, next) {
  // Only enforce on state-changing routes (POST, PUT, DELETE, PATCH)
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  if (!allowedOrigin) {
    return res.status(500).json({ error: "Service temporarily unavailable" });
  }

  const origin = req.headers.origin || req.headers.Origin;

  // Require Origin header for state-changing requests
  if (!origin) {
    const ip = getClientIP(req);
    logSecurityEvent("ABUSE", {
      IP: ip,
      PATH: req.originalUrl,
      REASON: "Missing Origin",
    });
    return res.status(400).json({ error: "Invalid request" });
  }

  // Validate origin matches allowed frontend domain
  if (origin !== allowedOrigin) {
    const ip = getClientIP(req);
    logSecurityEvent("ABUSE", {
      IP: ip,
      ORIGIN: origin,
      PATH: req.originalUrl,
      REASON: "Bad Origin",
    });
    return res.status(403).json({ error: "Invalid request" });
  }

  next();
}

module.exports = { requireTrustedOrigin };

