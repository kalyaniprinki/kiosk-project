// models/UserFile.js
const mongoose = require("mongoose");

const UserFileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    kioskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kiosk",
      required: true,
    },

    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },

    // 🔥 store actual file buffer inside MongoDB
    fileData: { type: Buffer, required: true },

    // 🔹 print preferences
    color: {
      type: String,
      enum: ["black_white", "color"],
      default: "black_white",
    },

    copies: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },

    // 🔥 this makes listing/sorting easier
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "user_files" }
);

module.exports = mongoose.model("UserFile", UserFileSchema);
