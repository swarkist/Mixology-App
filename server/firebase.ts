import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production';

console.log(`🔥 Firebase Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

// Get appropriate service account based on environment
let serviceAccountEnvKey: string;
let appName: string;

if (isProduction) {
  serviceAccountEnvKey = 'FIREBASE_SERVICE_ACCOUNT_JSON_PROD';
  appName = 'miximixology-prod';
} else {
  serviceAccountEnvKey = 'FIREBASE_SERVICE_ACCOUNT_JSON';
  appName = 'miximixology-dev';
}

// Initialize Firebase Admin SDK with environment-specific credentials
const raw = process.env[serviceAccountEnvKey];
if (!raw) {
  throw new Error(`${serviceAccountEnvKey} secret not set for ${isProduction ? 'production' : 'development'} environment`);
}

// Check if app already exists
const existingApp = admin.apps.find(app => app?.name === appName);

let app: admin.app.App;
if (existingApp) {
  app = existingApp;
} else {
  const serviceAccount = JSON.parse(raw);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  }, appName);
}

export const db = getFirestore(app);
export { admin };

// Log which database we're connected to
console.log(`🔥 Connected to Firebase project: ${appName}`);