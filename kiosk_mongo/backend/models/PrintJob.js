const mongoose = require("mongoose");

const PrintJobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  kioskId: { type: String, required: true },

  fileData: { type: Buffer, required: true },  // store file inside MongoDB
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },

  color: { type: String, default: "black_white" },
  copies: { type: Number, default: 1 },
  status: { type: String, default: "pending" },

  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PrintJob", PrintJobSchema);
