// examples/integration.js
// Simple Node.js script showing how another backend or tool
// could talk to your faucet API (start-game + claim).

const fetch = require("node-fetch"); // npm install node-fetch@2

const API_BASE = "https://your-domain.com/api";
const CCX_ADDRESS = "ccxYourAddressHere";
const SCORE = 1500; // example score above MIN_SCORE

async function main() {
  try {
    // 1) Start game: get session token
    const startRes = await fetch(
      `${API_BASE}/start-game?address=${encodeURIComponent(CCX_ADDRESS)}`,
    );
    if (!startRes.ok) {
      const errBody = await startRes.text();
      console.error("Start-game failed:", startRes.status, errBody);
      process.exit(1);
    }

    const startData = await startRes.json();
    const token = startData.token;
    console.log("Received session token:", token);

    // Normally the user would play the game here.
    // Simulate a game delay:
    await new Promise((r) => setTimeout(r, 35000)); // 35 seconds

    // 2) Claim after winning
    const claimRes = await fetch(`${API_BASE}/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Faucet-Token": token,
      },
      body: JSON.stringify({
        address: CCX_ADDRESS,
        score: SCORE,
      }),
    });

    const claimBody = await claimRes.text();
    console.log("Claim status:", claimRes.status);
    console.log("Claim response:", claimBody);
  } catch (err) {
    console.error("Integration error:", err);
  }
}

main();
