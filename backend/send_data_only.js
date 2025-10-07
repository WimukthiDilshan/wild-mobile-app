const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id });
const db = admin.firestore();

async function send() {
  try {
    // Replace this token with the officer token you want to target
    const token = 'cgAfdFCjS7im3YUgF8jq__:APA91bG1wgnZTBR_HwUd3pC-AZpyPl4BGVRF0tJu9eyPUzVWjRdk60OBfVfrIKKGtiL7MUwZFrdLkVQo xMUnOxsfu8qbF9HeArLoGbsjjyEHnyqcKAH4Uj4'.replace(/\s+/g, '');

    console.log('Sending data-only message to token:', token);

    const message = {
      token,
      data: {
        type: 'poaching',
        incidentId: 'test-data-only-12345',
        title: 'Data-only test',
        body: 'This is a data-only payload to trigger onMessageReceived'
      },
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' }, payload: { aps: { 'content-available': 1 } } }
    };

    const resp = await admin.messaging().send(message);
    console.log('FCM send response:', resp);
  } catch (err) {
    console.error('Error sending data-only message:', err);
  }
}

send().then(() => process.exit(0));
