#!/usr/bin/env tsx
/**
 * Test script to verify production Firebase connection
 * 
 * This script temporarily switches to production mode to test the connection
 * without affecting the development environment.
 * 
 * Usage: ENVIRONMENT=production tsx server/scripts/test-production-connection.ts
 */

// Override environment for this test
process.env.ENVIRONMENT = 'production';

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

async function testProductionConnection() {
  console.log('🔧 Testing production Firebase connection...');
  
  try {
    // Verify production service account is available
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PROD) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON_PROD secret not set');
    }
    
    // Initialize production Firebase
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PROD);
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    }, 'prod-test');
    
    const db = getFirestore(app);
    
    // Test basic database operations
    console.log('📋 Testing basic database operations...');
    
    // Test read operations
    const cocktailsSnapshot = await db.collection('cocktails').limit(1).get();
    const ingredientsSnapshot = await db.collection('ingredients').limit(1).get();
    const tagsSnapshot = await db.collection('tags').limit(1).get();
    
    console.log(`✅ Connection successful!`);
    console.log(`📊 Database status:`);
    console.log(`   - Cocktails: ${cocktailsSnapshot.size} records`);
    console.log(`   - Ingredients: ${ingredientsSnapshot.size} records`);
    console.log(`   - Tags: ${tagsSnapshot.size} records`);
    
    // Test write operation (safe test document)
    const testRef = db.collection('_test').doc('connection-test');
    await testRef.set({
      timestamp: new Date(),
      message: 'Production connection test successful'
    });
    
    // Clean up test document
    await testRef.delete();
    
    console.log('✅ Write operations working correctly');
    console.log('🎉 Production Firebase connection is ready for deployment!');
    
  } catch (error) {
    console.error('❌ Production connection test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_JSON_PROD')) {
        console.log('\n💡 Solution: Add the production Firebase service account JSON as FIREBASE_SERVICE_ACCOUNT_JSON_PROD secret');
      } else if (error.message.includes('permission')) {
        console.log('\n💡 Solution: Verify the production service account has the correct permissions');
      } else if (error.message.includes('project')) {
        console.log('\n💡 Solution: Verify the production Firebase project ID in the service account JSON');
      }
    }
    
    process.exit(1);
  }
  
  process.exit(0);
}

testProductionConnection();