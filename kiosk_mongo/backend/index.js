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
app.use(
  cors({
    origin: ['https://kiosk-project-zeta.vercel.app', 'http://localhost:3000'], // ✅ allow your Vercel domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// =============================
// 🔹 Multer Storage (Cloudinary)
// =============================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kiosk_uploads', // Folder in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'pdf', 'jpeg'],
    resource_type: 'auto', // auto-detect file type
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
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Cloudinary automatically provides a secure URL for the uploaded file
    res.json({
      success: true,
      message: 'File uploaded successfully to Cloudinary',
      fileUrl: req.file.path, // this is the Cloudinary file URL
      public_id: req.file.filename,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// 🔹 Start Server
// =============================
const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
