const admin = require('firebase-admin');

// Note: In production, store the serviceAccount in environment variables securely.
// For this MVP, we will try to initialize with default application credentials if running on GCP
// or fallback to an empty mock app if no credentials are provided to prevent server crash.
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
  console.log("Firebase Admin Initialized Successfully");
} catch (error) {
  console.warn("Firebase Admin Initialization Warning: ", error.message);
}

const db = admin.firestore ? admin.firestore() : null;

module.exports = { admin, db };
