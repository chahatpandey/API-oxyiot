const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: { type: String, unique: true },
  isStaff: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", userSchema);
