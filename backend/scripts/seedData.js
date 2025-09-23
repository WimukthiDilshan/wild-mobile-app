const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin
try {
  // Use absolute path from the project root
  const serviceAccountPath = path.join(__dirname, '..', 'config', 'serviceAccountKey.json');
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });

  console.log('Firebase Admin initialized for seeding');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Sample animal data
const sampleAnimals = [
  {
    name: 'Tiger',
    location: 'Amazon Rainforest',
    count: 15,
    habitat: 'Dense forest',
    status: 'Endangered'
  },
  {
    name: 'Elephant',
    location: 'African Savanna',
    count: 28,
    habitat: 'Grasslands',
    status: 'Vulnerable'
  },
  {
    name: 'Leopard',
    location: 'Amazon Rainforest',
    count: 12,
    habitat: 'Forest canopy',
    status: 'Near Threatened'
  },
  {
    name: 'Orangutan',
    location: 'Borneo Forest',
    count: 8,
    habitat: 'Tropical rainforest',
    status: 'Critically Endangered'
  },
  {
    name: 'Gorilla',
    location: 'Congo Basin',
    count: 22,
    habitat: 'Mountain forest',
    status: 'Critically Endangered'
  },
  {
    name: 'Chimpanzee',
    location: 'Congo Basin',
    count: 35,
    habitat: 'Tropical forest',
    status: 'Endangered'
  },
  {
    name: 'Jaguar',
    location: 'Amazon Rainforest',
    count: 18,
    habitat: 'Dense rainforest',
    status: 'Near Threatened'
  },
  {
    name: 'Snow Leopard',
    location: 'Himalayan Mountains',
    count: 6,
    habitat: 'Mountain slopes',
    status: 'Vulnerable'
  },
  {
    name: 'Panda',
    location: 'Chinese Bamboo Forest',
    count: 25,
    habitat: 'Bamboo forest',
    status: 'Vulnerable'
  },
  {
    name: 'Grizzly Bear',
    location: 'North American Forest',
    count: 31,
    habitat: 'Mixed forest',
    status: 'Least Concern'
  },
  {
    name: 'Wolf',
    location: 'North American Forest',
    count: 45,
    habitat: 'Forest and tundra',
    status: 'Least Concern'
  },
  {
    name: 'Sloth',
    location: 'Amazon Rainforest',
    count: 52,
    habitat: 'Rainforest canopy',
    status: 'Least Concern'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting to seed the database with sample animal data...');
    
    // Clear existing data (optional)
    const existingAnimals = await db.collection('animals').get();
    if (!existingAnimals.empty) {
      console.log('🗑️  Clearing existing animal data...');
      const batch = db.batch();
      existingAnimals.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Add sample data
    console.log('📝 Adding sample animal data...');
    const promises = sampleAnimals.map(async (animal) => {
      const animalData = {
        ...animal,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('animals').add(animalData);
      console.log(`✅ Added ${animal.name} with ID: ${docRef.id}`);
      return docRef;
    });

    await Promise.all(promises);
    
    console.log('🎉 Successfully seeded the database with sample data!');
    console.log(`📊 Total animals added: ${sampleAnimals.length}`);
    
    // Display summary
    const locations = [...new Set(sampleAnimals.map(animal => animal.location))];
    console.log(`📍 Locations: ${locations.length} (${locations.join(', ')})`);
    
    const totalCount = sampleAnimals.reduce((sum, animal) => sum + animal.count, 0);
    console.log(`🦁 Total animal count: ${totalCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();