/**
 * CSRF protection using static secret
 * Requires X-FAUCET-CSRF header to match FAUCET_CSRF_SECRET
 * Adds an extra layer of protection for state-changing requests
 */

const requiredSecret = process.env.FAUCET_CSRF_SECRET;
const getClientIP = require("../utils/getClientIP");
const { logSecurityEvent } = require("../utils/logger");

function csrfGuard(req, res, next) {
  // Skip CSRF validation in non-production environments
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  // Only enforce on state-changing methods
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  if (!requiredSecret) {
    console.error("FAUCET-CSRF: FAUCET_CSRF_SECRET not configured");
    return res.status(500).json({ error: "Service temporarily unavailable" });
  }

  const token = req.get("x-faucet-csrf") || req.get("X-FAUCET-CSRF");
  
  if (!token || token !== requiredSecret) {
    const ip = getClientIP(req);
    logSecurityEvent("ABUSE", {
      IP: ip,
      PATH: req.originalUrl,
      REASON: "CSRF",
    });
    return res.status(403).json({ error: "Invalid request" });
  }

  next();
}

module.exports = csrfGuard;

