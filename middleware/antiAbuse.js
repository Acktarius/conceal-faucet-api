const { redisClient } = require("./sessionToken");

const COOLDOWN_SECONDS = process.env.COOLDOWN_SECONDS || 24 * 60 * 60;

async function checkCooldown(req, res, next) {
  const ip = req.ip;
  const address = req.body.address;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  const ipKey = `cooldown:ip:${ip}`;
  const addrKey = `cooldown:addr:${address}`;

  const [ipExists, addrExists] = await Promise.all([
    redisClient.exists(ipKey),
    redisClient.exists(addrKey),
  ]);

  if (ipExists) {
    return res.status(429).json({ error: "IP cooldown active" });
  }

  if (addrExists) {
    return res.status(429).json({ error: "Address cooldown active" });
  }

  req.cooldownKeys = { ipKey, addrKey };
  next();
}

async function setCooldownOnSuccess(req, res, next) {
  const { ipKey, addrKey } = req.cooldownKeys || {};

  res.on("finish", async () => {
    if (res.statusCode === 200 && ipKey && addrKey) {
      await Promise.all([
        redisClient.setEx(ipKey, COOLDOWN_SECONDS, "1"),
        redisClient.setEx(addrKey, COOLDOWN_SECONDS, "1"),
      ]);
    }
  });

  next();
}

module.exports = {
  checkCooldown,
  setCooldownOnSuccess,
};
