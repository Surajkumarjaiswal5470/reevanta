// Firebase Config for Real-Time Phone OTP SMS Authentication
// 10,000 FREE Real SMS / Month on Firebase Identity Platform

import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAdoaOuGlTeQYfEk-K0UPnOJEyESmEZP2w",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "reevanta.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "reevanta",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "reevanta.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "867140435902",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:867140435902:web:546fdd89805a85dd6343ef",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-L54P0NPB4P"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Helper function to setup invisible reCAPTCHA for Phone OTP
export function setupRecaptcha(containerId = "recaptcha-container") {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      }
    });
  }
  return window.recaptchaVerifier;
}

// Send Real-Time Firebase OTP SMS
export async function sendFirebasePhoneOtp(phoneNumber) {
  const appVerifier = setupRecaptcha();
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  window.confirmationResult = confirmationResult;
  return confirmationResult;
}
