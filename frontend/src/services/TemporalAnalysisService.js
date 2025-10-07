/**
 * Temporal Analysis Service
 * Provides seasonal and temporal analysis without requiring database changes
 * Works with existing animal data timestamps and locations
 */

// Predefined seasonal behavior patterns for wildlife species
const SPECIES_SEASONAL_PATTERNS = {
  'Tiger': {
    breedingSeason: { months: [11, 12, 1, 2], peak: 12 },
    activePeriods: { 
      high: [3, 4, 9, 10], // Spring & Autumn - optimal hunting weather
      low: [6, 7, 8] // Summer - heat avoidance
    },
    migrationTendency: 'territorial', // minimal migration, territorial behavior
    weatherPreference: 'cool_dry',
    behaviorByMonth: {
      1: 'breeding', 2: 'breeding', 3: 'territorial_marking',
      4: 'hunting_peak', 5: 'normal_activity', 6: 'heat_avoidance',
      7: 'heat_avoidance', 8: 'monsoon_adaptation', 9: 'increased_activity',
      10: 'territorial_expansion', 11: 'pre_breeding', 12: 'breeding_peak'
    },
    populationPeaks: [4, 10], // April and October
    threatLevels: { high: [6, 7, 8], moderate: [1, 2, 11, 12], low: [3, 4, 5, 9, 10] }
  },

  'Elephant': {
    breedingSeason: { months: [6, 7, 8, 9], peak: 7 },
    activePeriods: { 
      high: [4, 5, 6, 10, 11], 
      low: [12, 1, 2] 
    },
    migrationTendency: 'seasonal', // follows water sources and food
    weatherPreference: 'moderate_wet',
    behaviorByMonth: {
      1: 'dry_season_survival', 2: 'water_source_congregation',
      3: 'pre_monsoon_movement', 4: 'foraging_intensive', 5: 'social_gathering',
      6: 'breeding_preparation', 7: 'breeding_peak', 8: 'breeding_active',
      9: 'post_breeding_care', 10: 'feeding_intensive',
      11: 'social_bonding', 12: 'dry_season_preparation'
    },
    populationPeaks: [7, 10], // Breeding and post-monsoon feeding
    threatLevels: { high: [1, 2, 12], moderate: [3, 9, 11], low: [4, 5, 6, 7, 8, 10] }
  },

  'Leopard': {
    breedingSeason: { months: [1, 2, 5, 6], peak: 2 },
    activePeriods: { 
      high: [1, 2, 3, 10, 11, 12], 
      low: [6, 7, 8] 
    },
    migrationTendency: 'opportunistic',
    weatherPreference: 'cool_moderate',
    behaviorByMonth: {
      1: 'breeding_active', 2: 'breeding_peak', 3: 'territorial_defense',
      4: 'hunting_adaptation', 5: 'secondary_breeding', 6: 'heat_shelter',
      7: 'nocturnal_increase', 8: 'survival_mode', 9: 'activity_recovery',
      10: 'territorial_expansion', 11: 'pre_winter_prep', 12: 'winter_adaptation'
    },
    populationPeaks: [2, 11],
    threatLevels: { high: [6, 7, 8], moderate: [4, 5, 9], low: [1, 2, 3, 10, 11, 12] }
  },

  'Rhinoceros': {
    breedingSeason: { months: [2, 3, 4, 5], peak: 3 },
    activePeriods: { 
      high: [2, 3, 4, 10, 11], 
      low: [6, 7, 8, 9] 
    },
    migrationTendency: 'minimal',
    weatherPreference: 'cool_wet',
    behaviorByMonth: {
      1: 'wallowing_frequent', 2: 'breeding_start', 3: 'breeding_peak',
      4: 'post_breeding', 5: 'grazing_intensive', 6: 'heat_stress',
      7: 'mud_wallowing', 8: 'shade_seeking', 9: 'monsoon_relief',
      10: 'feeding_recovery', 11: 'social_interaction', 12: 'winter_grazing'
    },
    populationPeaks: [3, 11],
    threatLevels: { high: [6, 7, 8], moderate: [1, 9, 12], low: [2, 3, 4, 5, 10, 11] }
  }
};

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
  static predictSeasonalBehavior(species, month) {
    const patterns = SPECIES_SEASONAL_PATTERNS[species];
    if (!patterns) {
      return {
        primaryBehavior: 'normal_activity',
        breedingSeason: false,
        activityLevel: 'Normal',
        threatLevel: 'Low',
        recommendation: 'Continue regular monitoring',
        confidence: 'Low - No species data available'
      };
    }

    const behavior = patterns.behaviorByMonth[month];
    const isBreeding = patterns.breedingSeason.months.includes(month);
    const isBreedingPeak = patterns.breedingSeason.peak === month;
    
    let activityLevel = 'Normal';
    if (patterns.activePeriods.high.includes(month)) activityLevel = 'High';
    else if (patterns.activePeriods.low.includes(month)) activityLevel = 'Low';

    let threatLevel = 'Moderate';
    if (patterns.threatLevels.high.includes(month)) threatLevel = 'High';
    else if (patterns.threatLevels.low.includes(month)) threatLevel = 'Low';

    const recommendation = this.generateRecommendation(behavior, activityLevel, isBreeding, threatLevel);

    return {
      primaryBehavior: behavior,
      breedingSeason: isBreeding,
      breedingPeak: isBreedingPeak,
      activityLevel,
      threatLevel,
      migrationTendency: patterns.migrationTendency,
      recommendation,
      confidence: 'High - Based on species biology'
    };
  }

  /**
   * Generate monitoring recommendations
   * @param {string} behavior - Primary behavior
   * @param {string} activity - Activity level
   * @param {boolean} breeding - Is breeding season
   * @param {string} threat - Threat level
   * @returns {string} Recommendation
   */
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

  /**
   * Generate temporal insights for current period
   * @param {Array} animals - Array of animal records
   * @returns {Array} Array of insights
   */
  static generateTemporalInsights(animals) {
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

    // Generate insights for each species
    Object.keys(speciesCounts).forEach(species => {
      const prediction = this.predictSeasonalBehavior(species, currentMonth);
      const alertLevel = this.calculateAlertLevel(species, speciesCounts[species], currentMonth);
      
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

    // Sort by alert level and count
    return insights.sort((a, b) => {
      const alertOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
      return (alertOrder[b.alertLevel] - alertOrder[a.alertLevel]) || (b.currentCount - a.currentCount);
    });
  }

  /**
   * Calculate alert level based on species patterns and current data
   * @param {string} species - Species name
   * @param {number} count - Current count
   * @param {number} month - Current month
   * @returns {string} Alert level
   */
  static calculateAlertLevel(species, count, month) {
    const patterns = SPECIES_SEASONAL_PATTERNS[species];
    if (!patterns) return 'Low';

    let alertLevel = 'Low';
    
    // Check threat level for the month
    if (patterns.threatLevels.high.includes(month)) {
      alertLevel = 'High';
    } else if (patterns.threatLevels.moderate.includes(month)) {
      alertLevel = 'Medium';
    }

    // Adjust based on population count (assuming average of 10-20 per species)
    if (count < 5) {
      alertLevel = alertLevel === 'Low' ? 'Medium' : 'Critical';
    } else if (count > 50) {
      alertLevel = 'Low'; // High population, less concern
    }

    // Breeding season increases alert level
    if (patterns.breedingSeason.months.includes(month)) {
      const levels = ['Low', 'Medium', 'High', 'Critical'];
      const currentIndex = levels.indexOf(alertLevel);
      alertLevel = levels[Math.min(currentIndex + 1, 3)];
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
          migrationTendency: SPECIES_SEASONAL_PATTERNS[animal.name]?.migrationTendency || 'unknown'
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

export default TemporalAnalysisService;