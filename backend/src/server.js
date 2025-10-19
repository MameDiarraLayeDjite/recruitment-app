const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// Socket.io setup
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  socket.on('join', (userId) => socket.join(userId));
  socket.on('disconnect', () => logger.info(`User disconnected: ${socket.id}`));
});

global.io = io;

server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
