const mongoose = require('mongoose');
const KioskSchema = new mongoose.Schema({
  kiosk_name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String },
  created_at: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Kiosk', KioskSchema);
