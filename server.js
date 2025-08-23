const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = "mysecretkey123";
const JWT_REFRESH_SECRET = "myrefresh123";
let refreshTokens = [];

// ✅ Health check
app.get("/api/test", (req, res) => {
  res.send("✅ Local API running successfully!");
});

//  Login API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "1234") {
    const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ username }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
    refreshTokens.push(refreshToken);
    return res.json({ success: true, message: "Login successful", accessToken, refreshToken });
  }
  res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Middleware: Verify Token
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
}

//  Profile Route
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({ success: true, message: "Profile data", user: req.user });
});

//  Simulated Device APIs (Local)
let devices = [];
let subUsers = [];

// Register Device
app.post("/api/device/register", authenticateToken, (req, res) => {
  const { device_id, password } = req.body;
  devices.push({ device_id, password });
  res.json({ success: true, message: "Device registered locally", devices });
});

// List Devices
app.get("/api/device/list", authenticateToken, (req, res) => {
  res.json({ success: true, message: "Device list", devices });
});

// Update Device
app.patch("/api/device/update", authenticateToken, (req, res) => {
  const { device_id } = req.query;
  const index = devices.findIndex(d => d.device_id === device_id);
  if (index === -1) return res.status(404).json({ success: false, message: "Device not found" });
  devices[index] = { ...devices[index], ...req.body };
  res.json({ success: true, message: "Device updated", device: devices[index] });
});

// Subusers
app.get("/api/subuser/list", authenticateToken, (req, res) => {
  res.json({ success: true, message: "Subuser list", subUsers });
});

app.post("/api/subuser/add", authenticateToken, (req, res) => {
  subUsers.push(req.body);
  res.json({ success: true, message: "Subuser added", subUsers });
});

app.delete("/api/subuser/delete", authenticateToken, (req, res) => {
  const { email } = req.body;
  subUsers = subUsers.filter(u => u.email !== email);
  res.json({ success: true, message: "Subuser deleted", subUsers });
});

//  Bulk Data Endpoint
console.log("work");
app.post("/api/device/bulk", authenticateToken, (req, res) => {
  const { device, readingsFormat, readings } = req.body;
  console.log("📡 Bulk data received:", { device, readingsFormat, readings });
  res.json({ success: true, message: "Bulk data processed locally" });
});

//  Device Configuration Endpoint
app.post("/api/device/configuration", authenticateToken, (req, res) => {
  console.log("Device configuration received:", req.body);
  res.json({ success: true, message: "Configuration updated locally" });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Local API running on http://localhost:${PORT}`));
