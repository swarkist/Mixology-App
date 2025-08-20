// Migration script to associate existing preferred brands with user ID 1754948843579
import admin from 'firebase-admin';

// Initialize Firebase Admin with development config
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID_DEV || "miximixology-dev",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID_DEV,
  "private_key": (process.env.FIREBASE_PRIVATE_KEY_DEV || '').replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL_DEV,
  "client_id": process.env.FIREBASE_CLIENT_ID_DEV,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL_DEV,
  "universe_domain": "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migratePreferredBrands() {
  const targetUserId = 1754948843579;
  
  try {
    console.log('🔥 Starting migration of preferred brands to user ID:', targetUserId);
    
    const snapshot = await db.collection('preferred_brands').get();
    console.log('🔥 Found', snapshot.size, 'preferred brands to migrate');
    
    let migrated = 0;
    let skipped = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check if it already has a user_id
      if (data.user_id) {
        console.log('⏭️ Skipping brand', doc.id, '- already has user_id:', data.user_id);
        skipped++;
        continue;
      }
      
      // Add user_id to existing brand
      await doc.ref.update({
        user_id: targetUserId,
        updatedAt: new Date()
      });
      
      console.log('✅ Migrated brand', doc.id, '(', data.name, ') to user', targetUserId);
      migrated++;
    }
    
    console.log('🎉 Migration completed!');
    console.log('  - Migrated:', migrated, 'brands');
    console.log('  - Skipped:', skipped, 'brands (already had user_id)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
  
  process.exit(0);
}

migratePreferredBrands();