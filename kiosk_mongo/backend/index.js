const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const User = require('./models/User');
const Kiosk = require('./models/Kiosk');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// =============================
// 🔹 Middleware Setup
// =============================
// CORS for Vercel frontend
app.use(
  cors({
    origin: ["https://kiosk-project-zeta.vercel.app"], // replace with actual
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(bodyParser.json());

// =============================
// 🔹 MongoDB Connection
// =============================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

// =============================
// 🔹 Socket.IO Setup
// =============================
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinKiosk', (kioskId) => {
    socket.join(kioskId);
    console.log(`Socket ${socket.id} joined room ${kioskId}`);
  });

  socket.on('userConnected', (kioskId) => {
    io.to(kioskId).emit('userConnectedMessage', 'User connected to this kiosk');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// =============================
// 🔹 Cloudinary Configuration
// =============================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// =============================
// 🔹 Multer Storage (Cloudinary)
// =============================

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "kiosk_uploads",
    allowed_formats: ["jpg", "png", "pdf"],
  },
});
const upload = multer({ storage });


// =============================
// 🔹 API Routes
// =============================

app.get('/', (req, res) => res.send('🖨️ Kiosk Mongo backend running'));

// Register API
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Login API
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// 🔹 Upload File API (Cloudinary)
// =============================
// After file upload, emit event to kiosk
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Emit event to kiosk room
    const kioskId = req.body.kioskId;
    io.to(kioskId).emit('fileReceived', {
      filename: req.file.filename,
      url: fileUrl,
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: req.file.filename,
      url: fileUrl
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// Print endpoint
app.post('/api/print', (req, res) => {
  const { kioskId, color, copies } = req.body;

  if (!kioskId) return res.status(400).json({ error: 'Missing kioskId' });

  // Emit print command to kiosk
  io.to(kioskId).emit('printFile', { color, copies });
  res.json({ success: true, message: 'Print command sent to kiosk' });
});


// =============================
// 🔹 Start Server
// // =============================
// const port = process.env.PORT || 4000;
// server.listen(port, () => console.log(`🚀 Server running on port ${port}`));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

