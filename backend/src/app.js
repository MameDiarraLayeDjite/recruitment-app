require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const routes = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');
const rateLimit = require('express-rate-limit');
const sanitize = require('mongo-sanitize');
const socketIo = require('socket.io');
const http = require('http');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', err));

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Recruitment API',
      version: '1.0.0',
      description: 'API for recruitment app'
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}/api/v1` }]
  },
  apis: ['./src/controllers/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/v1', routes);

app.use(errorHandler);

// Socket.io
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  socket.on('join', (userId) => socket.join(userId));
  socket.on('disconnect', () => logger.info(`User disconnected: ${socket.id}`));
});

global.io = io; // Pour accès dans controllers

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});