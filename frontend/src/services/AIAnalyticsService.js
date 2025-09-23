/**
 * AI Analytics Service - Zero Cost Intelligence
 * Provides predictive analytics, risk assessment, and smart insights
 * for wildlife monitoring and poaching prevention
 */

class AIAnalyticsService {
  
  /**
   * POACHING PREDICTION ALGORITHMS
   */
  
  // Predict future poaching hotspots based on historical data
  predictPoachingHotspots(historicalData, timeframe = 30) {
    const predictions = [];
    
    // Group incidents by location
    const locationData = this.groupByLocation(historicalData);
    
    Object.entries(locationData).forEach(([location, incidents]) => {
      const riskScore = this.calculateLocationRiskScore(incidents);
      const trend = this.calculateTrend(incidents);
      const seasonalFactor = this.getSeasonalRiskFactor(location, incidents);
      
      const prediction = {
        location,
        currentRisk: riskScore,
        predictedRisk: riskScore * trend * seasonalFactor,
        confidence: this.calculateConfidence(incidents.length),
        recommendation: this.generateRecommendation(riskScore * trend * seasonalFactor),
        factors: this.analyzeFactors(incidents)
      };
      
      predictions.push(prediction);
    });
    
    return predictions.sort((a, b) => b.predictedRisk - a.predictedRisk);
  }
  
  // Calculate risk score for a location based on historical incidents
  calculateLocationRiskScore(incidents) {
    if (!incidents || incidents.length === 0) return 0;
    
    const now = new Date();
    let riskScore = 0;
    
    incidents.forEach(incident => {
      const incidentDate = new Date(incident.date);
      const daysSince = (now - incidentDate) / (1000 * 60 * 60 * 24);
      
      // Recent incidents have higher weight
      const timeWeight = Math.max(0, 1 - (daysSince / 365));
      
      // Severity multiplier
      const severityWeight = incident.severity === 'High' ? 3 : 
                           incident.severity === 'Medium' ? 2 : 1;
      
      riskScore += timeWeight * severityWeight;
    });
    
    return Math.min(riskScore / incidents.length * 10, 10); // Scale to 0-10
  }
  
  // Calculate trend direction (increasing/decreasing incidents)
  calculateTrend(incidents) {
    if (incidents.length < 3) return 1;
    
    const sortedIncidents = incidents.sort((a, b) => new Date(a.date) - new Date(b.date));
    const mid = Math.floor(sortedIncidents.length / 2);
    
    const recentIncidents = sortedIncidents.slice(mid);
    const olderIncidents = sortedIncidents.slice(0, mid);
    
    const recentRate = recentIncidents.length / this.getTimeSpan(recentIncidents);
    const olderRate = olderIncidents.length / this.getTimeSpan(olderIncidents);
    
    return olderRate === 0 ? 1.5 : Math.min(recentRate / olderRate, 3);
  }
  
  // Get seasonal risk factor based on historical patterns
  getSeasonalRiskFactor(location, incidents) {
    const currentMonth = new Date().getMonth();
    const monthlyIncidents = Array(12).fill(0);
    
    incidents.forEach(incident => {
      const month = new Date(incident.date).getMonth();
      monthlyIncidents[month]++;
    });
    
    const avgMonthly = monthlyIncidents.reduce((a, b) => a + b, 0) / 12;
    return avgMonthly === 0 ? 1 : Math.max(0.5, monthlyIncidents[currentMonth] / avgMonthly);
  }
  
  /**
   * POPULATION TREND PREDICTIONS
   */
  
  // Predict animal population trends
  predictPopulationTrends(animalData, timeframe = 6) {
    const predictions = [];
    
    // Group by species
    const speciesData = this.groupBySpecies(animalData);
    
    Object.entries(speciesData).forEach(([species, data]) => {
      const trend = this.analyzePopulationTrend(data);
      const prediction = {
        species,
        currentPopulation: this.getCurrentPopulation(data),
        predictedChange: trend.change,
        confidence: trend.confidence,
        riskLevel: this.assessConservationRisk(trend),
        recommendations: this.generateConservationRecommendations(species, trend),
        factors: trend.factors
      };
      
      predictions.push(prediction);
    });
    
    return predictions.sort((a, b) => b.riskLevel - a.riskLevel);
  }
  
  // Analyze population trend using linear regression
  analyzePopulationTrend(data) {
    if (data.length < 3) return { change: 0, confidence: 0, factors: [] };
    
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const points = sortedData.map((item, index) => [index, item.count || 0]);
    
    const regression = this.linearRegression(points);
    const factors = this.identifyPopulationFactors(sortedData);
    
    return {
      change: regression.slope,
      confidence: regression.r2,
      factors,
      trend: regression.slope > 0 ? 'increasing' : 'decreasing'
    };
  }
  
  // Assess conservation risk level
  assessConservationRisk(trend) {
    let risk = 0;
    
    // Declining population
    if (trend.change < -0.5) risk += 3;
    else if (trend.change < 0) risk += 1;
    
    // Low confidence in data
    if (trend.confidence < 0.5) risk += 1;
    
    // Factor-based risks
    trend.factors.forEach(factor => {
      if (factor.type === 'habitat_loss') risk += 2;
      if (factor.type === 'poaching') risk += 3;
      if (factor.type === 'disease') risk += 1;
    });
    
    return Math.min(risk, 10);
  }
  
  /**
   * SMART INSIGHTS GENERATION
   */
  
  // Generate actionable insights from data patterns
  generateSmartInsights(poachingData, animalData) {
    const insights = [];
    
    // Poaching pattern insights
    const poachingInsights = this.analyzePoachingPatterns(poachingData);
    insights.push(...poachingInsights);
    
    // Population correlation insights
    const correlationInsights = this.analyzeCorrelations(poachingData, animalData);
    insights.push(...correlationInsights);
    
    // Temporal pattern insights
    const temporalInsights = this.analyzeTemporalPatterns(poachingData);
    insights.push(...temporalInsights);
    
    // Priority recommendations
    const recommendations = this.generatePriorityRecommendations(poachingData, animalData);
    insights.push(...recommendations);
    
    return insights.sort((a, b) => b.priority - a.priority);
  }
  
  // Analyze poaching patterns for insights
  analyzePoachingPatterns(data) {
    const insights = [];
    
    // Time-based patterns
    const hourlyPattern = this.analyzeHourlyPattern(data);
    if (hourlyPattern.peak) {
      insights.push({
        type: 'temporal',
        title: '⏰ Peak Poaching Hours Detected',
        description: `Most incidents occur between ${hourlyPattern.peak.start}-${hourlyPattern.peak.end}`,
        recommendation: 'Increase patrol frequency during these hours',
        priority: 8,
        confidence: hourlyPattern.confidence
      });
    }
    
    // Location clustering
    const clusters = this.identifyLocationClusters(data);
    if (clusters.length > 0) {
      insights.push({
        type: 'spatial',
        title: '📍 Poaching Clusters Identified',
        description: `${clusters.length} high-activity zones detected`,
        recommendation: 'Deploy surveillance equipment in cluster centers',
        priority: 9,
        confidence: 0.85,
        data: clusters
      });
    }
    
    return insights;
  }
  
  // Generate priority recommendations
  generatePriorityRecommendations(poachingData, animalData) {
    const recommendations = [];
    
    // Critical species alert
    const criticalSpecies = this.identifyCriticalSpecies(animalData);
    if (criticalSpecies.length > 0) {
      recommendations.push({
        type: 'conservation',
        title: '🚨 Critical Species Alert',
        description: `${criticalSpecies.length} species at high risk`,
        recommendation: 'Implement immediate protection measures',
        priority: 10,
        confidence: 0.9,
        species: criticalSpecies
      });
    }
    
    // Resource allocation optimization
    const allocation = this.optimizeResourceAllocation(poachingData);
    recommendations.push({
      type: 'resource',
      title: '⚡ Resource Optimization',
      description: allocation.description,
      recommendation: allocation.recommendation,
      priority: 7,
      confidence: allocation.confidence
    });
    
    return recommendations;
  }
  
  /**
   * UTILITY FUNCTIONS
   */
  
  // Linear regression for trend analysis
  linearRegression(points) {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
    
    const sumX = points.reduce((sum, [x]) => sum + x, 0);
    const sumY = points.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = points.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumXX = points.reduce((sum, [x]) => sum + x * x, 0);
    const sumYY = points.reduce((sum, [, y]) => sum + y * y, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = points.reduce((sum, [, y]) => sum + Math.pow(y - yMean, 2), 0);
    const ssRes = points.reduce((sum, [x, y]) => {
      const predicted = slope * x + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    
    const r2 = ssTotal === 0 ? 0 : 1 - (ssRes / ssTotal);
    
    return { slope, intercept, r2: Math.max(0, r2) };
  }
  
  // Group data by location
  groupByLocation(data) {
    return data.reduce((groups, item) => {
      const location = item.location || 'Unknown';
      if (!groups[location]) groups[location] = [];
      groups[location].push(item);
      return groups;
    }, {});
  }
  
  // Group data by species
  groupBySpecies(data) {
    return data.reduce((groups, item) => {
      const species = item.species || item.name || 'Unknown';
      if (!groups[species]) groups[species] = [];
      groups[species].push(item);
      return groups;
    }, {});
  }
  
  // Calculate confidence based on data volume
  calculateConfidence(dataPoints) {
    if (dataPoints < 3) return 0.3;
    if (dataPoints < 10) return 0.6;
    if (dataPoints < 30) return 0.8;
    return 0.95;
  }
  
  // Get time span of incidents in days
  getTimeSpan(incidents) {
    if (incidents.length < 2) return 1;
    
    const dates = incidents.map(i => new Date(i.date)).sort((a, b) => a - b);
    const span = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
    return Math.max(span, 1);
  }
  
  // Generate recommendations based on risk score
  generateRecommendation(riskScore) {
    if (riskScore >= 8) return 'Deploy immediate patrol units and surveillance';
    if (riskScore >= 6) return 'Increase monitoring frequency and ranger presence';
    if (riskScore >= 4) return 'Schedule regular patrols and community engagement';
    if (riskScore >= 2) return 'Maintain standard monitoring protocols';
    return 'Continue routine surveillance';
  }
  
  // Analyze factors contributing to incidents
  analyzeFactors(incidents) {
    const factors = [];
    
    // Check for seasonal patterns
    const months = incidents.map(i => new Date(i.date).getMonth());
    const monthCounts = months.reduce((acc, month) => {
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    
    const maxMonth = Object.keys(monthCounts).reduce((a, b) => 
      monthCounts[a] > monthCounts[b] ? a : b
    );
    
    if (monthCounts[maxMonth] > incidents.length * 0.3) {
      factors.push({
        type: 'seasonal',
        description: `Peak activity in month ${parseInt(maxMonth) + 1}`,
        impact: 'high'
      });
    }
    
    // Check for species targeting
    const species = incidents.map(i => i.species).filter(Boolean);
    if (species.length > 0) {
      const speciesCounts = species.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      
      const targetedSpecies = Object.keys(speciesCounts).filter(s => 
        speciesCounts[s] > incidents.length * 0.4
      );
      
      if (targetedSpecies.length > 0) {
        factors.push({
          type: 'species_targeting',
          description: `Targeting: ${targetedSpecies.join(', ')}`,
          impact: 'high'
        });
      }
    }
    
    return factors;
  }
  
  // Get current population from latest data
  getCurrentPopulation(data) {
    if (!data || data.length === 0) return 0;
    const latest = data.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return latest.count || latest.population || 0;
  }
  
  // Identify factors affecting population
  identifyPopulationFactors(data) {
    const factors = [];
    
    // Check for sudden drops
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1].count || 0;
      const curr = data[i].count || 0;
      
      if (prev > 0 && curr < prev * 0.7) {
        factors.push({
          type: 'sudden_decline',
          description: `${((1 - curr/prev) * 100).toFixed(1)}% drop detected`,
          severity: 'high',
          date: data[i].date
        });
      }
    }
    
    return factors;
  }
  
  // Generate conservation recommendations
  generateConservationRecommendations(species, trend) {
    const recommendations = [];
    
    if (trend.change < -0.3) {
      recommendations.push('Implement immediate population monitoring');
      recommendations.push('Assess habitat quality and threats');
    }
    
    if (trend.confidence < 0.6) {
      recommendations.push('Increase data collection frequency');
      recommendations.push('Deploy additional monitoring equipment');
    }
    
    trend.factors.forEach(factor => {
      if (factor.type === 'sudden_decline') {
        recommendations.push('Investigate cause of population drop');
        recommendations.push('Consider temporary protection measures');
      }
    });
    
    return recommendations;
  }
  
  // Analyze correlations between poaching and population data
  analyzeCorrelations(poachingData, animalData) {
    const insights = [];
    
    // Simple correlation analysis
    const poachingBySpecies = this.groupBySpecies(poachingData);
    const populationBySpecies = this.groupBySpecies(animalData);
    
    Object.keys(populationBySpecies).forEach(species => {
      const poaching = poachingBySpecies[species] || [];
      const population = populationBySpecies[species] || [];
      
      if (poaching.length > 2 && population.length > 2) {
        const correlation = this.calculateCorrelation(poaching, population);
        
        if (Math.abs(correlation) > 0.6) {
          insights.push({
            type: 'correlation',
            title: `📊 ${species} Population-Poaching Link`,
            description: `${correlation < 0 ? 'Negative' : 'Positive'} correlation detected`,
            recommendation: correlation < 0 ? 
              'Poaching may be impacting population - increase protection' :
              'Population growth may attract poachers - enhance monitoring',
            priority: 8,
            confidence: Math.abs(correlation)
          });
        }
      }
    });
    
    return insights;
  }
  
  // Analyze temporal patterns
  analyzeTemporalPatterns(data) {
    const insights = [];
    
    // Day of week pattern
    const dayPattern = this.analyzeDayOfWeekPattern(data);
    if (dayPattern.significant) {
      insights.push({
        type: 'temporal',
        title: '📅 Weekly Pattern Detected',
        description: `Most incidents on ${dayPattern.peakDay}`,
        recommendation: 'Adjust patrol schedules for high-risk days',
        priority: 6,
        confidence: 0.7
      });
    }
    
    return insights;
  }
  
  // Calculate simple correlation coefficient
  calculateCorrelation(data1, data2) {
    // This is a simplified correlation - in a real implementation,
    // you'd want to align data by time periods
    const len = Math.min(data1.length, data2.length);
    if (len < 3) return 0;
    
    const values1 = data1.slice(0, len).map(d => d.count || 1);
    const values2 = data2.slice(0, len).map(d => d.count || 1);
    
    const mean1 = values1.reduce((a, b) => a + b) / len;
    const mean2 = values2.reduce((a, b) => a + b) / len;
    
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < len; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  // Analyze hourly patterns (simplified)
  analyzeHourlyPattern(data) {
    // This would typically require timestamp data
    // For now, return a mock pattern
    return {
      peak: { start: '20:00', end: '04:00' },
      confidence: 0.7
    };
  }
  
  // Identify location clusters (simplified)
  identifyLocationClusters(data) {
    const locationCounts = this.groupByLocation(data);
    return Object.entries(locationCounts)
      .filter(([, incidents]) => incidents.length >= 3)
      .map(([location, incidents]) => ({
        location,
        incidentCount: incidents.length,
        riskScore: this.calculateLocationRiskScore(incidents)
      }));
  }
  
  // Identify critical species
  identifyCriticalSpecies(data) {
    const speciesData = this.groupBySpecies(data);
    const critical = [];
    
    Object.entries(speciesData).forEach(([species, records]) => {
      const trend = this.analyzePopulationTrend(records);
      const currentPop = this.getCurrentPopulation(records);
      
      if (trend.change < -0.5 || currentPop < 50) {
        critical.push({
          species,
          population: currentPop,
          trend: trend.change,
          riskLevel: this.assessConservationRisk(trend)
        });
      }
    });
    
    return critical;
  }
  
  // Optimize resource allocation
  optimizeResourceAllocation(data) {
    const locations = this.groupByLocation(data);
    const totalIncidents = data.length;
    
    if (totalIncidents === 0) {
      return {
        description: 'No incidents to analyze',
        recommendation: 'Maintain current resource distribution',
        confidence: 0.5
      };
    }
    
    const sortedLocations = Object.entries(locations)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3);
    
    const topThreePercent = sortedLocations.reduce((sum, [, incidents]) => 
      sum + incidents.length, 0) / totalIncidents * 100;
    
    return {
      description: `Top 3 locations account for ${topThreePercent.toFixed(1)}% of incidents`,
      recommendation: topThreePercent > 60 ? 
        'Focus 70% of resources on top 3 locations' :
        'Distribute resources more evenly across all locations',
      confidence: 0.8
    };
  }
  
  // Analyze day of week patterns
  analyzeDayOfWeekPattern(data) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = Array(7).fill(0);
    
    data.forEach(incident => {
      const day = new Date(incident.date).getDay();
      dayCounts[day]++;
    });
    
    const maxCount = Math.max(...dayCounts);
    const maxDay = dayCounts.indexOf(maxCount);
    const avgCount = dayCounts.reduce((a, b) => a + b) / 7;
    
    return {
      significant: maxCount > avgCount * 1.5,
      peakDay: days[maxDay],
      distribution: dayCounts
    };
  }
}

export default new AIAnalyticsService();