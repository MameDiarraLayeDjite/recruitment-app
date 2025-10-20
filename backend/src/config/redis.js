// config/redis.js
const redis = require('redis');
const logger = require('../utils/logger');


const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => logger.error('Redis Client Error', err));

client.connect();

module.exports = client;