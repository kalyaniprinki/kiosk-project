const mongoose = require('mongoose');

const UserFileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  fileData: { type: Buffer, required: true }, // store file binary
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserFile', UserFileSchema);
