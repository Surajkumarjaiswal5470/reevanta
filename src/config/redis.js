/**
 * Enterprise Redis Client Singleton
 * ──────────────────────────────────────────────────────────
 * Uses the official 'redis' npm package.
 * Reads connection credentials from environment variables.
 * Handles auto-reconnection, event logging, and non-blocking fallback.
 */

const { createClient } = require('redis');

// Resolve Redis credentials from environment variables
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_USERNAME = process.env.REDIS_USERNAME || 'default';

let clientOptions = {};

if (process.env.REDIS_URL) {
  clientOptions = { url: REDIS_URL };
} else if (REDIS_HOST && REDIS_PORT) {
  clientOptions = {
    socket: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
    },
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
  };
} else {
  clientOptions = { url: REDIS_URL };
}

// Instantiate official Redis client
const redisClient = createClient({
  ...clientOptions,
  socket: {
    ...clientOptions.socket,
    reconnectStrategy: (retries) => {
      // Exponential backoff up to 3 seconds
      const delay = Math.min(retries * 100, 3000);
      console.warn(`[Redis Client] Reconnecting attempt #${retries} in ${delay}ms...`);
      return delay;
    },
    connectTimeout: 5000,
  },
});

// Event Listeners
redisClient.on('connect', () => {
  console.log('[Redis Client] Establishing TCP connection...');
});

redisClient.on('ready', () => {
  console.log('[Redis Client] Connected and ready to serve cache requests.');
});

redisClient.on('error', (err) => {
  console.error('[Redis Client] Connection Error:', err.message);
});

redisClient.on('end', () => {
  console.warn('[Redis Client] Connection closed.');
});

// Immediately initiate async connection
(async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error('[Redis Client] Failed initial connection to Redis server:', err.message);
  }
})();

module.exports = redisClient;
