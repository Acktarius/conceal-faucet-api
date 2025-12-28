const fs = require("node:fs");
const path = require("node:path");

// Log file path (in project root, accessible from Docker volume)
const LOG_FILE = process.env.LOG_FILE || path.join(__dirname, "..", "faucet.log");

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, "");
}

/**
 * Write log entry to faucet.log (Fail2Ban-friendly format)
 * Format: TIMESTAMP EVENT_TYPE IP=... [additional fields]
 */
function logSecurityEvent(eventType, data) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} ${eventType} ${Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ")}\n`;

  // Append to log file (async, non-blocking)
  fs.appendFile(LOG_FILE, logLine, (err) => {
    if (err) {
      // Fallback to console.error only if file write fails
      console.error("Failed to write to log file:", err);
    }
  });
}

module.exports = {
  logSecurityEvent,
};

