const mongoose = require("mongoose");

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

module.exports = mongoose.model("Device", deviceSchema);
