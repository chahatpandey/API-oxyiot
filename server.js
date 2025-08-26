const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = "mysecretkey123";
const JWT_REFRESH_SECRET = "myrefresh123";
let refreshTokens = [];

// ✅ MongoDB Connection
mongoose.connect("mongodb+srv://adityabiswari:Aditya%400526@cluster0.aozfjmg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ MongoDB Schemas
const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: { type: String, unique: true },
  password: { type: String, required: true },
  isStaff: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
});

const deviceSchema = new mongoose.Schema({
  device_id: { type: String, unique: true },
  sku: String,
  sensor: String,
  frequency: String,
  device_type: String,
  hardware_version: String,
  mac_address: String,
  software_version: String,
  active: Boolean,
  admin: String,
  wifi_always_on: Boolean,
  location: String
});

const User = mongoose.model("User", userSchema);
const Device = mongoose.model("Device", deviceSchema);

// ✅ Health check
app.get("/api/test", (req, res) => {
  res.send("✅ Local API running successfully!");
});

// ✅ Utility: Generate Tokens
function generateTokens(user) {
  const accessToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ email: user.email }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  refreshTokens.push(refreshToken);
  return { accessToken, refreshToken };
}

// ✅ Middleware: Verify Token
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
}

// ✅ Signup
app.post("/api/auth/signup", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // 🔑 Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ success: true, message: "Signup successful, please login" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // 🔑 Compare password with hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    res.json({ success: true, message: "Login successful", accessToken, refreshToken, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ✅ Refresh Token
app.post("/api/auth/refresh", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ success: false, message: "Refresh token required" });
  if (!refreshTokens.includes(token)) return res.status(403).json({ success: false, message: "Invalid refresh token" });

  jwt.verify(token, JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid refresh token" });

    const accessToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "15m" });
    res.json({ success: true, accessToken });
  });
});

// ✅ Logout
app.post("/api/auth/logout", (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter(t => t !== token);
  res.json({ success: true, message: "Logged out successfully" });
});

// ✅ Profile API
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "Profile fetched successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Register Device API
app.post("/api/device/register", authenticateToken, async (req, res) => {
  try {
    const device = new Device(req.body);
    await device.save();
    res.json({ success: true, message: "Device registered successfully", device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ List Devices API
app.get("/api/device/list", authenticateToken, async (req, res) => {
  try {
    const devices = await Device.find();
    res.json({ success: true, message: "Device list fetched successfully", devices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Update Device API
app.patch("/api/device/update", authenticateToken, async (req, res) => {
  const { device_id } = req.query;
  try {
    const updatedDevice = await Device.findOneAndUpdate({ device_id }, req.body, { new: true });
    if (!updatedDevice) return res.status(404).json({ success: false, message: "Device not found" });
    res.json({ success: true, message: "Device updated successfully", device: updatedDevice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Fetch Device Details API
app.post("/api/device/details", authenticateToken, async (req, res) => {
  const { device_id } = req.body;
  try {
    const device = await Device.findOne({ device_id });
    if (!device) return res.status(404).json({ success: false, message: "Device not found" });

    res.json({ success: true, message: "Device details fetched successfully", data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Bulk Data Endpoint
app.post("/api/device/bulk", authenticateToken, (req, res) => {
  const { device, readingsFormat, readings } = req.body;
  console.log("📡 Bulk data received:", { device, readingsFormat, readings });
  res.json({ success: true, message: "Bulk data processed successfully" });
});

// ✅ Device Configuration Endpoint
app.post("/api/device/configuration", authenticateToken, (req, res) => {
  console.log("Device configuration received:", req.body);
  res.json({ success: true, message: "Configuration updated successfully" });
});

// ✅ Fetch Device Data API with AQI calculation
app.post("/api/device/fetch-device-data", authenticateToken, async (req, res) => {
  const { device_id } = req.body;
  try {
    const device = await Device.findOne({ device_id });
    if (!device) return res.status(404).json({ success: false, message: "Device not found" });

    const pm25 = (10 + Math.random() * 50).toFixed(2);
    const pm10 = (20 + Math.random() * 80).toFixed(2);

    const sampleData = {
      device_id,
      lastUpdated: new Date().toISOString(),
      readings: {
        temperature: (20 + Math.random() * 5).toFixed(2),
        humidity: (40 + Math.random() * 20).toFixed(2),
        pm2_5: pm25,
        pm10: pm10,
        co2: (300 + Math.random() * 100).toFixed(2)
      },
      aqi: calculateAQI(parseFloat(pm25), parseFloat(pm10))
    };

    res.json({
      success: true,
      message: "Device data fetched successfully",
      data: sampleData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ AQI Calculation Function
function calculateAQI(pm25, pm10) {
  const pm25Breakpoints = [
    { low: 0, high: 30, aqiLow: 0, aqiHigh: 50 },
    { low: 31, high: 60, aqiLow: 51, aqiHigh: 100 },
    { low: 61, high: 90, aqiLow: 101, aqiHigh: 200 },
    { low: 91, high: 120, aqiLow: 201, aqiHigh: 300 },
    { low: 121, high: 250, aqiLow: 301, aqiHigh: 400 },
    { low: 251, high: 999, aqiLow: 401, aqiHigh: 500 }
  ];

  const pm10Breakpoints = [
    { low: 0, high: 50, aqiLow: 0, aqiHigh: 50 },
    { low: 51, high: 100, aqiLow: 51, aqiHigh: 100 },
    { low: 101, high: 250, aqiLow: 101, aqiHigh: 200 },
    { low: 251, high: 350, aqiLow: 201, aqiHigh: 300 },
    { low: 351, high: 430, aqiLow: 301, aqiHigh: 400 },
    { low: 431, high: 999, aqiLow: 401, aqiHigh: 500 }
  ];

  function getAQI(value, breakpoints) {
    for (let bp of breakpoints) {
      if (value >= bp.low && value <= bp.high) {
        return ((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) * (value - bp.low) + bp.aqiLow;
      }
    }
    return 500; // max AQI
  }

  const aqiPM25 = getAQI(pm25, pm25Breakpoints);
  const aqiPM10 = getAQI(pm10, pm10Breakpoints);

  return Math.max(aqiPM25, aqiPM10);
}

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ API running on ${PORT}`));
