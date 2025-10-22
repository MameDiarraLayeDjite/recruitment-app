const { createClient } = require('redis');
const logger = require('../utils/logger');

const rawClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
});

rawClient.on('connect', () => logger.info(' Connected to Redis'));
rawClient.on('error', (err) => logger.error(' Redis Client Error', err));

// Immediately connect when the app starts
(async () => {
  try {
    await rawClient.connect();
    logger.info('Redis connection established');
  } catch (err) {
    logger.error('Redis connection failed:', err);
  }
})();

// Compatibility wrapper: always provide async get/set/del so callers can use redisClient.get(...) and redisClient.del(...)
const redisClient = {
  client: rawClient,
  get: async (key) => rawClient.get(key),
  set: async (key, value, opts) => {
    // allow passing an options object like { EX: seconds } or legacy args
    if (opts && typeof opts === 'object') {
      return rawClient.set(key, value, opts);
    }
    return rawClient.set(key, value);
  },
  setEx: async (key, seconds, value) => rawClient.set(key, value, { EX: seconds }),
  del: async (key) => rawClient.del(key),
  exists: async (key) => rawClient.exists(key),
  expire: async (key, seconds) => rawClient.expire(key, seconds),
  // expose sendCommand / raw client if needed
  sendCommand: (...args) => rawClient.sendCommand(args),
};

module.exports = redisClient;