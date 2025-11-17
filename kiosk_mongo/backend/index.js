// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const { GridFSBucket, ObjectId } = require('mongodb');
const stream = require('stream');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_ORIGIN || '*' },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// MongoDB connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MONGO_URI required in env');
  process.exit(1);
}

mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const conn = mongoose.connection;
let gfsBucket;
conn.once('open', () => {
  gfsBucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
  console.log('GridFSBucket ready');
});

// ---- Simple User & Kiosk Mongoose schema (optional) ----
// If you already have models, use yours instead.
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  // add other fields
});
const kioskSchema = new mongoose.Schema({
  kiosk_name: String,
  password: String,
  location: String,
});
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Kiosk = mongoose.models.Kiosk || mongoose.model('Kiosk', kioskSchema);

// ---- Socket.IO ----
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('joinKiosk', (kioskId) => {
    if (!kioskId) return;
    socket.join(kioskId);
    console.log(`Socket ${socket.id} joined kiosk room ${kioskId}`);
  });

  // userConnected used when a user connects to a kiosk
  socket.on('userConnected', ({ kioskId, userId }) => {
    if (!kioskId) return;
    io.to(kioskId).emit('userConnectedMessage', {
      message: 'A user has connected to this kiosk',
      kioskId,
      userId,
    });
    // Also join the user socket to kiosk room (so server can emit later)
    socket.join(kioskId);
    console.log(`User socket ${socket.id} connected to kiosk ${kioskId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// ---- Multer (memory) ----
const upload = multer({ storage: multer.memoryStorage() });

// ---- Routes ----
app.get('/', (req, res) => res.send('Kiosk backend running'));
// -------------------------

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) 
      return res.status(400).json({ success: false, error: 'Missing username or password' });

    // Find user
    const user = await User.findOne({ username });
    if (!user) 
      return res.status(401).json({ success: false, error: 'User not found' });

    // Simple password check (replace with hashed password in production)
    if (user.password !== password) 
      return res.status(401).json({ success: false, error: 'Invalid password' });

    // Return user info (or JWT token if you want)
    res.json({ success: true, userId: user._id.toString(), username: user.username });
  } catch (err) {
    console.error('Login API error', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * POST /api/upload
 * Body: form-data { file, userId (string), kioskId (optional) }
 * Stores file in GridFS and attaches metadata.userId
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    const userId = req.body.userId || req.body.user || null;
    const kioskId = req.body.kioskId || req.body.kiosk || null;

    const filename = req.file.originalname;
    const contentType = req.file.mimetype;
    const bufferStream = new stream.Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType,
      metadata: {
        userId: userId,
        kioskId: kioskId,
        originalname: filename,
      },
    });

    bufferStream.pipe(uploadStream)
      .on('error', (err) => {
        console.error('GridFS upload error', err);
        res.status(500).json({ success: false, error: 'Upload failed' });
      })
      .on('finish', () => {
        // uploadStream.id is the file id
        const fileId = uploadStream.id.toString();
        const fileUrl = `${req.protocol}://${req.get('host')}/api/file/${fileId}`; // download endpoint
        console.log(`File stored: ${fileId} (${filename})`);

        // Optionally notify kiosk (if kioskId supplied)
        if (kioskId) {
          io.to(kioskId).emit('fileReceived', {
            fileId,
            filename,
            url: fileUrl,
            size: req.file.size,
            contentType,
            userId,
          });
        }

        return res.json({
          success: true,
          fileId,
          filename,
          fileUrl,
          size: req.file.size,
        });
      });

  } catch (err) {
    console.error('Upload API error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/files/:userId
 * Return list of files uploaded by the user (metadata.userId)
 */
app.get('/api/files/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const filesColl = conn.db.collection('uploads.files');
    const files = await filesColl.find({ 'metadata.userId': userId }).sort({ uploadDate: -1 }).toArray();

    // Map to useful structure
    const list = files.map((f) => ({
      fileId: f._id.toString(),
      filename: f.filename,
      uploadDate: f.uploadDate,
      length: f.length,
      contentType: f.contentType,
      metadata: f.metadata || {},
    }));

    res.json({ success: true, files: list });
  } catch (err) {
    console.error('GET files error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/file/:id
 * Streams file data to client (kiosk download)
 */
app.get('/api/file/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).send('Invalid id');

    const _id = new ObjectId(id);
    const filesColl = conn.db.collection('uploads.files');
    const fileDoc = await filesColl.findOne({ _id });
    if (!fileDoc) return res.status(404).send('File not found');

    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.filename}"`);
    res.setHeader('Content-Type', fileDoc.contentType || 'application/octet-stream');

    const downloadStream = gfsBucket.openDownloadStream(_id);
    downloadStream.pipe(res);

    downloadStream.on('error', (err) => {
      console.error('GridFS download error', err);
      res.status(500).end();
    });
  } catch (err) {
    console.error('GET /api/file/:id error', err);
    res.status(500).send('Server error');
  }
});

/**
 * POST /api/print
 * Body: { kioskId, fileId, color, copies, pageRange, userId (optional) }
 * Emits a print job to kiosk room with file URL and settings
 */
app.post('/api/print', async (req, res) => {
  try {
    const { kioskId, fileId, color, copies = 1, pageRange, userId } = req.body;
    if (!kioskId || !fileId) return res.status(400).json({ success: false, error: 'Missing kioskId or fileId' });

    // Validate file existence
    if (!ObjectId.isValid(fileId)) return res.status(400).json({ success: false, error: 'Invalid fileId' });
    const _id = new ObjectId(fileId);
    const filesColl = conn.db.collection('uploads.files');
    const fileDoc = await filesColl.findOne({ _id });
    if (!fileDoc) return res.status(404).json({ success: false, error: 'File not found' });

    const fileUrl = `${req.protocol}://${req.get('host')}/api/file/${fileId}`;
    const payload = {
      fileId,
      filename: fileDoc.filename,
      url: fileUrl,
      contentType: fileDoc.contentType,
      size: fileDoc.length,
      color,
      copies,
      pageRange,
      userId,
      timestamp: new Date().toISOString(),
    };

    // Emit to kiosk room
    io.to(kioskId).emit('printFile', payload);

    // Optionally send back confirmation
    res.json({ success: true, message: 'Print job sent', job: payload });
  } catch (err) {
    console.error('Print API err', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
