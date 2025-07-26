import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Check if we have service account credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      // Use service account key (recommended for production)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } catch (error) {
      console.error('Failed to parse Firebase service account key:', error);
      // Fall back to using just project ID
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Use project ID only (works in some environments with default credentials)
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    throw new Error('Firebase configuration missing. Please provide FIREBASE_PROJECT_ID and optionally FIREBASE_SERVICE_ACCOUNT_KEY');
  }
}

export const db = getFirestore();
export { admin };