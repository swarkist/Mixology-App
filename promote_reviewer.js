// Script to promote user to reviewer role  
// Usage: node promote_reviewer.js

import admin from 'firebase-admin';

// Initialize with development credentials
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function promoteUserToReviewer(email) {
  try {
    console.log(`Searching for user with email: ${email}`);
    
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (usersSnapshot.empty) {
      console.error(`User with email ${email} not found`);
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`Found user:`, {
      id: userDoc.id,
      email: userData.email,
      currentRole: userData.role
    });
    
    // Update role to reviewer
    await userDoc.ref.update({
      role: 'reviewer',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Successfully promoted ${email} to reviewer role`);
    
    // Verify the update
    const updatedDoc = await userDoc.ref.get();
    const updatedData = updatedDoc.data();
    console.log(`Verified: new role is "${updatedData.role}"`);
    
  } catch (error) {
    console.error('Error promoting user:', error);
  } finally {
    process.exit(0);
  }
}

// Promote the test reviewer user
promoteUserToReviewer('revieweruser@test.com');