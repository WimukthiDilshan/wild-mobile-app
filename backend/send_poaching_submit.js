const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id });
const db = admin.firestore();

async function run() {
  try {
    const data = {
      species: 'Elephant',
      location: 'Sector Z',
      status: 'pending',
      date: new Date().toISOString(),
      severity: 'High',
      description: 'Automated real poaching submit test',
      evidence: [],
      reportedBy: 'Automated Test',
      reportedByUserId: 'automated-test',
      reportedByRole: 'tester',
      reportedAt: new Date().toISOString(),
      createdBy: { uid: 'automated-test', displayName: 'Automated Test', email: '', role: 'tester' },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('poaching_incidents').add(data);
    console.log('Created poaching incident:', docRef.id);

    // Collect officer tokens
    const officersSnapshot = await db.collection('users').where('role', '==', 'officer').get();
    const tokens = [];
    officersSnapshot.forEach(doc => {
      const u = doc.data();
      const t = u.pushToken || u.fcmToken || u.notificationToken;
      if (t) tokens.push(t);
    });

    console.log('Found', tokens.length, 'officer tokens');
    const notificationPayload = {
      notification: {
        title: '🚨 New Poaching Report',
        body: `${data.species} reported at ${data.location} (severity: ${data.severity})`
      },
      data: { incidentId: docRef.id, type: 'poaching' }
    };

    if (tokens.length === 0) {
      console.log('No tokens found, publishing to topic officers');
      await admin.messaging().send({ topic: 'officers', notification: notificationPayload.notification, data: notificationPayload.data });
      console.log('Published to topic: officers');
      return;
    }

    let totalSuccess = 0;
    let totalFailure = 0;
    for (const token of tokens) {
      try {
        const resp = await admin.messaging().send({ token, notification: notificationPayload.notification, data: notificationPayload.data, android: { priority: 'high', notification: { sound: 'default' } }, apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } } });
        console.log('Sent to token:', token, 'response id:', resp);
        totalSuccess++;
      } catch (err) {
        totalFailure++;
        console.error('Send error for token', token, err && err.code ? err.code : err.message || err);
      }
    }

    console.log('Send summary:', totalSuccess, 'successes,', totalFailure, 'failures');
  } catch (err) {
    console.error('Error in send_poaching_submit:', err);
    process.exitCode = 1;
  }
}

run().then(() => setTimeout(() => process.exit(0), 500)).catch(e => { console.error(e); process.exit(1); });
