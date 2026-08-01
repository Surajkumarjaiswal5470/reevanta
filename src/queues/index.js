/**
 * Enterprise BullMQ Queues Registry
 * ──────────────────────────────────────────────────────────
 * Defines and exports all 5 specialized BullMQ Queues connected to Redis Cloud:
 * 1. otpQueue (otp-queue)
 * 2. imageProcessingQueue (image-processing-queue)
 * 3. notificationQueue (notification-queue)
 * 4. cacheRefreshQueue (cache-refresh-queue)
 * 5. analyticsQueue (analytics-queue)
 */

const { Queue } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || 'redis://default:i9lCAlQazLcNvXJPT0IktsZvCeaYSK2f@clover-mountain-waterlily-76342.db.redis.io:18455';

function parseRedisOptions(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      username: parsed.username || 'default',
      password: parsed.password || undefined,
    };
  } catch (err) {
    return { host: 'localhost', port: 6379 };
  }
}

const connection = parseRedisOptions(REDIS_URL);

// Common queue default job options
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
};

// 1. OTP Queue
const otpQueue = new Queue('otp-queue', { connection, defaultJobOptions });

// 2. Image Processing Queue
const imageProcessingQueue = new Queue('image-processing-queue', { connection, defaultJobOptions });

// 3. Notification Queue
const notificationQueue = new Queue('notification-queue', { connection, defaultJobOptions });

// 4. Cache Refresh Queue
const cacheRefreshQueue = new Queue('cache-refresh-queue', { connection, defaultJobOptions });

// 5. Analytics Queue
const analyticsQueue = new Queue('analytics-queue', { connection, defaultJobOptions });

// Helper functions for enqueueing jobs across queues

async function enqueueOtp(jobName, payload) {
  return await otpQueue.add(jobName, payload);
}

async function enqueueImageTask(jobName, payload) {
  return await imageProcessingQueue.add(jobName, payload);
}

async function enqueueNotification(jobName, payload) {
  return await notificationQueue.add(jobName, payload);
}

async function enqueueCacheRefresh(jobName, payload) {
  return await cacheRefreshQueue.add(jobName, payload);
}

async function enqueueAnalyticsEvent(jobName, payload) {
  return await analyticsQueue.add(jobName, payload);
}

module.exports = {
  connection,
  otpQueue,
  imageProcessingQueue,
  notificationQueue,
  cacheRefreshQueue,
  analyticsQueue,
  enqueueOtp,
  enqueueImageTask,
  enqueueNotification,
  enqueueCacheRefresh,
  enqueueAnalyticsEvent,
};
