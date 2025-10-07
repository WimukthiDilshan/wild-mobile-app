const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id });
const db = admin.firestore();

async function send() {
  try {
    const snapshot = await db.collection('users').where('role', '==', 'officer').get();
    const tokens = [];
    snapshot.forEach(doc => {
      const u = doc.data();
      const t = u.pushToken || u.fcmToken || u.notificationToken;
      if (t) tokens.push(t);
    });

    console.log('Found', tokens.length, 'tokens');
    if (tokens.length === 0) return console.log('No tokens to send to');

    const notification = {
      notification: {
        title: 'Test: Poaching Alert',
        body: 'This is a targeted dev multicast test to officer devices'
      },
      data: { test: '1', type: 'poaching' }
    };

    let totalSuccess = 0;
    let totalFailure = 0;
    const invalidTokens = [];

    // Fall back to per-token sends to avoid /batch endpoint issues in some environments
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      try {
        const resp = await admin.messaging().send({
          token,
          notification: notification.notification,
          data: notification.data,
          android: { priority: 'high', notification: { sound: 'default' } },
          apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } }
        });
        console.log('Sent to token:', token, 'response id:', resp);
        totalSuccess++;
      } catch (err) {
        totalFailure++;
        console.error('Failed sending to token:', token, err && err.code ? err.code : err.message || err);
        // Mark common invalid token errors for cleanup
        const code = err && err.errorInfo && err.errorInfo.code ? err.errorInfo.code : (err && err.code) || '';
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') {
          invalidTokens.push(token);
        }
      }
    }

    // Cleanup invalid tokens from user documents
    if (invalidTokens.length > 0) {
      try {
        const usersRef = db.collection('users');
        const snapshotAll = await usersRef.get();
        const updates = [];
        snapshotAll.forEach(doc => {
          const u = doc.data();
          const userTokens = new Set([u.fcmToken, u.pushToken, u.notificationToken].filter(Boolean));
          const intersect = invalidTokens.filter(t => userTokens.has(t));
          if (intersect.length > 0) {
            const docRef = usersRef.doc(doc.id);
            const updatePayload = {};
            if (intersect.includes(u.fcmToken)) updatePayload.fcmToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
            if (intersect.includes(u.pushToken)) updatePayload.pushToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
            if (intersect.includes(u.notificationToken)) updatePayload.notificationToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
            updates.push(docRef.update(updatePayload).catch(e => console.debug('Failed to cleanup token for user', doc.id, e.message || e)));
          }
        });
        await Promise.all(updates);
        console.log('Cleaned up', updates.length, 'user records with invalid tokens');
      } catch (cleanupErr) {
        console.error('Error cleaning up invalid tokens', cleanupErr);
      }
    }

    console.log('Total sent summary:', totalSuccess, 'successes,', totalFailure, 'failures');
  } catch (err) {
    console.error('Error sending multicast to officers:', err);
  }
}

send().then(() => process.exit(0));
