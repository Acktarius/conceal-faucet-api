// examples/integration.js
// Simple Node.js script showing how another backend or tool
// could talk to your faucet API (start-game + claim).
// Note: This uses cookies, so we need a cookie jar to handle HttpOnly cookies.

const fetch = require("node-fetch"); // npm install node-fetch@2
const { CookieJar } = require("tough-cookie"); // npm install tough-cookie
const { fetchCookie } = require("fetch-cookie"); // npm install fetch-cookie

const API_BASE = "https://your-domain.com/api";
const CCX_ADDRESS = "ccxYourAddressHere";
const SCORE = 1500; // example score above MIN_SCORE

async function main() {
  try {
    // Create a cookie jar to handle HttpOnly cookies
    const cookieJar = new CookieJar();
    const fetchWithCookies = fetchCookie(fetch, cookieJar);

    // 1) Start game: session token is set as HttpOnly cookie
    const startRes = await fetchWithCookies(
      `${API_BASE}/start-game?address=${encodeURIComponent(CCX_ADDRESS)}`,
    );
    if (!startRes.ok) {
      const errBody = await startRes.text();
      console.error("Start-game failed:", startRes.status, errBody);
      process.exit(1);
    }

    const startData = await startRes.json();
    console.log("Session started:", startData);
    // Cookie is stored in cookieJar automatically (HttpOnly, can't be read)

    // Normally the user would play the game here.
    // Simulate a game delay:
    await new Promise((r) => setTimeout(r, 35000)); // 35 seconds

    // 2) Claim after winning
    // Cookie is sent automatically by fetchWithCookies
    const claimRes = await fetchWithCookies(`${API_BASE}/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // NO token header needed - cookie is sent automatically!
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
