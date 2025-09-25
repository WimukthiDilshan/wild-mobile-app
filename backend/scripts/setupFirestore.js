const admin = require('firebase-admin');
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'forest-animals-app'
});

const db = admin.firestore();

async function setupCollections() {
  console.log('🔄 Setting up Firestore collections...');

  try {
    // Create users collection with sample data
    console.log('📁 Creating users collection...');
    await db.collection('users').doc('sample-researcher').set({
      email: 'researcher@example.com',
      displayName: 'Sample Researcher',
      firstName: 'Research',
      lastName: 'User',
      role: 'researcher',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create animals collection with sample data
    console.log('🦁 Creating animals collection...');
    await db.collection('animals').doc('sample-animal-1').set({
      species: 'African Lion',
      scientificName: 'Panthera leo',
      location: 'Serengeti National Park',
      habitat: 'Savanna',
      status: 'Vulnerable',
      population: 2500,
      description: 'Majestic big cat species found in African savannas',
      imageUrl: '',
      createdBy: 'sample-researcher',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('animals').doc('sample-animal-2').set({
      species: 'Asian Elephant',
      scientificName: 'Elephas maximus',
      location: 'Thailand National Park',
      habitat: 'Forest',
      status: 'Endangered',
      population: 1200,
      description: 'Large herbivorous mammal with distinctive trunk',
      imageUrl: '',
      createdBy: 'sample-researcher',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create poaching_incidents collection with sample data
    console.log('🚨 Creating poaching_incidents collection...');
    await db.collection('poaching_incidents').doc('sample-incident-1').set({
      species: 'African Rhino',
      location: 'Kruger National Park',
      date: '2025-09-20',
      severity: 'High',
      description: 'Illegal hunting activity reported by park rangers',
      reportedBy: 'Park Ranger',
      status: 'Under Investigation',
      createdBy: 'sample-researcher',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ All collections created successfully!');
    console.log('\n📋 Collections created:');
    console.log('  - users (with sample researcher account)');
    console.log('  - animals (with 2 sample animals)');
    console.log('  - poaching_incidents (with 1 sample incident)');
    console.log('\n🔐 Firebase Authentication is ready for signups!');
    
  } catch (error) {
    console.error('❌ Error setting up collections:', error);
  } finally {
    process.exit(0);
  }
}

// Run setup
setupCollections();