const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const http = require('http');
const fs = require("fs");
const { Server } = require('socket.io');
require('dotenv').config();

const User = require('./models/User');
const Kiosk = require('./models/Kiosk');

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
  cors: {
    origin: "*",
  }
});

const kioskConnections = {};

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on("joinKiosk", (kioskIdRaw) => {
    const kioskId = (kioskIdRaw || "").toString().trim();
    if (!kioskId) return;

    kioskConnections[kioskId] = socket.id;
    socket.join(kioskId);

    console.log(`✔ Kiosk ${kioskId} connected (socket ${socket.id})`);
  });

  socket.on('userConnected', (kioskIdRaw) => {
    const kioskId = (kioskIdRaw || "").toString().trim();
    if (kioskId) {
      io.to(kioskId).emit('userConnectedMessage', 'User connected to kiosk');
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    for (const [id, sId] of Object.entries(kioskConnections)) {
      if (sId === socket.id) delete kioskConnections[id];
    }
  });
});

// =============================
// 🔹 LOCAL UPLOAD STORAGE (Multer)
// =============================

// Create uploads folder if missing
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, "file_" + Date.now() + ext);
  }
});

const upload = multer({ storage });

// Serve uploaded files publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ------------------------------

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
    }

    res.status(400).json({ error: 'Invalid type' });

  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------
// Upload File → Notify kiosk
// -------------------------------
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No file uploaded" });

    const kioskId = (req.body.kioskId || "").toString().trim();
    if (!kioskId)
      return res.status(400).json({ error: "Missing kioskId" });

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    console.log(`📥 File uploaded → ${fileUrl}`);
    console.log(`📨 Sending startDownload to kiosk ${kioskId}`);

    io.to(kioskId).emit("startDownload", fileUrl);

    res.json({
      success: true,
      message: "File uploaded & kiosk notified",
      url: fileUrl
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------
// Print Command → Send to kiosk
// -------------------------------
app.post('/api/print', (req, res) => {
  try {
    const { kioskId: kioskIdRaw, color, copies } = req.body;
    const kioskId = (kioskIdRaw || "").toString().trim();

    if (!kioskId)
      return res.status(400).json({ error: 'Missing kioskId' });

    io.to(kioskId).emit('printFile', { color, copies });

    res.json({ success: true, message: 'Print command sent to kiosk' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Start Server
// =============================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
