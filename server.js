console.log("🚀 Starting server...");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔑 Secret key for JWT (in real projects, use env vars)
const JWT_SECRET = "mysecretkey123";

// ✅ Health check route
app.get("/api/test", (req, res) => {
  console.log("✅ Test route hit");
  res.send("Server is alive!");
});

// ✅ Login API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  console.log("➡️ Login attempt:", username, password);

  // Demo credentials (you can replace with DB later)
  if (username === "admin" && password === "1234") {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password",
  });
});

// ✅ Middleware to check token
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

// ✅ Protected Route
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Profile data",
    user: req.user,
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
