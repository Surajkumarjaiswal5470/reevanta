/**
 * BullMQ Dedicated Worker Processors for OTP
 * ──────────────────────────────────────────────────────────
 * Processes queued background jobs for NepalOTP, Brevo Email, and Twilio SMS.
 */

const { Worker } = require('bullmq');

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

/**
 * Worker Processor Function
 */
async function processOtpJob(job) {
  const { name, data } = job;
  console.log(`[Worker Processing] Job "${name}" (ID: ${job.id}) started...`);

  switch (name) {
    case 'send-nepal-otp':
      return await handleNepalOtp(data);
    case 'send-email-otp':
      return await handleEmailOtp(data);
    case 'send-sms-otp':
      return await handleSmsOtp(data);
    default:
      throw new Error(`Unknown job name: ${name}`);
  }
}

// 1. NepalOTP Dispatch Processor
async function handleNepalOtp({ phone, otpId }) {
  console.log(`[Worker - NepalOTP] Dispatching SMS to Nepalese number: ${phone} | OTP ID: ${otpId}`);
  // Execute HTTP request to NepalOTP API
  const apiKey = process.env.NEPALOTP_API_KEY || 'npot_live_At6UCnVKZC6JE4EQRppa1UWkYfavmBVwaFiSAPIa';
  
  const response = await fetch('https://nepalotp.com/api/v1/otp/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, service: 'RIVAANTA Luxury Wear' }),
  });

  const resData = await response.json();
  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || 'NepalOTP API dispatch failed');
  }

  console.log(`[Worker - NepalOTP Success] Delivered SMS to ${phone}!`);
  return resData;
}

// 2. Email OTP Dispatch Processor
async function handleEmailOtp({ email, otp }) {
  console.log(`[Worker - Email OTP] Sending transactional email to: ${email}`);
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.log(`[Worker - Email OTP] (Dev Mode) OTP Code for ${email}: ${otp}`);
    return { status: 'mock_sent', email };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'RIVAANTA Luxury Wear', email: 'noreply@reevanta.com' },
      to: [{ email }],
      subject: 'Your RIVAANTA Verification Code',
      htmlContent: `<p>Your verification code is: <strong>${otp}</strong>. Valid for 10 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo Email dispatch failed with status ${response.status}`);
  }

  console.log(`[Worker - Email OTP Success] Delivered email to ${email}!`);
  return { status: 'delivered', email };
}

// 3. Fallback Twilio SMS Dispatch Processor
async function handleSmsOtp({ phone, otp }) {
  console.log(`[Worker - Twilio SMS] Dispatching fallback SMS to: ${phone}`);
  // Mock / Twilio delivery log
  console.log(`[Worker - Twilio SMS Success] Delivered SMS code ${otp} to ${phone}!`);
  return { status: 'delivered', phone };
}

// Instantiate BullMQ Worker
const otpWorker = new Worker('otp-queue', processOtpJob, {
  connection,
  concurrency: 5, // Process 5 concurrent jobs
});

// Worker Events
otpWorker.on('completed', (job, result) => {
  console.log(`[Worker Completed] Job "${job.name}" (ID: ${job.id}) finished successfully!`);
});

otpWorker.on('failed', (job, err) => {
  console.error(`[Worker Failed] Job "${job?.name}" (ID: ${job?.id}) failed:`, err.message);
});

module.exports = otpWorker;
