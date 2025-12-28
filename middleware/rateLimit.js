const rateLimit = require("express-rate-limit");
const { redisClient } = require("./sessionToken");
const getClientIP = require("../utils/getClientIP");
const { logSecurityEvent } = require("../utils/logger");

// Rate limiter configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "600000", 10); // 10 minutes default
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "5", 10); // 5 attempts per window default

// Custom Redis store for express-rate-limit (works with PM2 cluster mode)
class RedisStore {
  constructor(options) {
    this.prefix = options.prefix || "ratelimit:";
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const redisKey = `${this.prefix}${key}`;
    const current = await redisClient.incr(redisKey);
    
    // Set expiration on first increment
    if (current === 1) {
      await redisClient.expire(redisKey, Math.ceil(this.windowMs / 1000));
    }
    
    return {
      totalHits: current,
      resetTime: new Date(Date.now() + this.windowMs),
    };
  }

  async decrement(key) {
    const redisKey = `${this.prefix}${key}`;
    await redisClient.decr(redisKey);
  }

  async resetKey(key) {
    const redisKey = `${this.prefix}${key}`;
    await redisClient.del(redisKey);
  }
}

// Create rate limiter with Redis store (shared across PM2 workers)
const claimLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: new RedisStore({
    prefix: "ratelimit:claim:",
    windowMs: RATE_LIMIT_WINDOW_MS,
  }),
  // Use custom key generator to get real client IP
  keyGenerator: (req) => getClientIP(req),
  // Custom handler with Fail2Ban-friendly logging
  handler: (req, res) => {
    const ip = getClientIP(req);
    // Log to file (Fail2Ban-friendly format, no console output)
    logSecurityEvent("RATE_LIMIT", {
      IP: ip,
      PATH: req.originalUrl,
    });
    res.status(429).json({
      error: "Request not available at this time",
    });
  },
  // Skip successful requests (only count rate limit hits)
  skipSuccessfulRequests: false,
  // Skip failed requests (count them too)
  skipFailedRequests: false,
});

module.exports = {
  claimLimiter,
};

