const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const { PythonShell } = require('python-shell'); // Or Flask API approach
const { spawn } = require('child_process');

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

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Fetch user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userDoc.data()
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          ...userDoc.data()
        };
      }
    }
    next();
  } catch (error) {
    // Continue without user context if auth fails
    next();
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Forest API is running' });
});

// Get all animals
app.get('/api/animals', optionalAuth, async (req, res) => {
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

// Add new animal (requires authentication)
app.post('/api/animals', authenticateUser, async (req, res) => {
  try {
    const { 
      name, location, count, habitat, status, description,
      addedBy, addedByUserId, addedByRole, addedAt 
    } = req.body;
    
    if (!name || !location || count === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, location, and count are required'
      });
    }

    // Check if user has permission to add animals
    const userRole = req.user.role;
    if (!userRole || (userRole !== 'driver' && userRole !== 'researcher' && userRole !== 'visitor')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to add animal data'
      });
    }

    const animalData = {
      name,
      location,
      count: parseInt(count),
      habitat: habitat || '',
      status: status || 'Not Evaluated',
      description: description || '',
      // Enhanced user tracking (from frontend)
      addedBy: addedBy || req.user.displayName || req.user.email,
      addedByUserId: addedByUserId || req.user.uid,
      addedByRole: addedByRole || req.user.role,
      addedAt: addedAt || new Date().toISOString(),
      // Legacy format (for backward compatibility)
      createdBy: {
        uid: req.user.uid,
        displayName: req.user.displayName,
        email: req.user.email,
        role: req.user.role,
      },
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
app.get('/api/poaching', optionalAuth, async (req, res) => {
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

// Add a new poaching incident (requires authentication)
app.post('/api/poaching', authenticateUser, async (req, res) => {
  try {
    const { 
      species, location, date, severity, description,
      reportedBy, reportedByUserId, reportedByRole, reportedAt 
    } = req.body;
    if (!species || !location || !date || !severity) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if user has permission to report poaching incidents
    const userRole = req.user.role;
    if (!userRole || (userRole !== 'driver' && userRole !== 'researcher' && userRole !== 'visitor')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to report poaching incidents'
      });
    }

    const data = {
      species,
      location,
      date,
      severity,
      description: description || '',
      // Enhanced user tracking (from frontend)
      reportedBy: reportedBy || req.user.displayName || req.user.email,
      reportedByUserId: reportedByUserId || req.user.uid,
      reportedByRole: reportedByRole || req.user.role,
      reportedAt: reportedAt || new Date().toISOString(),
      // Legacy format (for backward compatibility)
      createdBy: {
        uid: req.user.uid,
        displayName: req.user.displayName,
        email: req.user.email,
        role: req.user.role,
      },
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

// ===== PARK MANAGEMENT ENDPOINTS =====

// Get all parks
app.get('/api/parks', optionalAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('parks').orderBy('name').get();
    const parks = [];
    snapshot.forEach(doc => {
      parks.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, data: parks });
  } catch (error) {
    console.error('Error fetching parks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch parks' });
  }
});

// Get park by ID
app.get('/api/parks/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('parks').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Park not found' });
    }
    
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error fetching park:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch park' });
  }
});

// Get parks by category
app.get('/api/parks/category/:category', optionalAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const snapshot = await db.collection('parks')
      .where('category', '==', decodeURIComponent(category))
      .orderBy('name')
      .get();
    
    const parks = [];
    snapshot.forEach(doc => {
      parks.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ success: true, data: parks });
  } catch (error) {
    console.error('Error fetching parks by category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch parks by category' });
  }
});

// Add new park
app.post('/api/parks', authenticateUser, async (req, res) => {
  try {
    const {
      name,
      location,
      area,
      established,
      description,
      coordinates,
      facilities,
      category,
      status
    } = req.body;

    // Validation
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        error: 'Name and location are required fields'
      });
    }

    const parkData = {
      name: name.trim(),
      location: location.trim(),
      area: area ? parseFloat(area) : 0,
      established: established || '',
      description: description || '',
      coordinates: coordinates || { latitude: 0, longitude: 0 },
      facilities: facilities || '',
      category: category || 'National Park',
      status: status || 'Active',
      createdBy: {
        uid: req.user.uid,
        displayName: req.user.displayName,
        email: req.user.email,
        role: req.user.role,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('parks').add(parkData);
    res.status(201).json({ success: true, data: { id: docRef.id, ...parkData } });
  } catch (error) {
    console.error('Error adding park:', error);
    res.status(500).json({ success: false, error: 'Failed to add park' });
  }
});

// Update park
app.put('/api/parks/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      location,
      area,
      established,
      description,
      coordinates,
      facilities,
      category,
      status
    } = req.body;

    // Check if park exists
    const parkDoc = await db.collection('parks').doc(id).get();
    if (!parkDoc.exists) {
      return res.status(404).json({ success: false, error: 'Park not found' });
    }

    // Validation
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        error: 'Name and location are required fields'
      });
    }

    const updateData = {
      name: name.trim(),
      location: location.trim(),
      area: area ? parseFloat(area) : 0,
      established: established || '',
      description: description || '',
      coordinates: coordinates || { latitude: 0, longitude: 0 },
      facilities: facilities || '',
      category: category || 'National Park',
      status: status || 'Active',
      updatedBy: {
        uid: req.user.uid,
        displayName: req.user.displayName,
        email: req.user.email,
        role: req.user.role,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('parks').doc(id).update(updateData);
    res.json({ success: true, data: { id, ...updateData } });
  } catch (error) {
    console.error('Error updating park:', error);
    res.status(500).json({ success: false, error: 'Failed to update park' });
  }
});

// Delete park
app.delete('/api/parks/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if park exists
    const parkDoc = await db.collection('parks').doc(id).get();
    if (!parkDoc.exists) {
      return res.status(404).json({ success: false, error: 'Park not found' });
    }

    await db.collection('parks').doc(id).delete();
    res.json({ success: true, data: { message: 'Park deleted successfully' } });
  } catch (error) {
    console.error('Error deleting park:', error);
    res.status(500).json({ success: false, error: 'Failed to delete park' });
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


app.post('/api/recommend', (req, res) => {
  const input = JSON.stringify(req.body);

  const py = spawn('python', ['python/predict.py', input]);

  let data = '';
  let error = '';

  py.stdout.on('data', (chunk) => {
    data += chunk.toString();
  });

  py.stderr.on('data', (chunk) => {
    error += chunk.toString();
  });

  py.on('close', (code) => {
    if (error) {
      return res.status(500).json({ success: false, error });
    }
    try {
      // Wrap Python output in expected format
      res.json({
        success: true,
        data: { topParks: JSON.parse(data) }
      });
    } catch (e) {
      res.status(500).json({ success: false, error: 'Invalid JSON from Python', raw: data });
    }
  });
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