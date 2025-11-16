const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const http = require('http');
const fs = require("fs");
const { Server } = require('socket.io');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const User = require('./models/User');
const Kiosk = require('./models/Kiosk');

const app = express();
const server = http.createServer(app);

// =============================
// 🔹 CORS Setup (Vercel / Render)
// =============================
app.use(
  cors({
    origin: ["https://kiosk-project-zeta.vercel.app"], // Your frontend
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
  cors: {
    origin: "*",
  }
});

// store kiosk socket references (optional map)
const kioskConnections = {};

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // kiosk identifies itself and joins a room named by kioskId
  socket.on("joinKiosk", (kioskIdRaw) => {
    const kioskId = (kioskIdRaw || "").toString().trim();
    if (!kioskId) {
      console.log(`⚠ joinKiosk called without kioskId by socket ${socket.id}`);
      return;
    }

    kioskConnections[kioskId] = socket.id; // optional record
    socket.join(kioskId);
    console.log(`✔ Kiosk ${kioskId} connected via socket ${socket.id}`);
  });

  // user joined (forward to kiosk room)
  socket.on('userConnected', (kioskIdRaw) => {
    const kioskId = (kioskIdRaw || "").toString().trim();
    console.log(`userConnected event for kioskId=${kioskId}`);
    if (kioskId) io.to(kioskId).emit('userConnectedMessage', 'User connected to kiosk');
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    // optional: remove from kioskConnections if present
    for (const [kId, sId] of Object.entries(kioskConnections)) {
      if (sId === socket.id) {
        console.log(`→ Removing kioskConnections entry for ${kId}`);
        delete kioskConnections[kId];
        break;
      }
    }
  });
});

// =============================
// 🔹 Cloudinary Upload Setup
// =============================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "kiosk_uploads",
    resource_type: "raw",      // 🔥 IMPORTANT for PDFs
    allowed_formats: ["pdf", "jpg", "png"],
    type: "upload",
    access_mode: "public",   // 🔥 Makes file downloadable without aut,
  },
});


const upload = multer({ storage });

// =============================
// 🔹 API Routes
// =============================
app.get('/', (req, res) => res.send('🖨️ Kiosk backend running successfully'));

// --------------------------------------------------------------
// 🔹 Register User / Kiosk
// --------------------------------------------------------------
app.post('/api/register', async (req, res) => {
  try {
    const { type, username, password, kiosk_name, location } = req.body;

    if (type === 'user') {
      if (!username || !password)
        return res.status(400).json({ error: 'Missing username/password' });

      const user = new User({ username, password });
      await user.save();
      return res.json({ success: true, id: user._id });

    } else if (type === 'kiosk') {
      if (!kiosk_name || !password)
        return res.status(400).json({ error: 'Missing kiosk_name/password' });

      const kiosk = new Kiosk({ kiosk_name, password, location });
      await kiosk.save();
      return res.json({ success: true, id: kiosk._id });

    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------
// 🔹 Login User / Kiosk
// --------------------------------------------------------------
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

    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------
// 🔹 Upload File (Cloudinary) → Send to Kiosk
// --------------------------------------------------------------
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const kioskIdRaw = req.body.kioskId;
    const kioskId = (kioskIdRaw || "").toString().trim();

    console.log("📥 /api/upload called - kioskId received:", kioskIdRaw);

    if (!kioskId)
      return res.status(400).json({ error: "Missing kioskId" });

    // Cloudinary path/url (multer-storage-cloudinary provides `path` which is the public URL)
    const fileUrl = req.file.path || req.file.url || req.file.secure_url || null;

    if (!fileUrl) {
      console.error("⚠ Unable to determine Cloudinary file URL:", req.file);
      return res.status(500).json({ error: "Uploaded but couldn't determine file URL" });
    }

    // Emit download command to kiosk room (use room name, not socket id)
    console.log(`Emitting startDownload to room: "${kioskId}" with fileUrl: ${fileUrl}`);
    io.to(kioskId).emit("startDownload", fileUrl);

    res.json({
      success: true,
      message: "File uploaded & kiosk notified",
      url: fileUrl
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------
// 🔹 Print Command → Send to Kiosk
// --------------------------------------------------------------
app.post('/api/print', (req, res) => {
  try {
    const { kioskId: kioskIdRaw, color, copies } = req.body;
    const kioskId = (kioskIdRaw || "").toString().trim();

    console.log(`/api/print called for kioskId=${kioskId}, color=${color}, copies=${copies}`);

    if (!kioskId) return res.status(400).json({ error: 'Missing kioskId' });

    // Emit to room name
    io.to(kioskId).emit('printFile', { color, copies });
    console.log(`📨 printFile emitted to room "${kioskId}"`);

    res.json({ success: true, message: 'Print command sent to kiosk' });
  } catch (err) {
    console.error("Print endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// 🔹 Start Server (Render-Compatible)
// =============================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
