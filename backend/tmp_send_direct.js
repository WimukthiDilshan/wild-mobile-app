const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const token = 'cgAfdFCjS7im3YUgF8jq__:APA91bG1wgnZTBR_HwUd3pC-AZpyPl4BGVRF0tJu9eyPUzVWjRdk60OBfVfrIKKGtiL7MUwZFrdLkVQoxMUnOxsfu8qbF9HeArLoGbsjjyEHnyqcKAH4Uj4';

(async () => {
  try {
    const resp = await admin.messaging().send({
      token,
      notification: { title: 'Confirm direct', body: 'Server -> direct token test' },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } }
    });
    console.log('SENT', resp);
  } catch (err) {
    console.error('ERR', err);
  }
})();
