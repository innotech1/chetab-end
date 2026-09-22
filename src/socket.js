const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  // Authenticate each socket connection using the same JWT the REST API uses.
  // Client passes it as: io(url, { auth: { token } })
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins a room named after their own id, so the server can
    // target them directly with io.to(userId).emit(...) regardless of how
    // many devices/tabs they have open.
    socket.join(String(socket.userId));

    socket.on('disconnect', () => {
      // Nothing to clean up — room membership is handled automatically by socket.io.
    });
  });

  return io;
}

module.exports = initSocket;
