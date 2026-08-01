// Firebase Config — DISABLED (Option 2: Pure Backend OTP)
// All OTP logic is handled by the backend API (/auth/send-otp → /auth/verify-otp).
// Firebase phone auth has been removed to eliminate reCAPTCHA and billing requirements.

// No-op stub — keeps existing imports from breaking
export const auth = null;

export function setupRecaptcha() {
  // No-op: reCAPTCHA is no longer needed
  return null;
}

export async function sendFirebasePhoneOtp(phoneNumber) {
  // No-op: OTP is sent via backend API, not Firebase
  console.info("[Auth] Firebase phone OTP disabled — using backend OTP system");
  return null;
}
