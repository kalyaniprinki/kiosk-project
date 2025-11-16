// server.js (MongoDB upload version)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const http = require('http');
require('dotenv').config();
const { Server } = require('socket.io');

const User = require('./models/User');
const Kiosk = require('./models/Kiosk');
const UserFile = require('./models/UserFile');

const app = express();
const server = http.createServer(app);

// =============================
// 🔹 CORS Setup
// =============================
app.use(
  cors({
    origin: ["https://kiosk-project-zeta.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());

// =============================
// 🔹 MongoDB Connection
// =============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

// =============================
// 🔹 Socket.IO
// =============================
const io = new Server(server, {
  cors: { origin: "*" }
});

// kioskId -> socketId
const kioskConnections = {};

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // kiosk must send this after connecting
  socket.on("joinKiosk", (kioskIdRaw) => {
    const kioskId = (kioskIdRaw || "").toString().trim();
    if (!kioskId) return console.log(`⚠ joinKiosk called without kioskId by socket ${socket.id}`);

    kioskConnections[kioskId] = socket.id;
    socket.join(kioskId);
    console.log(`✔ Kiosk ${kioskId} connected (socket ${socket.id})`);
  });

  socket.on('userConnected', (kioskIdRaw) => {
    const kioskId = (kioskIdRaw || "").toString().trim();
    if (kioskId) io.to(kioskId).emit('userConnectedMessage', 'User connected to kiosk');
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    for (const [kId, sId] of Object.entries(kioskConnections)) {
      if (sId === socket.id) {
        delete kioskConnections[kId];
        console.log(`→ Removed mapping kiosk ${kId} => ${sId}`);
      }
    }
  });
});

// =============================
// 🔹 MEMORY STORAGE (NO DISK)
// =============================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 50 MB
});

// =============================
// 🔹 API Routes
// =============================
app.get('/', (req, res) => res.send('🖨️ Kiosk backend running successfully'));

// -------------------------------
// Register User / Kiosk
// -------------------------------
app.post('/api/register', async (req, res) => {
  try {
    const { type, username, password, kiosk_name, location } = req.body;

    if (type === 'user') {
      const user = new User({ username, password });
      await user.save();
      return res.json({ success: true, id: user._id });

    } else if (type === 'kiosk') {
      const kiosk = new Kiosk({ kiosk_name, password, location });
      await kiosk.save();
      return res.json({ success: true, id: kiosk._id });
    }

    res.status(400).json({ error: 'Invalid type' });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------
// Login User / Kiosk
// -------------------------------
app.post('/api/login', async (req, res) => {
  try {
    const { type, username, password, kiosk_name } = req.body;

    if (type === 'user') {
      const user = await User.findOne({ username, password });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      return res.json({ success: true, user });

    } else if (type === 'kiosk') {
      const kiosk = await Kiosk.findOne({ kiosk_name, password });
      if (!kiosk) return res.status(401).json({ error: 'Invalid credentials' });
      return res.json({ success: true, kiosk });
    }

    res.status(400).json({ error: 'Invalid type' });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------
// Upload File → Save to MongoDB for user
// -------------------------------
// Upload File → Save to MongoDB for user only
// -------------------------------
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    // Check if file is received
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Get userId from request body
    const userId = (req.body.userId || "").toString().trim();
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Save file to MongoDB
    const userFile = new UserFile({
      userId,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileData: req.file.buffer,
    });

    await userFile.save();

    console.log(`💾 File saved to MongoDB for user ${userId} - ${req.file.originalname}`);

    return res.json({ success: true, message: "File uploaded and saved to database" });

  } catch (err) {
    console.error("Upload/DB error:", err);

    if (err && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large" });
    }

    return res.status(500).json({ error: err.message });
  }
});


// -------------------------------
// Print Command → Send to kiosk
// -------------------------------
app.post('/api/print', (req, res) => {
  try {
    const { kioskId: kioskIdRaw, color, copies } = req.body;
    const kioskId = (kioskIdRaw || "").toString().trim();

    if (!kioskId) return res.status(400).json({ error: 'Missing kioskId' });

    const kioskSocketId = kioskConnections[kioskId];
    if (!kioskSocketId) return res.status(410).json({ error: "Kiosk offline or not connected" });

    io.to(kioskSocketId).emit('printFile', { color, copies });
    console.log(`📨 printFile emitted to kiosk ${kioskId} (socket ${kioskSocketId})`);

    return res.json({ success: true, message: 'Print command sent to kiosk' });

  } catch (err) {
    console.error("Print endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Start Server
// =============================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
