const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
  });
}

const db = admin.firestore();

// Set up temporary Firestore rules for testing
async function setupTestRules() {
  try {
    console.log('🔧 Setting up test Firestore rules...');
    
    // Note: Firestore rules can only be updated through Firebase Console or Firebase CLI
    // This script will just verify the setup
    
    const testDoc = await db.collection('test').doc('connection').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: 'Firebase connection test'
    });
    
    console.log('✅ Firebase Admin connection successful!');
    console.log('📋 Next steps:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/forest-animals-app');
    console.log('2. Enable Authentication > Sign-in method > Email/Password');
    console.log('3. Go to Firestore Database > Rules');
    console.log('4. Replace rules with:');
    console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users (temporary for testing)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
    `);
    console.log('5. Click "Publish"');
    
  } catch (error) {
    console.error('❌ Error setting up Firebase:', error);
  }
}

setupTestRules();