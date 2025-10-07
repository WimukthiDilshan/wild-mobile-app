const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id });
const db = admin.firestore();

(async function(){
  try {
    const snapshot = await db.collection('push_receipts').orderBy('receivedAt','desc').limit(50).get();
    console.log('Found', snapshot.size, 'receipts');
    snapshot.forEach(doc => {
      console.log('---', doc.id);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  } catch (err) {
    console.error('Failed to read push_receipts:', err);
    process.exitCode = 1;
  }
})();
