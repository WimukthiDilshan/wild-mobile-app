const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
try {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './config/serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });

  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  console.log('Please ensure you have set up your Firebase service account key');
}

const db = admin.firestore();

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Forest API is running' });
});

// Get all animals
app.get('/api/animals', async (req, res) => {
  try {
    const animalsSnapshot = await db.collection('animals').get();
    const animals = [];
    
    animalsSnapshot.forEach(doc => {
      animals.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: animals,
      count: animals.length
    });
  } catch (error) {
    console.error('Error fetching animals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch animals data'
    });
  }
});

// Get animal by ID
app.get('/api/animals/:id', async (req, res) => {
  try {
    const animalDoc = await db.collection('animals').doc(req.params.id).get();
    
    if (!animalDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Animal not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: animalDoc.id,
        ...animalDoc.data()
      }
    });
  } catch (error) {
    console.error('Error fetching animal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch animal data'
    });
  }
});

// Get animals by location
app.get('/api/animals/location/:location', async (req, res) => {
  try {
    const animalsSnapshot = await db.collection('animals')
      .where('location', '==', req.params.location)
      .get();
    
    const animals = [];
    animalsSnapshot.forEach(doc => {
      animals.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: animals,
      count: animals.length,
      location: req.params.location
    });
  } catch (error) {
    console.error('Error fetching animals by location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch animals by location'
    });
  }
});

// Get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const animalsSnapshot = await db.collection('animals').get();
    const animals = [];
    
    animalsSnapshot.forEach(doc => {
      animals.push(doc.data());
    });

    // Calculate analytics
    const totalAnimals = animals.length;
    const totalCount = animals.reduce((sum, animal) => sum + (animal.count || 0), 0);
    
    // Group by location
    const locationStats = animals.reduce((acc, animal) => {
      const location = animal.location || 'Unknown';
      if (!acc[location]) {
        acc[location] = { animals: 0, count: 0 };
      }
      acc[location].animals += 1;
      acc[location].count += animal.count || 0;
      return acc;
    }, {});

    // Group by species
    const speciesStats = animals.reduce((acc, animal) => {
      const species = animal.name || 'Unknown';
      if (!acc[species]) {
        acc[species] = { count: 0, locations: new Set() };
      }
      acc[species].count += animal.count || 0;
      acc[species].locations.add(animal.location || 'Unknown');
      return acc;
    }, {});

    // Convert sets to arrays for JSON serialization
    Object.keys(speciesStats).forEach(species => {
      speciesStats[species].locations = Array.from(speciesStats[species].locations);
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalSpecies: totalAnimals,
          totalCount: totalCount,
          locationsCount: Object.keys(locationStats).length
        },
        locationStats,
        speciesStats,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
});

// Add new animal
app.post('/api/animals', async (req, res) => {
  try {
    const { name, location, count } = req.body;
    
    if (!name || !location || count === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, location, and count are required'
      });
    }

    const animalData = {
      name,
      location,
      count: parseInt(count),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('animals').add(animalData);
    
    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...animalData
      }
    });
  } catch (error) {
    console.error('Error adding animal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add animal'
    });
  }
});

// --- Poaching Incidents Endpoints ---

// Get all poaching incidents
app.get('/api/poaching', async (req, res) => {
  try {
    const snapshot = await db.collection('poaching_incidents').orderBy('date', 'desc').get();
    const incidents = [];
    snapshot.forEach(doc => {
      incidents.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, data: incidents, count: incidents.length });
  } catch (error) {
    console.error('Error fetching poaching incidents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch poaching incidents' });
  }
});

// Add a new poaching incident
app.post('/api/poaching', async (req, res) => {
  try {
    const { species, location, date, severity, description, reportedBy } = req.body;
    if (!species || !location || !date || !severity) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const data = {
      species,
      location,
      date,
      severity,
      description: description || '',
      reportedBy: reportedBy || 'Unknown',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('poaching_incidents').add(data);
    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error) {
    console.error('Error adding poaching incident:', error);
    res.status(500).json({ success: false, error: 'Failed to add poaching incident' });
  }
});

// Poaching analytics endpoint
app.get('/api/poaching/analytics', async (req, res) => {
  try {
    const snapshot = await db.collection('poaching_incidents').get();
    const incidents = [];
    snapshot.forEach(doc => incidents.push(doc.data()));

    // Analytics: by location, severity, month
    const byLocation = {};
    const bySeverity = { High: 0, Medium: 0, Low: 0 };
    const byMonth = {};
    incidents.forEach(inc => {
      // Location
      byLocation[inc.location] = (byLocation[inc.location] || 0) + 1;
      // Severity
      if (bySeverity[inc.severity] !== undefined) bySeverity[inc.severity]++;
      // Month
      const month = inc.date ? inc.date.slice(0,7) : 'Unknown';
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    // Creative: Top 3 hotspots, trend, and severity ratio
    const topHotspots = Object.entries(byLocation)
      .sort((a,b) => b[1]-a[1])
      .slice(0,3)
      .map(([location, count]) => ({ location, count }));
    const total = incidents.length;
    const severityRatio = {
      high: ((bySeverity.High/total)*100).toFixed(1),
      medium: ((bySeverity.Medium/total)*100).toFixed(1),
      low: ((bySeverity.Low/total)*100).toFixed(1)
    };
    res.json({
      success: true,
      data: {
        totalIncidents: total,
        byLocation,
        bySeverity,
        byMonth,
        topHotspots,
        severityRatio
      }
    });
  } catch (error) {
    console.error('Error in poaching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch poaching analytics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🌲 Forest API server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});