const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const { PythonShell } = require('python-shell'); // Or Flask API approach
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Simple request logger for debugging (prints method and path)
app.use((req, res, next) => {
  try {
    console.log(new Date().toISOString(), req.method, req.originalUrl || req.url);
  } catch (e) {}
  next();
});

// Initialize Firebase Admin
try {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './config/serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
  });

  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  console.log('Please ensure you have set up your Firebase service account key');
}

const db = admin.firestore();

/**
 * Build a richer notification + data payload for poaching incidents.
 * Includes species, location, severity, reporter and reportedAt fields.
 */
function buildPoachingNotification(incidentId, incidentData, opts = {}) {
  const reporter = incidentData.reportedBy || incidentData.reportedByUserId || incidentData.reportedByRole || 'Unknown';
  const species = incidentData.species || 'Unknown species';
  const severity = incidentData.severity || 'Unknown';
  const reportedAt = incidentData.reportedAt || incidentData.date || new Date().toISOString();

  // Normalize location to a short string
  let locationStr = 'Unknown location';
  if (typeof incidentData.location === 'string' && incidentData.location.trim()) {
    locationStr = incidentData.location;
  } else if (incidentData.location && typeof incidentData.location === 'object') {
    const lat = incidentData.location.latitude || incidentData.location.lat || '';
    const lon = incidentData.location.longitude || incidentData.location.lng || incidentData.location.lon || '';
    if (lat || lon) locationStr = `${lat},${lon}`;
    else if (incidentData.location.name) locationStr = incidentData.location.name;
  }

  const shortDesc = (incidentData.description || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const title = opts.dev ? `🚨 New Poaching Report (dev): ${species}` : `🚨 New Poaching Report`;
  const bodyParts = [`${species}`];
  if (locationStr) bodyParts.push(`at ${locationStr}`);
  if (severity) bodyParts.push(`(severity: ${severity})`);
  if (reporter) bodyParts.push(`reported by ${reporter}`);
  const body = `${bodyParts.join(' ')}${shortDesc ? ` — ${shortDesc}` : ''}`;

  return {
    notification: { title, body },
    data: {
      incidentId: incidentId || '',
      type: 'poaching',
      species,
      location: typeof incidentData.location === 'string' ? incidentData.location : JSON.stringify(incidentData.location || {}),
      severity,
      reportedBy: reporter,
      reportedAt: reportedAt,
      description: shortDesc
    }
  };
}

// Feature flag: allow non-poaching push sends (dev/test). Default: false -> only /api/poaching sends pushes
const ALLOW_EXTRA_PUSH = process.env.ENABLE_EXTRA_PUSH === 'true';

/**
 * Send poaching notification to officers.
 * This centralizes the logic so notifications are only triggered from the real poaching endpoint by default.
 * The function attempts sendMulticast, and falls back to per-token sends if needed.
 */
async function sendPoachingNotifications(incidentId, incidentData) {
  try {
    const officersSnapshot = await db.collection('users').where('role', '==', 'officer').get();
    const tokens = [];
    officersSnapshot.forEach(doc => {
      const u = doc.data();
      const t = u.pushToken || u.fcmToken || u.notificationToken;
      if (t) tokens.push(t);
    });

    const notificationPayload = buildPoachingNotification(incidentId, incidentData);

    if (tokens.length === 0) {
      // fallback to topic publish (clients must subscribe)
      try {
        await admin.messaging().send({
          topic: 'officers',
          notification: notificationPayload.notification,
          data: notificationPayload.data,
          android: { priority: 'high', notification: { sound: 'default' } },
          apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } }
        });
        console.log('Poaching notification published to topic: officers (no tokens)');
      } catch (topicErr) {
        console.debug('Failed to publish poaching notification to topic (no tokens):', topicErr.message || topicErr);
      }
      return;
    }

    // Try multicast first, fall back to single sends if multicast fails
    const batchSize = 400;
    const invalidTokensToRemove = new Set();
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      try {
        // try multicast
        const resp = await admin.messaging().sendMulticast({
          tokens: batch,
          notification: notificationPayload.notification,
          data: notificationPayload.data,
          android: { priority: 'high', notification: { sound: 'default' } },
          apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } }
        });

        totalSuccess += resp.successCount || 0;
        totalFailure += resp.failureCount || 0;

        if (resp.responses && resp.responses.length === batch.length) {
          resp.responses.forEach((r, idx) => {
            if (!r.success) {
              const err = r.error;
              const code = err && err.errorInfo && err.errorInfo.code ? err.errorInfo.code : (err && err.code) || '';
              const token = batch[idx];
              if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') {
                invalidTokensToRemove.add(token);
              }
            }
          });
        }
      } catch (multicastErr) {
        console.warn('sendMulticast failed; falling back to per-token send for this batch:', multicastErr && multicastErr.message ? multicastErr.message : multicastErr);
        // Fallback: send one-by-one
        for (const token of batch) {
          try {
            const resp = await admin.messaging().send({
              token,
              notification: notificationPayload.notification,
              data: notificationPayload.data,
              android: { priority: 'high', notification: { sound: 'default' } },
              apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } }
            });
            if (resp) totalSuccess++;
          } catch (singleErr) {
            totalFailure++;
            const code = singleErr && singleErr.errorInfo && singleErr.errorInfo.code ? singleErr.errorInfo.code : (singleErr && singleErr.code) || '';
            if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') {
              invalidTokensToRemove.add(token);
            }
          }
        }
      }
    }

    console.log('Poaching notifications result:', totalSuccess, 'successes,', totalFailure, 'failures');

    // Cleanup invalid tokens
    if (invalidTokensToRemove.size > 0) {
      try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();
        const updates = [];
        snapshot.forEach(doc => {
          const u = doc.data();
          const userTokens = new Set([u.fcmToken, u.pushToken, u.notificationToken].filter(Boolean));
          const intersect = [...invalidTokensToRemove].filter(t => userTokens.has(t));
          if (intersect.length > 0) {
            const docRef = usersRef.doc(doc.id);
            const updatePayload = {};
            if (intersect.includes(u.fcmToken)) updatePayload.fcmToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
            if (intersect.includes(u.pushToken)) updatePayload.pushToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
            if (intersect.includes(u.notificationToken)) updatePayload.notificationToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
            updates.push(docRef.update(updatePayload).catch(e => console.debug('Failed to update user token cleanup', doc.id, e.message || e)));
          }
        });
        await Promise.all(updates);
        console.log('Removed', invalidTokensToRemove.size, 'invalid tokens from user records');
      } catch (cleanupErr) {
        console.error('Failed to cleanup invalid tokens:', cleanupErr);
      }
    }
  } catch (err) {
    console.error('Error in sendPoachingNotifications:', err);
    throw err;
  }
}

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
    if (!userRole || (userRole !== 'driver' && userRole !== 'researcher' && userRole !== 'visitor' && userRole !== 'officer')) {
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
      const data = doc.data();
      // Ensure status field exists for older documents
      incidents.push({ id: doc.id, status: data.status || 'pending', ...data });
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
      reportedBy, reportedByUserId, reportedByRole, reportedAt,
      evidence
    } = req.body;
    if (!species || !location || !date || !severity) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if user has permission to report poaching incidents
    const userRole = req.user.role;
    if (!userRole || (userRole !== 'driver' && userRole !== 'researcher' && userRole !== 'visitor' && userRole !== 'officer')) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to report poaching incidents'
      });
    }

    const data = {
      species,
      location,
      status: 'pending',
      date,
      severity,
      description: description || '',
      // Evidence: array of uploaded image URLs
      evidence: Array.isArray(evidence) ? evidence : [],
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

    // Trigger notifications for real poaching submissions only
    (async () => {
      try {
        await sendPoachingNotifications(docRef.id, data);
      } catch (err) {
        console.error('Poaching notification error (non-fatal):', err && err.message ? err.message : err);
      }
    })();

    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error) {
    console.error('Error adding poaching incident:', error);
    res.status(500).json({ success: false, error: 'Failed to add poaching incident' });
  }
});

      // Register or update a device push token for the authenticated user
      app.post('/api/device-token', authenticateUser, async (req, res) => {
        try {
          const { token } = req.body;
          if (!token) {
            return res.status(400).json({ success: false, error: 'Token is required' });
          }

          const userRef = db.collection('users').doc(req.user.uid);
          await userRef.set({
            fcmToken: token,
            pushToken: token,
            notificationToken: token,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          res.json({ success: true });
        } catch (error) {
          console.error('Error registering device token:', error);
          res.status(500).json({ success: false, error: 'Failed to register device token' });
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

// Debug: list users and their registered device tokens (restricted to researchers and officers)
app.get('/api/device-tokens', authenticateUser, async (req, res) => {
  try {
    const allowed = ['researcher', 'officer'];
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const snapshot = await db.collection('users').get();
    const users = [];
    snapshot.forEach(doc => {
      const d = doc.data();
      users.push({ id: doc.id, email: d.email, role: d.role, fcmToken: d.fcmToken || null, pushToken: d.pushToken || null, notificationToken: d.notificationToken || null });
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error listing device tokens:', error);
    res.status(500).json({ success: false, error: 'Failed to list device tokens' });
  }
});

// Send a test notification. Body: { token?, topic?, title?, body? }
app.post('/api/device-token/test', authenticateUser, async (req, res) => {
  try {
    const { token, topic, title, body } = req.body || {};
    const notification = {
      notification: {
        title: title || 'Test Notification',
        body: body || 'This is a test notification from Forest API'
      },
      data: { test: '1' }
    };

    if (!ALLOW_EXTRA_PUSH && (token || topic)) {
      return res.status(403).json({ success: false, error: 'Test push sending is disabled in this environment' });
    }

    if (token) {
      // send to single token
      const resp = await admin.messaging().send({ token, notification: notification.notification, data: notification.data });
      return res.json({ success: true, providerResponse: resp });
    }

    if (topic) {
      const resp = await admin.messaging().send({ topic, notification: notification.notification, data: notification.data });
      return res.json({ success: true, providerResponse: resp });
    }

    // otherwise try to send to the caller's registered token
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: 'User not found' });
    const u = userDoc.data();
    const userToken = u.fcmToken || u.pushToken || u.notificationToken;
    if (!userToken) return res.status(400).json({ success: false, error: 'No token found for user' });
    const resp = await admin.messaging().send({ token: userToken, notification: notification.notification, data: notification.data });
    return res.json({ success: true, providerResponse: resp });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send test notification' });
  }
});

// Dev-only: unauthenticated endpoint to publish a test notification to 'officers' topic
// WARNING: Intended for local development only. It checks NODE_ENV to avoid accidental use in prod.
app.post('/api/debug/send-officers', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: 'Forbidden in production' });
    }

    const { title, body } = req.body || {};
    const notification = {
      notification: {
        title: title || 'Dev Test: Poaching Alert',
        body: body || 'This is a development test message to officers topic'
      },
      data: { dev: '1', type: 'poaching_test' }
    };

    if (!ALLOW_EXTRA_PUSH) {
      return res.status(403).json({ success: false, error: 'Dev topic sends disabled in this environment' });
    }

    await admin.messaging().send({ topic: 'officers', notification: notification.notification, data: notification.data });
    console.log('Dev: published test notification to topic officers');
    res.json({ success: true });
  } catch (error) {
    console.error('Dev: failed to publish to officers topic', error);
    res.status(500).json({ success: false, error: 'Failed to send dev notification' });
  }
});

// Dev-only: list officers and their registered tokens (unauthenticated)
// WARNING: development helper only. Disabled in production.
app.get('/api/debug/officer-tokens', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: 'Forbidden in production' });
    }

    if (!ALLOW_EXTRA_PUSH) {
      return res.status(403).json({ success: false, error: 'Dev create-poaching notifications are disabled in this environment' });
    }
    const snapshot = await db.collection('users').where('role', '==', 'officer').get();
    const users = [];
    snapshot.forEach(doc => {
      const d = doc.data();
      users.push({ id: doc.id, email: d.email || null, role: d.role || null, fcmToken: d.fcmToken || null, pushToken: d.pushToken || null, notificationToken: d.notificationToken || null, updatedAt: d.updatedAt || null });
    });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Error listing officer tokens:', error);
    res.status(500).json({ success: false, error: 'Failed to list officer tokens' });
  }
});

// Dev-only: list recent push receipts written by clients (help verify delivery)
app.get('/api/debug/push-receipts', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: 'Forbidden in production' });
    }
    const limit = parseInt(req.query.limit || '50', 10);
    const snapshot = await db.collection('push_receipts').orderBy('receivedAt', 'desc').limit(limit).get();
    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Error listing push receipts:', error);
    res.status(500).json({ success: false, error: 'Failed to list push receipts' });
  }
});

// Dev -> Production (guarded) : allow explicit dev-trigger to send to real officers
// This endpoint is intentionally gated by two safeguards:
// 1. process.env.ENABLE_DEV_TO_PROD must be set to 'true'
// 2. Caller must include header 'x-dev-secret' matching process.env.DEV_SEND_SECRET
// Use this only when you intentionally want to send a development-triggered notification
// to the real 'officers' topic/devices. Keep DEV_SEND_SECRET private.
app.post('/api/debug/send-officers-real', async (req, res) => {
  try {
    if (process.env.ENABLE_DEV_TO_PROD !== 'true') {
      return res.status(403).json({ success: false, error: 'Dev->Prod sends not enabled' });
    }

    const secret = req.headers['x-dev-secret'] || req.headers['X-Dev-Secret'];
    if (!secret || secret !== process.env.DEV_SEND_SECRET) {
      return res.status(401).json({ success: false, error: 'Invalid dev secret' });
    }

    const { title, body } = req.body || {};
    const notification = {
      notification: {
        title: title || 'Dev->Prod: Poaching Alert',
        body: body || 'This is a development-triggered alert to officers topic'
      },
      data: { dev: '1', type: 'poaching_test' }
    };

    await admin.messaging().send({
      topic: 'officers',
      notification: notification.notification,
      data: notification.data,
      android: { priority: 'high', notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } }
    });

    console.log('Dev->Prod: published test notification to topic officers');
    res.json({ success: true });
  } catch (error) {
    console.error('Dev->Prod: failed to publish to officers topic', error);
    res.status(500).json({ success: false, error: 'Failed to send dev->prod notification' });
  }
});

// Dev-only: create a poaching incident and run notification flow (guarded)
app.post('/api/debug/create-poaching', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: 'Forbidden in production' });
    }

    if (!ALLOW_EXTRA_PUSH) {
      return res.status(403).json({ success: false, error: 'Dev poaching endpoint push sending disabled in this environment' });
    }

    const secret = req.headers['x-dev-secret'] || req.headers['X-Dev-Secret'];
    if (!secret || secret !== process.env.DEV_SEND_SECRET) {
      return res.status(401).json({ success: false, error: 'Invalid dev secret' });
    }

    // Accept minimal payload; provide sensible defaults for dev
    const { species = 'Elephant', location = 'Sector A', date = new Date().toISOString(), severity = 'High', description = 'Automated dev report', reportedBy = 'Dev', reportedByUserId = 'dev' } = req.body || {};

    const data = {
      species,
      location,
      status: 'pending',
      date,
      severity,
      description,
      evidence: [],
      reportedBy,
      reportedByUserId,
      reportedByRole: 'developer',
      reportedAt: new Date().toISOString(),
      createdBy: { uid: reportedByUserId, displayName: reportedBy, email: '', role: 'developer' },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('poaching_incidents').add(data);

    // Reuse notification flow: collect officer tokens and send multicast, fallback to topic
    (async () => {
      try {
        const officersSnapshot = await db.collection('users').where('role', '==', 'officer').get();
        const tokens = [];
        officersSnapshot.forEach(doc => {
          const u = doc.data();
          const t = u.pushToken || u.fcmToken || u.notificationToken;
          if (t) tokens.push(t);
        });

        const notificationPayload = buildPoachingNotification(docRef.id, data, { dev: true });

        if (tokens.length > 0) {
          const batchSize = 400;
          let totalSuccess = 0;
          let totalFailure = 0;
          const invalidTokensToRemove = [];

          for (let i = 0; i < tokens.length; i += batchSize) {
            const batch = tokens.slice(i, i + batchSize);
            try {
              const resp = await admin.messaging().sendMulticast({
                tokens: batch,
                notification: notificationPayload.notification,
                data: notificationPayload.data,
                android: { priority: 'high', notification: { sound: 'default' } },
                apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } }
              });
              totalSuccess += resp.successCount || 0;
              totalFailure += resp.failureCount || 0;

              if (resp.responses && resp.responses.length === batch.length) {
                resp.responses.forEach((r, idx) => {
                  if (!r.success) {
                    const err = r.error;
                    const code = err && err.errorInfo && err.errorInfo.code ? err.errorInfo.code : (err && err.code) || '';
                    const token = batch[idx];
                    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') {
                      invalidTokensToRemove.push(token);
                    }
                  }
                });
              }
            } catch (batchErr) {
              console.error('FCM batch send failed for a batch:', batchErr);
            }
          }

          console.log('Dev poaching notifications sent:', totalSuccess, 'successes,', totalFailure, 'failures');

          if (invalidTokensToRemove.length > 0) {
            try {
              const usersRef = db.collection('users');
              const snapshot = await usersRef.get();
              const updates = [];
              snapshot.forEach(doc => {
                const u = doc.data();
                const userTokens = new Set([u.fcmToken, u.pushToken, u.notificationToken].filter(Boolean));
                const intersect = invalidTokensToRemove.filter(t => userTokens.has(t));
                if (intersect.length > 0) {
                  const docRef = usersRef.doc(doc.id);
                  const updatePayload = {};
                  if (intersect.includes(u.fcmToken)) updatePayload.fcmToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
                  if (intersect.includes(u.pushToken)) updatePayload.pushToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
                  if (intersect.includes(u.notificationToken)) updatePayload.notificationToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
                  updates.push(docRef.update(updatePayload).catch(e => console.debug('Failed to update user token cleanup', doc.id, e.message || e)));
                }
              });
              await Promise.all(updates);
              console.log('Removed', invalidTokensToRemove.length, 'invalid tokens from user records');
            } catch (cleanupErr) {
              console.error('Failed to cleanup invalid tokens:', cleanupErr);
            }
          }
        } else {
          try {
            await admin.messaging().send({
              topic: 'officers',
              notification: notificationPayload.notification,
              data: notificationPayload.data,
              android: { priority: 'high', notification: { sound: 'default' } },
              apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } }
            });
            console.log('Dev poaching notification published to topic: officers');
          } catch (topicErr) {
            console.debug('Dev: failed to publish to topic:', topicErr.message || topicErr);
          }
        }
      } catch (err) {
        console.error('Error sending dev poaching notifications:', err);
      }
    })();

    res.status(201).json({ success: true, data: { id: docRef.id, ...data } });
  } catch (error) {
    console.error('Error creating dev poaching incident:', error);
    res.status(500).json({ success: false, error: 'Failed to create dev poaching incident' });
  }
});

// Dev-only: create a poaching incident and trigger full notification flow (multicast + topic fallback)
// WARNING: local development only. Disabled in production.
app.post('/api/debug/poaching', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: 'Forbidden in production' });
    }

    const { species, location, date, severity, description, evidence } = req.body || {};
    if (!species || !location || !date || !severity) {
      return res.status(400).json({ success: false, error: 'Missing required fields (species, location, date, severity)' });
    }

    const data = {
      species,
      location,
      status: 'pending',
      date,
      severity,
      description: description || '',
      evidence: Array.isArray(evidence) ? evidence : [],
      reportedBy: 'dev-simulated',
      reportedByUserId: 'dev-simulated',
      reportedByRole: 'researcher',
      reportedAt: new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('poaching_incidents').add(data);

    // Reuse the server's notification logic: collect officer tokens and send multicast, else topic
    (async () => {
      try {
        const officersSnapshot = await db.collection('users').where('role', '==', 'officer').get();
        const tokens = [];
        officersSnapshot.forEach(doc => {
          const u = doc.data();
          const t = u.pushToken || u.fcmToken || u.notificationToken;
          if (t) tokens.push(t);
        });

        const notificationPayload = buildPoachingNotification(docRef.id, data, { dev: true });

        if (tokens.length > 0) {
          const batchSize = 400;
          let totalSuccess = 0;
          let totalFailure = 0;
          const invalidTokensToRemove = [];

          for (let i = 0; i < tokens.length; i += batchSize) {
            const batch = tokens.slice(i, i + batchSize);
            try {
              const resp = await admin.messaging().sendMulticast({
                tokens: batch,
                notification: notificationPayload.notification,
                data: notificationPayload.data,
                android: { priority: 'high', notification: { sound: 'default' } },
                apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } }
              });
              totalSuccess += resp.successCount || 0;
              totalFailure += resp.failureCount || 0;

              if (resp.responses && resp.responses.length === batch.length) {
                resp.responses.forEach((r, idx) => {
                  if (!r.success) {
                    const err = r.error;
                    const code = err && err.errorInfo && err.errorInfo.code ? err.errorInfo.code : (err && err.code) || '';
                    const token = batch[idx];
                    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') {
                      invalidTokensToRemove.push(token);
                    }
                  }
                });
              }
            } catch (batchErr) {
              console.error('FCM batch send failed for a batch (dev):', batchErr);
            }
          }

          console.log('Dev poaching notifications sent:', totalSuccess, 'successes,', totalFailure, 'failures');

          if (invalidTokensToRemove.length > 0) {
            try {
              const usersRef = db.collection('users');
              const snapshot = await usersRef.get();
              const updates = [];
              snapshot.forEach(doc => {
                const u = doc.data();
                const userTokens = new Set([u.fcmToken, u.pushToken, u.notificationToken].filter(Boolean));
                const intersect = invalidTokensToRemove.filter(t => userTokens.has(t));
                if (intersect.length > 0) {
                  const docRef = usersRef.doc(doc.id);
                  const updatePayload = {};
                  if (intersect.includes(u.fcmToken)) updatePayload.fcmToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
                  if (intersect.includes(u.pushToken)) updatePayload.pushToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
                  if (intersect.includes(u.notificationToken)) updatePayload.notificationToken = admin.firestore.FieldValue.delete ? admin.firestore.FieldValue.delete() : null;
                  updates.push(docRef.update(updatePayload).catch(e => console.debug('Failed to update user token cleanup', doc.id, e.message || e)));
                }
              });
              await Promise.all(updates);
              console.log('Dev: Removed', invalidTokensToRemove.length, 'invalid tokens from user records');
            } catch (cleanupErr) {
              console.error('Dev: Failed to cleanup invalid tokens:', cleanupErr);
            }
          }
        } else {
          try {
            await admin.messaging().send({
              topic: 'officers',
              notification: notificationPayload.notification,
              data: notificationPayload.data,
              android: { priority: 'high', notification: { sound: 'default' } },
              apns: { payload: { aps: { sound: 'default', 'content-available': 1 } } }
            });
            console.log('Dev poaching notification published to topic: officers');
          } catch (topicErr) {
            console.debug('Dev: failed to publish to topic:', topicErr.message || topicErr);
          }
        }
      } catch (err) {
        console.error('Dev: Error sending poaching notifications:', err);
      }
    })();

    return res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Dev: error creating poaching incident:', error);
    return res.status(500).json({ success: false, error: 'Failed to create dev poaching incident' });
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
      status,
      photoUrls,        // ✅ multiple image URLs (array)
      animalTypes,
      activities,
      environments,
      experienceLevels,
    } = req.body;

    // --- Validation ---
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        error: 'Name and location are required fields'
      });
    }

    // --- Park Object ---
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
      photoUrls: Array.isArray(photoUrls) ? photoUrls : [],   // ✅ store as array
      animalTypes: Array.isArray(animalTypes) ? animalTypes : [],
      activities: Array.isArray(activities) ? activities : [],
      environments: Array.isArray(environments) ? environments : [],
      experienceLevels: Array.isArray(experienceLevels) ? experienceLevels : [],
      createdBy: {
        uid: req.user.uid,
        displayName: req.user.displayName,
        email: req.user.email,
        role: req.user.role,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // --- Save to Firestore ---
    const docRef = await db.collection('parks').add(parkData);

    // --- CSV Formatting and Append ---
    const csvPath = path.join(__dirname, 'python', 'parks.csv');
    const columns = [
      "mammals", "birds", "reptiles", "amphibians", "insects" ,
      'safari', 'camping', 'birdwatching', 'hiking',
      'forest', 'wetland', 'mountain', 'coastal',
      'family', 'adventure', 'relaxation'
    ];
    const animalMap = {
      mammals: 'mammals',
      birds: 'birds',
      reptiles: 'reptiles',
      amphibians: 'amphibians',
      insects: 'insects Bear'
    };
    const activityMap = {
      safari: 'Safari Rides',
      camping: 'Camping',
      birdwatching: 'Bird Watching',
      hiking: 'Hiking'
    };
    const envMap = {
      forest: 'Forest',
      wetland: 'Wetland',
      mountain: 'Mountain',
      coastal: 'Coastal'
    };
    const expMap = {
      family: 'Family Friendly',
      adventure: 'Adventure Seekers',
      relaxation: 'Relaxation and Nature'
    };

    function arrToCsv(arr, map) {
      return Object.keys(map).map(key => arr.includes(map[key]) ? 1 : 0);
    }

    const csvRow = [
      parkData.name, // <-- Remove quotes, keep spaces
      ...arrToCsv(parkData.animalTypes || [], animalMap),
      ...arrToCsv(parkData.activities || [], activityMap),
      ...arrToCsv(parkData.environments || [], envMap),
      ...arrToCsv(parkData.experienceLevels || [], expMap)
    ].join(',');

    fs.appendFile(csvPath, `\n${csvRow}`, err => {
      if (err) {
        console.error('Error writing to CSV:', err);
      } else {
        // Retrain model after CSV update
        const py = spawn('python', [path.join(__dirname, 'python', 'train_model.py')]);
        py.stdout.on('data', (data) => {
          console.log('[train_model.py]', data.toString());
        });
        py.stderr.on('data', (data) => {
          console.error('[train_model.py ERROR]', data.toString());
        });
        py.on('close', (code) => {
          console.log(`train_model.py exited with code ${code}`);
        });
      }
    });
    // --- End CSV logic ---

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
      status,
      photoUrl,
      animalTypes,      // <-- Add this
      activities,       // <-- Add this
      environments,     // <-- Add this
      experienceLevels  // <-- Add this
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
      photoUrl: photoUrl || '',
      animalTypes: Array.isArray(animalTypes) ? animalTypes : [],         // <-- Add this
      activities: Array.isArray(activities) ? activities : [],            // <-- Add this
      environments: Array.isArray(environments) ? environments : [],      // <-- Add this
      experienceLevels: Array.isArray(experienceLevels) ? experienceLevels : [], // <-- Add this
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

// Get a single poaching incident by ID
app.get('/api/poaching/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('poaching_incidents').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    const data = doc.data();
    // Ensure backwards compat fields
    const incident = { id: doc.id, status: data.status || 'pending', severity: data.severity || 'Medium', ...data };
    res.json({ success: true, data: incident });
  } catch (error) {
    console.error('Error fetching incident by id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incident' });
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

// Update a poaching incident (status or other small updates) - requires authentication
app.put('/api/poaching/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    if (!status && !assignedTo) {
      return res.status(400).json({ success: false, error: 'No update fields provided' });
    }

    // Only allow officers to change status/assignment
    const role = req.user?.role;
    if (!role || role !== 'officer') {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to update incident' });
    }

    const docRef = db.collection('poaching_incidents').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: {
        uid: req.user.uid,
        displayName: req.user.displayName || req.user.email,
        role: req.user.role,
      }
    };

    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    res.json({ success: true, data: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (error) {
    console.error('Error updating poaching incident:', error);
    res.status(500).json({ success: false, error: 'Failed to update poaching incident' });
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
