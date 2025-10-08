const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Path to the Python prediction service
const PYTHON_SERVICE_PATH = path.join(__dirname, '..', 'services', 'seasonal_prediction_service.py');
const AI_MODELS_DIR = path.join(__dirname, '..');

/**
 * Health check endpoint for the AI service
 */
router.get('/health', (req, res) => {
  // Check if trained models exist
  const trainedModelsDir = path.join(AI_MODELS_DIR, 'trained_models');
  const requiredModels = [
    'breeding_model.pkl',
    'activity_model.pkl',
    'threat_model.pkl',
    'behavior_model.pkl',
    'population_model.pkl'
  ];

  console.log('Health check - AI_MODELS_DIR:', AI_MODELS_DIR);
  console.log('Health check - trainedModelsDir:', trainedModelsDir);
  
  const modelStatus = {};
  const modelsExist = requiredModels.every(model => {
    const modelPath = path.join(trainedModelsDir, model);
    const exists = fs.existsSync(modelPath);
    modelStatus[model] = { exists, path: modelPath };
    console.log(`Model ${model}: ${exists ? 'EXISTS' : 'MISSING'} at ${modelPath}`);
    return exists;
  });

  res.json({
    status: 'ok',
    modelsLoaded: modelsExist,
    timestamp: new Date().toISOString(),
    service: 'Species Seasonal Behavior AI',
    debug: {
      aiModelsDir: AI_MODELS_DIR,
      trainedModelsDir: trainedModelsDir,
      modelStatus
    }
  });
});

/**
 * Predict seasonal behavior for a species
 * POST /api/ai/predict-seasonal-behavior
 * Body: { species: string, month: number, migration_tendency?: string, weather_preference?: string }
 */
router.post('/predict-seasonal-behavior', async (req, res) => {
  try {
    const { species, month, migration_tendency, weather_preference } = req.body;

    // Input validation
    if (!species || !month) {
      return res.status(400).json({
        error: 'Missing required parameters: species and month are required',
        success: false
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        error: 'Invalid month: must be between 1 and 12',
        success: false
      });
    }

    // Call Python prediction service
    const prediction = await callPythonPredictionService({
      species,
      month,
      migration_tendency,
      weather_preference
    });

    res.json({
      success: true,
      species,
      month,
      prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in seasonal behavior prediction:', error);
    res.status(500).json({
      error: 'Internal server error during prediction',
      success: false,
      fallback: {
        primaryBehavior: 'normal_activity',
        breedingSeason: false,
        breedingPeak: false,
        activityLevel: 'Normal',
        threatLevel: 'Low',
        migrationTendency: 'territorial',
        populationPeak: false,
        recommendation: 'Continue regular monitoring',
        confidence: 'Low - Server error, using fallback'
      }
    });
  }
});

/**
 * Batch prediction endpoint
 * POST /api/ai/batch-predict
 * Body: { predictions: Array<{species: string, month: number, migration_tendency?: string, weather_preference?: string}> }
 */
router.post('/batch-predict', async (req, res) => {
  try {
    const { predictions } = req.body;

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        error: 'predictions must be a non-empty array',
        success: false
      });
    }

    // Validate each prediction request
    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      if (!pred.species || !pred.month) {
        return res.status(400).json({
          error: `Missing required parameters at index ${i}: species and month are required`,
          success: false
        });
      }
      if (pred.month < 1 || pred.month > 12) {
        return res.status(400).json({
          error: `Invalid month at index ${i}: must be between 1 and 12`,
          success: false
        });
      }
    }

    // Process batch predictions
    const results = await Promise.all(
      predictions.map(async (pred) => {
        try {
          const prediction = await callPythonPredictionService(pred);
          return {
            species: pred.species,
            month: pred.month,
            prediction,
            success: true
          };
        } catch (error) {
          return {
            species: pred.species,
            month: pred.month,
            error: error.message,
            success: false,
            fallback: {
              primaryBehavior: 'normal_activity',
              breedingSeason: false,
              breedingPeak: false,
              activityLevel: 'Normal',
              threatLevel: 'Low',
              migrationTendency: 'territorial',
              populationPeak: false,
              recommendation: 'Continue regular monitoring',
              confidence: 'Low - Error occurred, using fallback'
            }
          };
        }
      })
    );

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Error in batch prediction:', error);
    res.status(500).json({
      error: 'Internal server error during batch prediction',
      success: false
    });
  }
});

/**
 * Get supported species list
 */
router.get('/supported-species', async (req, res) => {
  try {
    const species = await callPythonService('get_supported_species');
    res.json({
      success: true,
      species: species || [],
      count: species ? species.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting supported species:', error);
    res.status(500).json({
      error: 'Error retrieving supported species',
      success: false,
      species: []
    });
  }
});

/**
 * Retrain models endpoint (for future use)
 */
router.post('/retrain-models', async (req, res) => {
  try {
    // This would trigger model retraining
    const trainScript = path.join(AI_MODELS_DIR, 'models', 'train_seasonal_model.py');
    
    const result = await new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [trainScript], {
        cwd: path.dirname(trainScript),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ output, success: true });
        } else {
          reject(new Error(`Training failed with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(error);
      });
    });

    res.json({
      success: true,
      message: 'Models retrained successfully',
      output: result.output,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error retraining models:', error);
    res.status(500).json({
      error: 'Failed to retrain models',
      message: error.message,
      success: false
    });
  }
});

/**
 * Helper function to call Python prediction service
 */
async function callPythonPredictionService(params) {
  return new Promise((resolve, reject) => {
    const pythonArgs = [
      PYTHON_SERVICE_PATH,
      'predict',
      params.species,
      params.month.toString(),
      params.migration_tendency || 'territorial',
      params.weather_preference || 'cool_dry'  // Default matches training data
    ];

    console.log('🐍 Calling Python service with args:', pythonArgs);

    const pythonProcess = spawn('python', pythonArgs, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log(`🐍 Python process closed with code: ${code}`);
      console.log(`🐍 Python stdout: ${output}`);
      console.log(`🐍 Python stderr: ${errorOutput}`);
      
      if (code === 0) {
        try {
          // Parse JSON output from Python service
          const result = JSON.parse(output.trim());
          console.log('🐍 Python result:', result);
          resolve(result);
        } catch (parseError) {
          console.error('🐍 Failed to parse Python output:', parseError);
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      } else {
        console.error('🐍 Python process failed:', errorOutput);
        reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('🐍 Failed to start Python process:', error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

/**
 * Helper function to call general Python service methods
 */
async function callPythonService(method, ...args) {
  return new Promise((resolve, reject) => {
    const pythonArgs = [PYTHON_SERVICE_PATH, method, ...args];

    const pythonProcess = spawn('python', pythonArgs, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (parseError) {
          resolve(output.trim()); // Return raw output if not JSON
        }
      } else {
        reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

module.exports = router;