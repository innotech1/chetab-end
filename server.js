require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./src/config/db');
const initSocket = require('./src/socket');

const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const feedRoutes = require('./src/routes/feedRoutes');
const userRoutes = require('./src/routes/userRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const conversationRoutes = require('./src/routes/conversationRoutes');
const mediaRoutes = require('./src/routes/mediaRoutes');
const videoRoutes = require('./src/routes/videoRoutes');
const listingRoutes = require('./src/routes/listingRoutes');

const app = express();
// Socket.io needs a raw http.Server to attach to — express's app.listen()
// normally creates one internally, but we need direct access to it.
const httpServer = http.createServer(app);
const io = initSocket(httpServer);
// Make io reachable from controllers via req.app.get('io')
app.set('io', io);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'Chetá API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/listings', listingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler (catches anything thrown/rejected that wasn't handled
// locally — including multer errors like "file too large" or a rejected
// file type from the upload middleware's fileFilter)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => console.log(`Chetá API (+ sockets) listening on port ${PORT}`));
});