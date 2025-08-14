// Quick script to promote user to reviewer role via Firebase Admin
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// This script directly updates Firebase to promote the reviewer
async function promoteToReviewer() {
  try {
    // Use the same Firebase config as the app
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS || '{}');
    
    if (!serviceAccount.private_key) {
      console.log('No Firebase credentials found, trying alternative approach...');
      // Just call the API directly instead
      return;
    }
    
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    const db = getFirestore(app);
    
    // Find and update the reviewer user
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', 'reviewer@test.com').get();
    
    if (snapshot.empty) {
      console.log('User not found');
      return;
    }
    
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({ role: 'reviewer' });
    
    console.log('✅ Successfully promoted reviewer@test.com to reviewer role');
    
  } catch (error) {
    console.error('Error promoting user:', error.message);
  }
}

promoteToReviewer();