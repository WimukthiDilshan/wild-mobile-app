const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin
try {
	const serviceAccountPath = path.join(__dirname, '..', 'config', 'serviceAccountKey.json');
	const serviceAccount = require(serviceAccountPath);
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		projectId: process.env.FIREBASE_PROJECT_ID
	});
	console.log('Firebase Admin initialized for poaching seeding');
} catch (error) {
	console.error('Error initializing Firebase Admin:', error.message);
	process.exit(1);
}

const db = admin.firestore();

// Sample poaching incidents
const sampleIncidents = [
	{
		species: 'Elephant',
		location: 'African Savanna',
		date: '2025-08-12',
		severity: 'High',
		description: 'Two elephants found poached for ivory.',
		reportedBy: 'Ranger A'
	},
	{
		species: 'Tiger',
		location: 'Amazon Rainforest',
		date: '2025-07-30',
		severity: 'Medium',
		description: 'Tiger snare trap discovered, animal rescued.',
		reportedBy: 'Ranger B'
	},
	{
		species: 'Panda',
		location: 'Chinese Bamboo Forest',
		date: '2025-06-15',
		severity: 'Low',
		description: 'Suspicious activity near panda habitat.',
		reportedBy: 'Ranger C'
	},
	{
		species: 'Gorilla',
		location: 'Congo Basin',
		date: '2025-08-01',
		severity: 'High',
		description: 'Evidence of gorilla poaching, investigation ongoing.',
		reportedBy: 'Ranger D'
	},
	{
		species: 'Jaguar',
		location: 'Amazon Rainforest',
		date: '2025-07-20',
		severity: 'Medium',
		description: 'Jaguar skin found, poachers not apprehended.',
		reportedBy: 'Ranger E'
	},
	{
		species: 'Snow Leopard',
		location: 'Himalayan Mountains',
		date: '2025-05-10',
		severity: 'Low',
		description: 'Illegal traps found, no casualties.',
		reportedBy: 'Ranger F'
	},
	{
		species: 'Orangutan',
		location: 'Borneo Forest',
		date: '2025-08-05',
		severity: 'High',
		description: 'Orangutan infant missing, suspected poaching.',
		reportedBy: 'Ranger G'
	},
	{
		species: 'Wolf',
		location: 'North American Forest',
		date: '2025-07-28',
		severity: 'Medium',
		description: 'Wolf pack disturbed by illegal hunters.',
		reportedBy: 'Ranger H'
	},
	{
		species: 'Sloth',
		location: 'Amazon Rainforest',
		date: '2025-06-22',
		severity: 'Low',
		description: 'Sloth habitat encroachment, no direct poaching.',
		reportedBy: 'Ranger I'
	},
	{
		species: 'Leopard',
		location: 'Amazon Rainforest',
		date: '2025-08-10',
		severity: 'Medium',
		description: 'Leopard caught in snare, released by rangers.',
		reportedBy: 'Ranger J'
	}
];

async function seedPoachingIncidents() {
	try {
		console.log('🌱 Seeding poaching incidents...');
		// Optional: Clear existing poaching data
		const existing = await db.collection('poaching_incidents').get();
		if (!existing.empty) {
			console.log('🗑️  Clearing existing poaching data...');
			const batch = db.batch();
			existing.docs.forEach(doc => batch.delete(doc.ref));
			await batch.commit();
		}
		// Add sample incidents
		const promises = sampleIncidents.map(async (incident) => {
			const data = {
				...incident,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp()
			};
			const docRef = await db.collection('poaching_incidents').add(data);
			console.log(`✅ Added incident for ${incident.species} at ${incident.location}`);
			return docRef;
		});
		await Promise.all(promises);
		console.log('🎉 Poaching incidents seeded!');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error seeding poaching incidents:', error);
		process.exit(1);
	}
}

seedPoachingIncidents();
