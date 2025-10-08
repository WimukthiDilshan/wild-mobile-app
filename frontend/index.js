import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';
import OfflineQueue from './src/services/OfflineQueue';

// Register background handler for FCM messages.
// This runs in a headless JS context when a data-message arrives while the app is backgrounded.
messaging().setBackgroundMessageHandler(async remoteMessage => {
	// Keep this light-weight. Use for logging, small Firestore writes, or to schedule a local notification.
	console.log('FCM background message received:', JSON.stringify(remoteMessage));

	try {
		// Optional: write a lightweight receipt to Firestore so backend/devs can verify delivery.
		// NOTE: Avoid importing heavy modules here if not needed; this is optional and commented out.
		// const firestore = require('@react-native-firebase/firestore').default();
		// await firestore.collection('push_receipts').add({
		//   messageId: remoteMessage.messageId || null,
		//   data: remoteMessage.data || {},
		//   receivedAt: new Date().toISOString()
		// });
	} catch (e) {
		console.warn('Background handler error (non-fatal):', e);
	}
});

AppRegistry.registerComponent(appName, () => App);

// Start offline queue flushing when app starts
OfflineQueue.start();