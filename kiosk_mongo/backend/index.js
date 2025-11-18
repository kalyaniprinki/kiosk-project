const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const { GridFSBucket, ObjectId } = require("mongodb");
const stream = require("stream");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const User = require("./models/User");
const Kiosk = require("./models/Kiosk");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(bodyParser.json());

// ====================================
// 🔗 MongoDB Connection + GridFS Setup
// ====================================
let gfsBucket;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    const db = mongoose.connection.db;
    gfsBucket = new GridFSBucket(db, {
      bucketName: "uploads",
    });
  })
  .catch((err) => console.log(err));

// ====================================
// 🔌 Socket.io
// ====================================
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinKiosk", (kioskId) => {
    socket.join(kioskId);
    console.log(`➡ Socket ${socket.id} joined room ${kioskId}`);
  });

  socket.on("disconnect", () =>
    console.log("Client disconnected:", socket.id)
  );
});

// ===========================================================
// 🔒 REGISTER API
// ===========================================================
app.post("/api/register", async (req, res) => {
  try {
    const { type, username, password, kiosk_name, location } = req.body;

    if (type === "user") {
      const user = new User({
        username,
        password,
        walletBalance: 0, // 👈 new wallet field
      });

      await user.save();
      return res.json({ success: true, id: user._id });
    }

    if (type === "kiosk") {
      const kiosk = new Kiosk({
        kiosk_name,
        password,
        location,
      });

      await kiosk.save();
      return res.json({ success: true, id: kiosk._id });
    }

    res.status(400).json({ error: "Invalid type" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===========================================================
// 🔓 LOGIN API
// ===========================================================
app.post("/api/login", async (req, res) => {
  try {
    const { type, username, password, kiosk_name } = req.body;

    if (type === "user") {
      const user = await User.findOne({ username, password });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      return res.json({ success: true, user });
    }

    if (type === "kiosk") {
      const kiosk = await Kiosk.findOne({ kiosk_name, password });
      if (!kiosk)
        return res.status(401).json({ error: "Invalid credentials" });
      return res.json({ success: true, kiosk });
    }

    res.status(400).json({ error: "Invalid type" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===========================================================
// 📤 FILE UPLOAD (MongoDB GridFS)
// ===========================================================
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const kioskId = req.body.kioskId;
    const userId = req.body.userId;

    const readableStream = new stream.PassThrough();
    readableStream.end(req.file.buffer);

    const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
      metadata: { userId, kioskId },
    });

    readableStream.pipe(uploadStream);

    uploadStream.on("finish", () => {
      io.to(kioskId).emit("fileReceived", {
        filename: req.file.originalname,
        fileId: uploadStream.id,
      });

      res.json({
        success: true,
        message: "File uploaded",
        fileId: uploadStream.id,
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================================================
// 📥 GET USER FILES (from GridFS)
// ===========================================================
app.get("/api/files/:userId", async (req, res) => {
  const userId = req.params.userId;

  const files = await mongoose.connection.db
    .collection("uploads.files")
    .find({ "metadata.userId": userId })
    .toArray();

  res.json(files);
});

// ===========================================================
// 📄 STREAM FILE / DOWNLOAD
// ===========================================================
app.get("/api/file/:id", (req, res) => {
  const fileId = new ObjectId(req.params.id);

  gfsBucket.openDownloadStream(fileId).pipe(res);
});

// ===========================================================
// 💰 GET USER WALLET
// ===========================================================
app.get("/api/wallet/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    success: true,
    balance: user.walletBalance,
  });
});

// ===========================================================
// 💳 RECHARGE WALLET
// ===========================================================
app.post("/api/wallet/recharge", async (req, res) => {
  const { userId, amount } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.walletBalance += Number(amount);
  await user.save();

  res.json({
    success: true,
    newBalance: user.walletBalance,
  });
});

// ===========================================================
// 🖨 SEND PRINT COMMAND TO KIOSK
// ===========================================================
app.post("/api/print", (req, res) => {
  const { kioskId, color, copies, fileId } = req.body;

  io.to(kioskId).emit("printFile", { fileId, color, copies });

  res.json({ success: true });
});

// ===========================================================
// 🚀 START SERVER
// ===========================================================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running at port ${PORT}`)
);
