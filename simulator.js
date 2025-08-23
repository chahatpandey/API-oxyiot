const axios = require("axios");

const API_BASE = "http://localhost:5000"; 
const LOGIN_PAYLOAD = { username: "admin", password: "1234" };

let JWT_TOKEN = null;

// Step 1: Login
async function login() {
  try {
    const res = await axios.post(`${API_BASE}/api/login`, LOGIN_PAYLOAD);
    JWT_TOKEN = res.data.accessToken;
    console.log("✅ Logged in, token acquired");
  } catch (err) {
    console.error("❌ Login failed:", err.response?.data || err.message);
  }
}

// Step 2: Generate random readings
function generateReadings() {
  const pm10 = Math.floor(Math.random() * 100);
  const pm25 = Math.floor(Math.random() * 80);
  const co2 = Math.floor(Math.random() * 2000);
  const temp = (20 + Math.random() * 10).toFixed(1);
  const humidity = Math.floor(30 + Math.random() * 50);
  const voc = Math.floor(Math.random() * 500);
  return `${pm10}|${pm25}|${co2}|${temp}|${humidity}|${voc}|0000|0030|00`;
}

// Step 3: Send bulk data
async function sendBulkData() {
  if (!JWT_TOKEN) {
    console.log("⚠️ No token, skipping bulk data...");
    return;
  }

  const readingsFormat = "pm10|pm25|co2|temperature|humidity|voc|err|sgs|battery";
  const readings = `${generateReadings()}:${generateReadings()}`;

  try {
    const response = await axios.post(
      `${API_BASE}/api/device/bulk`,
      { device: "1234567890", readingsFormat, readings },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT_TOKEN}`
        }
      }
    );
    console.log("✅ Bulk data sent:", response.data);
  } catch (error) {
    console.error("❌ Bulk data error:", error.response?.data || error.message);
  }
}

// Run
(async () => {
  await login();
  setInterval(sendBulkData, 10000);
})();
