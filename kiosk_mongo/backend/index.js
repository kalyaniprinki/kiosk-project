// server.js (MongoDB upload version)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const http = require('http');
require('dotenv').config();
const { Server } = require('socket.io');

// Models
const User = require('./models/User');
const Kiosk = require('./models/Kiosk');
const UserFile = require('./models/UserFile');

const app = express();
const server = http.createServer(app);

// =====================================
// 🔹 CORS
// =====================================
app.use(
  cors({
    origin: ["https://kiosk-project-zeta.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());

// =====================================
// 🔹 MongoDB Connection
// =====================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

// =====================================
// 🔹 Socket.IO (FIXED VERSION)
// =====================================
const io = new Server(server, { cors: { origin: "*" } });
const kioskConnections = {}; // kioskId → socketId

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // --------------------------------------
  // 🖥️ 1. Kiosk joins
  // --------------------------------------
  socket.on("joinKiosk", (kioskIdRaw) => {
    const kioskId = (kioskIdRaw || "").trim();
    if (!kioskId) return;

    kioskConnections[kioskId] = socket.id; // Save correct kiosk socket
    socket.kioskId = kioskId; // Attach kioskId to this socket
    socket.join(kioskId);

    console.log(`✔ Kiosk ${kioskId} connected (socket ${socket.id})`);
  });

  // --------------------------------------
  // 📱 2. User connects to kiosk (after QR scan)
  // --------------------------------------
  socket.on("userConnected", ({ kioskId, userId }) => {
    if (!kioskId) return;

    console.log(`📲 User ${userId} connected to kiosk ${kioskId}`);

    socket.join(kioskId);

    // notify kiosk screen
    io.to(kioskId).emit(
      "userConnectedMessage",
      `User connected (ID: ${userId})`
    );
  });

  // --------------------------------------
  // ❌ 3. Disconnect (only remove kiosk if THIS socket was kiosk)
  // --------------------------------------
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);

    // Only remove mapping if the actual kiosk disconnected
    if (socket.kioskId && kioskConnections[socket.kioskId] === socket.id) {
      console.log(`⚠️ Kiosk disconnected: ${socket.kioskId}`);
      delete kioskConnections[socket.kioskId];
    }
  });
});

// =====================================
// 🔹 MULTER MEMORY STORAGE
// =====================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// =====================================
// 🔹 Routes
// =====================================
app.get('/', (req, res) => res.send('🖨️ Kiosk backend running'));

// -------------------------------------
// REGISTER User / Kiosk
// -------------------------------------
app.post('/api/register', async (req, res) => {
  try {
    const { type, username, password, kiosk_name, location } = req.body;

    if (type === 'user') {
      const user = new User({ username, password });
      await user.save();
      return res.json({ success: true, user });

    } else if (type === 'kiosk') {
      const kiosk = new Kiosk({ kiosk_name, password, location });
      await kiosk.save();
      return res.json({ success: true, kiosk });
    }

    return res.status(400).json({ error: 'Invalid type' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------
// LOGIN User / Kiosk
// -------------------------------------
app.post('/api/login', async (req, res) => {
  try {
    const { type, username, password, kiosk_name } = req.body;

    if (type === 'user') {
      const user = await User.findOne({ username, password });
      if (!user) return res.status(401).json({ error: 'Invalid user credentials' });
      return res.json({ success: true, user });
    }

    if (type === 'kiosk') {
      const kiosk = await Kiosk.findOne({ kiosk_name, password });
      if (!kiosk) return res.status(401).json({ error: 'Invalid kiosk credentials' });
      return res.json({ success: true, kiosk });
    }

    res.status(400).json({ error: 'Invalid login type' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------
// 📤 Upload File → MongoDB
// -------------------------------------
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = (req.body.userId || "").trim();
    const kioskId = (req.body.kioskId || "").trim();
    const color = req.body.color || "black_white";
    const copies = parseInt(req.body.copies || 1);

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!kioskId) return res.status(400).json({ error: "Missing kioskId" });

    const user = await User.findById(userId);
    const kiosk = await Kiosk.findById(kioskId);

    if (!user) return res.status(404).json({ error: "User not found" });
    if (!kiosk) return res.status(404).json({ error: "Kiosk not found" });

    const fileDoc = new UserFile({
      userId,
      kioskId,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileData: req.file.buffer,
      color,
      copies,
    });

    await fileDoc.save();

    console.log(`💾 File saved for user ${userId} → kiosk ${kioskId}`);

    return res.json({
      success: true,
      message: "File stored in MongoDB",
      fileId: fileDoc._id
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------
// 📥 Kiosk Fetch Files
// -------------------------------------
app.get('/api/kiosk/files/:kioskId', async (req, res) => {
  try {
    const kioskId = req.params.kioskId;
    const files = await UserFile.find({ kioskId }).sort({ uploadedAt: -1 });

    return res.json({ success: true, files });

  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------
// 📄 Download file
// -------------------------------------
app.get('/api/file/:fileId', async (req, res) => {
  try {
    const file = await UserFile.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    res.set({
      "Content-Type": file.mimeType,
      "Content-Length": file.size,
      "Content-Disposition": `inline; filename="${file.filename}"`,
    });

    res.send(file.fileData);

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------
// 🖨️ Send Print Signal to Kiosk
// -------------------------------------
app.post('/api/print', (req, res) => {
  try {
    const kioskId = (req.body.kioskId || "").trim();
    const color = req.body.color;
    const copies = req.body.copies;

    if (!kioskId) return res.status(400).json({ error: "Missing kioskId" });

    const kioskSocket = kioskConnections[kioskId];
    if (!kioskSocket) return res.status(410).json({ error: "Kiosk offline" });

    io.to(kioskSocket).emit("printFile", { color, copies });

    console.log(`📨 Print signal sent → kiosk ${kioskId}`);

    return res.json({ success: true, message: "Print command sent" });

  } catch (err) {
    console.error("Print error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================
// Start Server
// =====================================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
