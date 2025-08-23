console.log("🚀 Starting server...");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = "mysecretkey123";        // Access token secret
const JWT_REFRESH_SECRET = "myrefresh123"; // Refresh token secret

// Temporary in-memory store for refresh tokens (use DB in production)
let refreshTokens = [];

// Health check route
app.get("/api/test", (req, res) => {
  console.log("✅ Test route hit");
  res.send("Server is alive!");
});

// Login API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  console.log("➡️ Login attempt:", username, password);

  if (username === "admin" && password === "1234") {
    const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ username }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

    // Save refresh token
    refreshTokens.push(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password",
  });
});

// Middleware: Verify Access Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
}

// Protected Route
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Profile data",
    user: req.user,
  });
});

// Refresh Token API
app.post("/api/refresh", (req, res) => {
  const { refresh } = req.body;

  if (!refresh) return res.status(401).json({ success: false, message: "Refresh token required" });
  if (!refreshTokens.includes(refresh)) {
    return res.status(403).json({ success: false, message: "Invalid refresh token" });
  }

  jwt.verify(refresh, JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid refresh token" });

    const accessToken = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "15m" });
    res.json({ success: true, accessToken });
  });
});

// Logout API
app.post("/api/logout", (req, res) => {
  const { refresh } = req.body;
  refreshTokens = refreshTokens.filter((token) => token !== refresh);
  res.json({ success: true, message: "Logged out successfully" });
});
app.post("/api/admin/register", authenticateToken, async (req, res) => {
  const {
    device_id,
    sku,
    aqi_type,
    hardware_version,
    sensor,
    mac_address,
    swver,
    frequency,
    sfreq,
    is_wifi_always_on
  } = req.body;

  try {
    // Call the actual external API
    const response = await axios.post(
      "https://device.oxyiot.com/device/api/register",
      {
        device_id,
        sku,
        aqi_type,
        hardware_version,
        sensor,
        mac_address,
        swver,
        frequency,
        sfreq,
        is_wifi_always_on
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.OXYIOT_API_TOKEN || "673cd9b1a7a3f150afbb2edd5d22f16268cb6a1e"}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Device registered successfully",
      data: response.data
    });
  } catch (error) {
    console.error("Register API Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || "Failed to register device"
    });
  }
});
// List Sub Users API
app.get("/api/subuser/list", authenticateToken, async (req, res) => {
  const { device_id } = req.query;

  try {
    const response = await axios.get(
      `https://device.oxyiot.com/device/api/device-sub-user?device_id=${device_id}`,
      {
        headers: {
          Authorization: `Token ${process.env.OXYIOT_API_TOKEN || "673cd9b1a7a3f150afbb2edd5d22f16268cb6a1e"}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Sub users fetched successfully",
      data: response.data
    });
  } catch (error) {
    console.error("List Sub Users Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || "Failed to fetch sub users"
    });
  }
});

// Delete Sub User API
app.delete("/api/subuser/delete", authenticateToken, async (req, res) => {
  const { device_id } = req.query;
  const { email } = req.body;

  try {
    const response = await axios.delete(
      `https://device.oxyiot.com/device/api/device-sub-user?device_id=${device_id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.OXYIOT_API_TOKEN || "673cd9b1a7a3f150afbb2edd5d22f16268cb6a1e"}`
        },
        data: { email }
      }
    );

    res.status(200).json({
      success: true,
      message: "Sub user deleted successfully",
      data: response.data
    });
  } catch (error) {
    console.error("Delete Sub User Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || "Failed to delete sub user"
    });
  }
});
const axios = require("axios");

// Device Register API
app.post("/api/device/register", authenticateToken, async (req, res) => {
  const { device_id, password } = req.body;

  try {
    const response = await axios.post(
      `https://device.oxyiot.com/device/api/device-admin-register`,
      { device_id, password },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.OXYIOT_API_TOKEN || "673cd9b1a7a3f150afbb2edd5d22f16268cb6a1e"}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Device registered successfully",
      data: response.data
    });
  } catch (error) {
    console.error("Device Register Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || "Failed to register device"
    });
  }
});

// Device List API
app.get("/api/device/list", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(
      `https://device.oxyiot.com/device/api/device`,
      {
        headers: {
          Authorization: `Token ${process.env.OXYIOT_API_TOKEN || "673cd9b1a7a3f150afbb2edd5d22f16268cb6a1e"}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Device list fetched successfully",
      data: response.data
    });
  } catch (error) {
    console.error("Device List Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || "Failed to fetch device list"
    });
  }
});

// Update Device API
app.patch("/api/device/update", authenticateToken, async (req, res) => {
  const { device_id } = req.query;
  const updateData = req.body;

  try {
    const response = await axios.patch(
      `https://device.oxyiot.com/device/api/device?device_id=${device_id}`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.OXYIOT_API_TOKEN || "673cd9b1a7a3f150afbb2edd5d22f16268cb6a1e"}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Device updated successfully",
      data: response.data
    });
  } catch (error) {
    console.error("Update Device Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || "Failed to update device"
    });
  }
});
const qs = require("qs"); // For URL-encoded format

// ✅ Bulk Data API
app.post("/api/device/bulk", authenticateToken, async (req, res) => {
  const { device, readingsFormat, readings } = req.body;

  try {
    const payload = qs.stringify({
      device,
      readingsFormat,
      readings
    });

    const response = await axios.post(
      "https://device.oxyiot.com/device/api/bulk",
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Token ${process.env.OXYIOT_API_TOKEN || "673cd9b1a7a3f150afbb2edd5d22f16268cb6a1e"}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Bulk data submitted successfully",
      data: response.data
    });
  } catch (error) {
    console.error("Bulk Data API Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || "Failed to submit bulk data"
    });
  }
});

// ✅ Device Configuration API
app.post("/api/device/configuration", authenticateToken, async (req, res) => {
  const { device_id, sensor, swver, calver, sendc } = req.body;

  try {
    const payload = qs.stringify({
      device_id,
      sensor,
      swver,
      calver,
      sendc
    });

    const response = await axios.post(
      "https://device.oxyiot.com/device/api/configuration",
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Token ${process.env.OXYIOT_API_TOKEN || "673cd9b1a7a3f150afbb2edd5d22f16268cb6a1e"}`
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Device configuration updated successfully",
      data: response.data
    });
  } catch (error) {
    console.error("Device Configuration API Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || "Failed to update device configuration"
    });
  }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
