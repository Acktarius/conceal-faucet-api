// Helper to get real client IP (handles proxy headers from nginx)
// Express normalizes headers to lowercase, so we check both
function getClientIP(req) {
  // Check headers (Express normalizes to lowercase)
  const xRealIP = req.headers["x-real-ip"] || req.headers["X-Real-IP"];
  const xForwardedFor = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];

  // X-Real-IP is set by nginx and is the most reliable
  if (xRealIP) {
    return xRealIP.trim();
  }

  // X-Forwarded-For can have multiple IPs (client, proxy1, proxy2)
  // Take the first one (original client)
  if (xForwardedFor) {
    const firstIP = xForwardedFor.split(",")[0].trim();
    // Remove IPv6 prefix if present (::ffff:)
    return firstIP.replace(/^::ffff:/, "");
  }

  // Fallback to Express's req.ip (should work with trust proxy)
  if (req.ip) {
    const ip = req.ip.replace(/^::ffff:/, "");
    // Don't use Docker internal IPs
    if (!ip.startsWith("172.") && !ip.startsWith("10.") && ip !== "127.0.0.1") {
      return ip;
    }
  }

  // Last resort
  return req.connection?.remoteAddress?.replace(/^::ffff:/, "") || "unknown";
}

module.exports = getClientIP;
