/**
 * Dedicated Background Workers Suite for BullMQ
 * ──────────────────────────────────────────────────────────
 * Listens to all 5 specialized queues and executes background task processing:
 * 1. otpWorker
 * 2. imageProcessingWorker
 * 3. notificationWorker
 * 4. cacheRefreshWorker
 * 5. analyticsWorker
 */

const { Worker } = require('bullmq');
const { connection } = require('../queues');

// 1. OTP Worker Processor
const otpWorker = new Worker(
  'otp-queue',
  async (job) => {
    console.log(`[OTP Worker Processing] Job: ${job.name} | Data:`, job.data);
    // Process OTP dispatch
    return { status: 'success', delivered_to: job.data.phone || job.data.email };
  },
  { connection, concurrency: 5 }
);

// 2. Image Processing Worker Processor
const imageProcessingWorker = new Worker(
  'image-processing-queue',
  async (job) => {
    console.log(`[Image Processing Worker] Optimizing image: ${job.data.imageUrl || job.data.filename}`);
    // Simulate image compression & thumbnail generation
    return { status: 'optimized', cdnUrl: `https://ik.imagekit.io/h7oalyucx/tr:w-800,q-80/${job.data.filename || 'img.jpg'}` };
  },
  { connection, concurrency: 3 }
);

// 3. Notification Worker Processor
const notificationWorker = new Worker(
  'notification-queue',
  async (job) => {
    console.log(`[Notification Worker] Dispatching notice '${job.name}' to:`, job.data.recipient || job.data.email);
    // Simulate Brevo / SMS notification dispatch
    return { status: 'sent', recipient: job.data.recipient || job.data.email };
  },
  { connection, concurrency: 5 }
);

// 4. Cache Refresh Worker Processor
const cacheRefreshWorker = new Worker(
  'cache-refresh-queue',
  async (job) => {
    console.log(`[Cache Refresh Worker] Pre-warming cache for route: '${job.data.route || job.name}'`);
    // Pre-warm Redis cache entries
    return { status: 'cache_refreshed', route: job.data.route };
  },
  { connection, concurrency: 2 }
);

// 5. Analytics Worker Processor
const analyticsWorker = new Worker(
  'analytics-queue',
  async (job) => {
    console.log(`[Analytics Worker] Aggregating event '${job.name}':`, job.data);
    // Background metrics aggregation
    return { status: 'recorded', event: job.name };
  },
  { connection, concurrency: 10 }
);

// Logging Event Handlers for All Workers
const workers = [
  { name: 'OTP Worker', worker: otpWorker },
  { name: 'Image Processing Worker', worker: imageProcessingWorker },
  { name: 'Notification Worker', worker: notificationWorker },
  { name: 'Cache Refresh Worker', worker: cacheRefreshWorker },
  { name: 'Analytics Worker', worker: analyticsWorker },
];

workers.forEach(({ name, worker }) => {
  worker.on('completed', (job, result) => {
    console.log(`[${name} Completed] Job "${job.name}" (ID: ${job.id}) finished successfully!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${name} Failed] Job "${job?.name}" (ID: ${job?.id}) error:`, err.message);
  });
});

module.exports = {
  otpWorker,
  imageProcessingWorker,
  notificationWorker,
  cacheRefreshWorker,
  analyticsWorker,
};
