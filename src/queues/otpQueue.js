/**
 * BullMQ OTP Queue Definition
 * ──────────────────────────────────────────────────────────
 * Defines 'otp-queue' backed by Redis Cloud with 3x retry attempts
 * and exponential backoff strategy (2s, 4s, 8s).
 */

const { Queue } = require('bullmq');

// Redis Cloud connection settings
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

// Instantiate BullMQ Queue
const otpQueue = new Queue('otp-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s backoff
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500,     // Keep last 500 failed jobs
  },
});

/**
 * Enqueue a new OTP delivery job
 * @param {string} jobName 'send-nepal-otp' | 'send-email-otp' | 'send-sms-otp'
 * @param {object} payload { phone, email, otp, otpId }
 */
async function enqueueOtpJob(jobName, payload) {
  try {
    const job = await otpQueue.add(jobName, payload, {
      jobId: `otp-${payload.phone || payload.email}-${Date.now()}`,
    });
    console.log(`[BullMQ Queue] Enqueued job "${jobName}" | Job ID: ${job.id}`);
    return job;
  } catch (err) {
    console.error(`[BullMQ Queue Error] Failed to enqueue "${jobName}":`, err.message);
    throw err;
  }
}

module.exports = {
  otpQueue,
  enqueueOtpJob,
};
