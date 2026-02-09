/**
 * Firebase Configuration
 *
 * IMPORTANT: This file should contain placeholder values only!
 * The actual values should be set via:
 * 1. Vercel/Netlify environment variables (for production)
 * 2. Local config.local.js file (for development - gitignored)
 *
 * SECURITY NOTE: For client-side apps, Firebase API keys are designed to be public,
 * but you should still:
 * 1. Set up proper Firebase Security Rules
 * 2. Enable App Check for additional security
 * 3. Restrict your API key in the Google Cloud Console
 */

// Firebase configuration - values injected at runtime
// These placeholders will be replaced during deployment or loaded from config.local.js
const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: window.FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: window.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: window.FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: window.FIREBASE_APP_ID || "YOUR_APP_ID",
  databaseURL: window.FIREBASE_DATABASE_URL || "YOUR_DATABASE_URL",
};

// Validate configuration
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

if (!isConfigured) {
  console.error(
    "⚠️ Firebase not configured! Please set up your environment variables.",
  );
  console.error("See README.md for setup instructions.");

  // Show user-friendly error on page
  document.addEventListener("DOMContentLoaded", () => {
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.innerHTML = `
        <span style="color: red;">
          ⚠️ App not configured. Please set up Firebase credentials.<br>
          <small>See README.md for instructions.</small>
        </span>
      `;
    }
  });
} else {
  // Initialize Firebase only if configured
  firebase.initializeApp(firebaseConfig);

  // Initialize services
  window.database = firebase.database();
  window.storage = firebase.storage ? firebase.storage() : null;

  console.log("Firebase initialized successfully ✅");
}

// Export for use in other scripts
window.firebaseConfig = firebaseConfig;
