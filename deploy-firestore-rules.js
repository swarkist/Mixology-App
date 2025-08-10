#!/usr/bin/env node

/**
 * Deploy Firestore Rules using Service Account
 * This script deploys Firestore security rules to Firebase using the service account
 * that's already configured for the application.
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

async function deployFirestoreRules() {
  try {
    console.log('🔥 Starting Firestore Rules Deployment...');
    
    // Check if service account is available
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON environment variable not found');
      console.log('This environment variable is required for authentication.');
      process.exit(1);
    }
    
    // Check if project ID is available
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('❌ FIREBASE_PROJECT_ID environment variable not found');
      process.exit(1);
    }
    
    // Verify firestore.rules exists
    if (!fs.existsSync('firestore.rules')) {
      console.error('❌ firestore.rules file not found');
      process.exit(1);
    }
    
    console.log('✅ Service account detected');
    console.log('✅ Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('✅ Rules file found');
    
    // Write service account to temporary file
    const serviceAccountPath = '/tmp/service-account.json';
    fs.writeFileSync(serviceAccountPath, process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    // Set Google Cloud credentials
    process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;
    
    console.log('🚀 Deploying Firestore rules...');
    
    // Deploy using Firebase CLI with service account authentication
    exec(`firebase use ${process.env.FIREBASE_PROJECT_ID} && firebase deploy --only firestore:rules`, {
      env: {
        ...process.env,
        GOOGLE_APPLICATION_CREDENTIALS: serviceAccountPath
      }
    }, (error, stdout, stderr) => {
      // Clean up temp file
      if (fs.existsSync(serviceAccountPath)) {
        fs.unlinkSync(serviceAccountPath);
      }
      
      if (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('stderr:', stderr);
        process.exit(1);
      }
      
      console.log('stdout:', stdout);
      if (stderr) {
        console.log('stderr:', stderr);
      }
      
      console.log('✅ Firestore rules deployed successfully!');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployFirestoreRules();