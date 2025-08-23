const axios = require("axios");

const BASE_URL = "http://localhost:5000"; // ✅ Local API
let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzU1OTU0ODYwLCJleHAiOjE3NTU5NTU3NjB9.EJaJpph4uCl_-bttdl1x0l2D1pb9xlZPQm7pmLuFKPQ";

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/login`, {
      username: "admin",
      password: "1234"
    });
    token = response.data.accessToken;
    console.log(" Logged in, token acquired");
  } catch (error) {
    console.error(" Login error:", error.message);
  }
}

async function sendBulkData() {
  try {
    const payload = {
      device: "TEST_DEVICE_001",
      readingsFormat: ["temp", "humidity", "aqi"],
      readings: [
        [Math.floor(Math.random() * 50), Math.floor(Math.random() * 100), Math.floor(Math.random() * 500)]
      ]
    };
    console.log(`➡️ Sending bulk data to: ${BASE_URL}/api/device/bulk`);

    const response = await axios.post(`${BASE_URL}/api/device/bulk`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Bulk data sent:", response.data.message);
  } catch (error) {
    console.error("Bulk data error:", error.message);
  }
}

async function start() {
  await login();
  setInterval(sendBulkData, 3000); // send every 3 sec
}

start();
