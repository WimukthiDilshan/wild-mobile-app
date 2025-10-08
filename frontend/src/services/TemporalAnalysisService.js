/**
 * Temporal Analysis Service
 * Provides seasonal and temporal analysis without requiring database changes
 * Works with existing animal data timestamps and locations
 */

// AI-powered seasonal behavior prediction service
class SeasonalBehaviorAPI {
  // React Native Android emulator uses 10.0.2.2 to access host machine localhost
  // For iOS simulator, localhost works fine
  // For real devices, you'll need the actual IP address of your development machine
  static getBaseURL() {
    try {
      const { Platform } = require('react-native');
      if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000/api/ai'; // Android emulator
      }
      return 'http://localhost:3000/api/ai'; // iOS/other platforms
    } catch (error) {
      // Fallback if Platform not available
      return 'http://localhost:3000/api/ai';
    }
  }
  
  /**
   * Predict seasonal behavior using AI model
   * @param {string} species - Species name
   * @param {number} month - Month number (1-12)
   * @returns {Promise<Object>} Prediction data
   */
  static async predictSeasonalBehavior(species, month) {
    try {
      console.log(`Making AI prediction request for ${species} month ${month}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.getBaseURL()}/predict-seasonal-behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          species,
          month,
          migration_tendency: 'territorial', // default
          weather_preference: 'cool_dry' // default - matches training data
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`AI prediction response for ${species}:`, data);
      return data.success ? data.prediction : this.getFallbackPrediction();
    } catch (error) {
      console.warn(`AI prediction failed for ${species} month ${month}:`, error);
      if (error.name === 'AbortError') {
        console.warn('Request timed out after 10 seconds');
      }
      return this.getFallbackPrediction();
    }
  }

  /**
   * Get supported species from AI model
   * @returns {Promise<Array>} Array of supported species
   */
  static async getSupportedSpecies() {
    try {
      const response = await fetch(`${this.getBaseURL()}/supported-species`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return data.success ? data.species : [];
    } catch (error) {
      console.warn('Failed to get supported species:', error);
      return ['Tiger', 'Elephant', 'Leopard', 'Rhinoceros']; // fallback
    }
  }

  /**
   * Batch prediction for multiple species/month combinations
   * @param {Array} predictions - Array of {species, month} objects
   * @returns {Promise<Array>} Array of prediction results
   */
  static async batchPredict(predictions) {
    try {
      console.log('Making batch prediction request:', predictions);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for batch
      
      const response = await fetch(`${this.getBaseURL()}/batch-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ predictions }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('Batch prediction response:', data);
      return data.success ? data.results : [];
    } catch (error) {
      console.warn('Batch prediction failed:', error);
      if (error.name === 'AbortError') {
        console.warn('Batch request timed out after 15 seconds');
      }
      return predictions.map(p => ({
        species: p.species,
        month: p.month,
        prediction: this.getFallbackPrediction(),
        success: false
      }));
    }
  }

  /**
   * Check AI service health
   * @returns {Promise<Object>} Health status
   */
  static async checkHealth() {
    try {
      console.log('Checking AI service health...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.getBaseURL()}/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const healthData = await response.json();
      console.log('AI service health:', healthData);
      return healthData;
    } catch (error) {
      console.warn('AI service health check failed:', error);
      if (error.name === 'AbortError') {
        console.warn('Health check timed out after 5 seconds');
      }
      return { status: 'error', modelsLoaded: false, error: error.message };
    }
  }

  /**
   * Test basic connectivity to backend
   * @returns {Promise<boolean>} True if backend is reachable
   */
  static async testConnectivity() {
    try {
      console.log('Testing backend connectivity...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${this.getBaseURL()}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Backend connectivity test: ${response.status} ${response.statusText}`);
      return response.ok;
    } catch (error) {
      console.warn('Backend connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Fallback prediction when AI service is unavailable
   * @returns {Object} Default prediction
   */
  static getFallbackPrediction() {
    return {
      primaryBehavior: 'normal_activity',
      breedingSeason: false,
      breedingPeak: false,
      activityLevel: 'Normal',
      threatLevel: 'Low',
      migrationTendency: 'territorial',
      populationPeak: false,
      recommendation: 'Continue regular monitoring',
      confidence: 'Low - AI service unavailable, using fallback'
    };
  }

  /**
   * Debug method to test AI service connection
   * Call this method to troubleshoot connection issues
   */
  static async debugConnection() {
    const baseURL = this.getBaseURL();
    console.log('=== AI Service Connection Debug ===');
    console.log(`Base URL: ${baseURL}`);
    
    try {
      console.log('Testing connectivity...');
      const isConnected = await this.testConnectivity();
      console.log(`Connectivity test: ${isConnected ? 'PASS' : 'FAIL'}`);
      
      if (isConnected) {
        console.log('Testing health endpoint...');
        const health = await this.checkHealth();
        console.log('Health check result:', health);
        
        console.log('Testing sample prediction...');
        const prediction = await this.predictSeasonalBehavior('Tiger', 3);
        console.log('Sample prediction result:', prediction);
      }
    } catch (error) {
      console.error('Debug connection failed:', error);
    }
    
    console.log('=== End Debug ===');
  }
}

class TemporalAnalysisService {
  
  /**
   * Extract temporal data from existing animal records
   * @param {Array} animals - Array of animal records with addedAt timestamps
   * @returns {Array} Enhanced records with temporal information
   */
  static extractTemporalData(animals) {
    return animals.map(animal => {
      const date = new Date(animal.addedAt || new Date());
      return {
        ...animal,
        month: date.getMonth() + 1,
        season: this.getSeason(date),
        year: date.getFullYear(),
        dayOfYear: this.getDayOfYear(date),
        timeOfDay: this.getTimeOfDay(date),
        weekday: date.getDay(),
        timestamp: date.getTime()
      };
    });
  }

  /**
   * Determine season from date
   * @param {Date} date - Date object
   * @returns {string} Season name
   */
  static getSeason(date) {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  /**
   * Get day of year (1-365/366)
   * @param {Date} date - Date object
   * @returns {number} Day of year
   */
  static getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * Determine time of day category
   * @param {Date} date - Date object
   * @returns {string} Time category
   */
  static getTimeOfDay(date) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Generate comprehensive seasonal analysis
   * @param {Array} animals - Array of animal records
   * @returns {Object} Seasonal statistics and insights
   */
  static generateSeasonalAnalysis(animals) {
    const temporalData = this.extractTemporalData(animals);
    
    const seasonalStats = {
      spring: { total: 0, species: {}, locations: {}, months: {} },
      summer: { total: 0, species: {}, locations: {}, months: {} },
      autumn: { total: 0, species: {}, locations: {}, months: {} },
      winter: { total: 0, species: {}, locations: {}, months: {} }
    };

    const monthlyStats = {};
    for (let i = 1; i <= 12; i++) {
      monthlyStats[i] = { total: 0, species: {}, locations: {} };
    }

    temporalData.forEach(animal => {
      const season = animal.season;
      const month = animal.month;
      const count = animal.count || 1;

      // Seasonal aggregation
      seasonalStats[season].total += count;
      
      if (!seasonalStats[season].species[animal.name]) {
        seasonalStats[season].species[animal.name] = 0;
      }
      seasonalStats[season].species[animal.name] += count;
      
      if (!seasonalStats[season].locations[animal.location]) {
        seasonalStats[season].locations[animal.location] = 0;
      }
      seasonalStats[season].locations[animal.location] += count;

      // Monthly aggregation
      monthlyStats[month].total += count;
      
      if (!monthlyStats[month].species[animal.name]) {
        monthlyStats[month].species[animal.name] = 0;
      }
      monthlyStats[month].species[animal.name] += count;
    });

    return { seasonalStats, monthlyStats };
  }

  /**
   * Predict seasonal behavior for a species
   * @param {string} species - Species name
   * @param {number} month - Month number (1-12)
   * @returns {Object} Prediction data
   */
  /**
   * Predict seasonal behavior for a species using AI
   * @param {string} species - Species name
   * @param {number} month - Month number (1-12)
   * @returns {Promise<Object>} Prediction data
   */
  static async predictSeasonalBehavior(species, month) {
    try {
      return await SeasonalBehaviorAPI.predictSeasonalBehavior(species, month);
    } catch (error) {
      console.warn(`AI prediction failed for ${species} month ${month}:`, error);
      return SeasonalBehaviorAPI.getFallbackPrediction();
    }
  }

  /**
   * Generate monitoring recommendations
   * @param {string} behavior - Primary behavior
   * @param {string} activity - Activity level
   * @param {boolean} breeding - Is breeding season
   * @param {string} threat - Threat level
   * @returns {string} Recommendation
   */
  /* TEMPORARILY HIDDEN - Recommendation Generation
  static generateRecommendation(behavior, activity, breeding, threat) {
    if (breeding && threat === 'High') {
      return 'CRITICAL: Increase monitoring - breeding season with high threat level';
    }
    if (breeding) {
      return 'Increase monitoring frequency - active breeding season';
    }
    if (threat === 'High') {
      return 'Enhanced surveillance recommended - high threat period';
    }
    if (activity === 'High') {
      return 'Optimal time for population surveys and data collection';
    }
    if (activity === 'Low') {
      return 'Reduced monitoring acceptable - natural low activity period';
    }
    return 'Continue standard monitoring protocols';
  }
  */

  /**
   * Generate temporal insights for current period using AI predictions
   * @param {Array} animals - Array of animal records
   * @returns {Promise<Array>} Array of insights
   */
  static async generateTemporalInsights(animals) {
    const insights = [];
    const currentMonth = new Date().getMonth() + 1;
    const currentSeason = this.getSeason(new Date());
    
    // Get recent data (last 90 days)
    const recentAnimals = animals.filter(animal => {
      const daysDiff = (new Date() - new Date(animal.addedAt)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 90;
    });

    // Count species in recent data
    const speciesCounts = {};
    recentAnimals.forEach(animal => {
      speciesCounts[animal.name] = (speciesCounts[animal.name] || 0) + (animal.count || 1);
    });

    // Prepare batch predictions
    const predictionRequests = Object.keys(speciesCounts).map(species => ({
      species,
      month: currentMonth
    }));

    try {
      // Test connectivity first
      const isConnected = await SeasonalBehaviorAPI.testConnectivity();
      if (!isConnected) {
        throw new Error('Backend service is not reachable');
      }

      // Get AI predictions for all species
      const predictionResults = await SeasonalBehaviorAPI.batchPredict(predictionRequests);
      
      if (!predictionResults || predictionResults.length === 0) {
        throw new Error('No prediction results returned from AI service');
      }
      
      // Generate insights for each species
      predictionResults.forEach(result => {
        if (!result || !result.species) {
          console.warn('Invalid prediction result:', result);
          return;
        }
        
        const species = result.species;
        const prediction = result.prediction || SeasonalBehaviorAPI.getFallbackPrediction();
        
        // Calculate alert level using AI prediction
        const alertLevel = this.calculateAlertLevelWithAI(
          species, 
          speciesCounts[species], 
          currentMonth, 
          prediction
        );
        
        insights.push({
          species,
          currentCount: speciesCounts[species],
          season: currentSeason,
          month: currentMonth,
          prediction,
          alertLevel,
          trend: this.calculateTrend(animals, species),
          lastSeen: this.getLastSeenDate(animals, species)
        });
      });
    } catch (error) {
      console.warn('AI predictions failed, using fallback:', error);
      
      // Fallback to basic insights without AI predictions
      Object.keys(speciesCounts).forEach(species => {
        const prediction = SeasonalBehaviorAPI.getFallbackPrediction();
        const alertLevel = this.calculateBasicAlertLevel(species, speciesCounts[species]);
        
        insights.push({
          species,
          currentCount: speciesCounts[species],
          season: currentSeason,
          month: currentMonth,
          prediction,
          alertLevel,
          trend: this.calculateTrend(animals, species),
          lastSeen: this.getLastSeenDate(animals, species)
        });
      });
    }

    // Sort by alert level and count
    return insights.sort((a, b) => {
      const alertOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
      return (alertOrder[b.alertLevel] - alertOrder[a.alertLevel]) || (b.currentCount - a.currentCount);
    });
  }

  /**
   * Calculate alert level using AI prediction data
   * @param {string} species - Species name
   * @param {number} count - Current count
   * @param {number} month - Current month
   * @param {Object} prediction - AI prediction result
   * @returns {string} Alert level
   */
  static calculateAlertLevelWithAI(species, count, month, prediction) {
    let alertLevel = 'Low';
    
    // Ensure prediction exists and has the required properties
    if (!prediction) {
      return this.calculateBasicAlertLevel(species, count);
    }

    // Base alert level on AI threat prediction
    const threatLevel = (prediction.threatLevel || 'Low').toLowerCase();
    if (threatLevel === 'high') {
      alertLevel = 'High';
    } else if (threatLevel === 'moderate' || threatLevel === 'medium') {
      alertLevel = 'Medium';
    }

    // Adjust based on population count (assuming average of 10-20 per species)
    if (count < 5) {
      alertLevel = alertLevel === 'Low' ? 'Medium' : 'Critical';
    } else if (count > 50) {
      alertLevel = 'Low'; // High population, less concern
    }

    // Breeding season increases alert level
    if (prediction.breedingSeason === true) {
      const levels = ['Low', 'Medium', 'High', 'Critical'];
      const currentIndex = levels.indexOf(alertLevel);
      alertLevel = levels[Math.min(currentIndex + 1, 3)];
    }

    // Population peak periods need more attention
    if (prediction.populationPeak) {
      const levels = ['Low', 'Medium', 'High', 'Critical'];
      const currentIndex = levels.indexOf(alertLevel);
      alertLevel = levels[Math.min(currentIndex + 1, 3)];
    }

    return alertLevel;
  }

  /**
   * Calculate basic alert level without AI (fallback)
   * @param {string} species - Species name
   * @param {number} count - Current count
   * @returns {string} Alert level
   */
  static calculateBasicAlertLevel(species, count) {
    let alertLevel = 'Low';
    
    // Simple population-based alert level
    if (count < 5) {
      alertLevel = 'Medium';
    } else if (count < 2) {
      alertLevel = 'High';
    } else if (count > 50) {
      alertLevel = 'Low'; // High population, less concern
    }

    return alertLevel;
  }

  /**
   * Calculate population trend for a species
   * @param {Array} animals - All animal records
   * @param {string} species - Species name
   * @returns {string} Trend indicator
   */
  static calculateTrend(animals, species) {
    const speciesRecords = animals
      .filter(animal => animal.name === species)
      .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));

    if (speciesRecords.length < 2) return 'Insufficient data';

    const recent = speciesRecords.slice(-5); // Last 5 records
    const older = speciesRecords.slice(-10, -5); // Previous 5 records

    const recentAvg = recent.reduce((sum, animal) => sum + (animal.count || 1), 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, animal) => sum + (animal.count || 1), 0) / older.length 
      : recentAvg;

    const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (percentChange > 10) return 'Increasing';
    if (percentChange < -10) return 'Decreasing';
    return 'Stable';
  }

  /**
   * Get last seen date for a species
   * @param {Array} animals - All animal records
   * @param {string} species - Species name
   * @returns {string} Last seen date
   */
  static getLastSeenDate(animals, species) {
    const speciesRecords = animals
      .filter(animal => animal.name === species)
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    if (speciesRecords.length === 0) return 'Never';
    
    const lastSeen = new Date(speciesRecords[0].addedAt);
    const daysAgo = Math.floor((new Date() - lastSeen) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return `${Math.floor(daysAgo / 30)} months ago`;
  }

  /**
   * Check if AI service is available
   * @returns {Promise<Object>} AI service status
   */
  static async getAIServiceStatus() {
    try {
      return await SeasonalBehaviorAPI.checkHealth();
    } catch (error) {
      return { status: 'error', modelsLoaded: false, error: error.message };
    }
  }

  /**
   * Get list of species supported by the AI model
   * @returns {Promise<Array>} Array of supported species
   */
  static async getSupportedSpecies() {
    try {
      return await SeasonalBehaviorAPI.getSupportedSpecies();
    } catch (error) {
      console.warn('Failed to get supported species:', error);
      return ['Tiger', 'Elephant', 'Leopard', 'Rhinoceros']; // fallback
    }
  }

  /**
   * Generate migration pattern analysis
   * @param {Array} animals - Array of animal records
   * @returns {Object} Migration patterns by species
   */
  static analyzeMigrationPatterns(animals) {
    const patterns = {};
    
    animals.forEach(animal => {
      if (!patterns[animal.name]) {
        patterns[animal.name] = {
          locations: {},
          movementHistory: [],
          migrationTendency: 'unknown' // Will be determined by AI if available
        };
      }
      
      const date = new Date(animal.addedAt);
      patterns[animal.name].locations[animal.location] = 
        (patterns[animal.name].locations[animal.location] || 0) + (animal.count || 1);
      
      patterns[animal.name].movementHistory.push({
        location: animal.location,
        date: date,
        month: date.getMonth() + 1,
        season: this.getSeason(date),
        count: animal.count || 1
      });
    });

    // Sort movement history by date for each species
    Object.keys(patterns).forEach(species => {
      patterns[species].movementHistory.sort((a, b) => a.date - b.date);
    });

    return patterns;
  }

  /**
   * Get monthly distribution data for charts
   * @param {Array} animals - Array of animal records
   * @returns {Array} Monthly data for visualization
   */
  static getMonthlyDistribution(animals) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyData = months.map((month, index) => {
      const monthAnimals = animals.filter(animal => {
        const animalMonth = new Date(animal.addedAt).getMonth();
        return animalMonth === index;
      });
      
      const totalCount = monthlyData.reduce((sum, animal) => sum + (animal.count || 1), 0);
      const speciesCount = new Set(monthAnimals.map(animal => animal.name)).size;
      
      return {
        month,
        monthNumber: index + 1,
        totalAnimals: totalCount,
        speciesCount,
        records: monthAnimals.length
      };
    });

    return monthlyData;
  }
}

// Export both classes for external access
export { SeasonalBehaviorAPI };
export default TemporalAnalysisService;