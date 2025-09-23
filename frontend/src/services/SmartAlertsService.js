/**
 * Smart Alerts Service - Zero Cost AI-Powered Notifications
 * Provides intelligent alert generation and recommendation system
 * for wildlife monitoring and conservation management
 */

import { Alert } from 'react-native';

class SmartAlertsService {
  
  // Alert priorities
  static PRIORITY = {
    CRITICAL: 10,
    HIGH: 8,
    MEDIUM: 6,
    LOW: 4,
    INFO: 2
  };

  // Alert types
  static TYPES = {
    CONSERVATION: 'conservation',
    POACHING: 'poaching',
    POPULATION: 'population',
    HABITAT: 'habitat',
    SYSTEM: 'system'
  };

  /**
   * Generate smart alerts based on data analysis
   */
  generateSmartAlerts(poachingData, animalData, predictions) {
    const alerts = [];
    
    // Critical population alerts
    alerts.push(...this.generatePopulationAlerts(animalData, predictions));
    
    // Poaching threat alerts
    alerts.push(...this.generatePoachingAlerts(poachingData, predictions));
    
    // Conservation priority alerts
    alerts.push(...this.generateConservationAlerts(animalData));
    
    // Habitat threat alerts
    alerts.push(...this.generateHabitatAlerts(animalData));
    
    // System recommendations
    alerts.push(...this.generateSystemAlerts(poachingData, animalData));
    
    return alerts.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate population-based alerts
   */
  generatePopulationAlerts(animalData, predictions) {
    const alerts = [];
    
    if (!predictions || predictions.length === 0) return alerts;
    
    // Critical decline alerts
    const criticalDeclines = predictions.filter(p => 
      p.predictedChange < -0.5 && p.confidence > 0.7
    );
    
    criticalDeclines.forEach(prediction => {
      alerts.push({
        id: `pop_critical_${prediction.species}`,
        type: this.TYPES.POPULATION,
        priority: this.PRIORITY.CRITICAL,
        title: `🚨 Critical Population Decline`,
        message: `${prediction.species} population predicted to decline by ${Math.abs(prediction.predictedChange).toFixed(1)}`,
        actionable: true,
        actions: [
          'Increase monitoring frequency',
          'Implement emergency protection measures',
          'Assess habitat conditions',
          'Review conservation strategy'
        ],
        data: prediction,
        timestamp: new Date().toISOString()
      });
    });
    
    // Rapid growth alerts (could indicate data issues or positive conservation)
    const rapidGrowth = predictions.filter(p => 
      p.predictedChange > 1.0 && p.confidence > 0.6
    );
    
    rapidGrowth.forEach(prediction => {
      alerts.push({
        id: `pop_growth_${prediction.species}`,
        type: this.TYPES.POPULATION,
        priority: this.PRIORITY.MEDIUM,
        title: `📈 Unusual Population Growth`,
        message: `${prediction.species} showing rapid population increase - verify data accuracy`,
        actionable: true,
        actions: [
          'Verify recent count data',
          'Check for counting methodology changes',
          'Investigate possible causes',
          'Update conservation status if confirmed'
        ],
        data: prediction,
        timestamp: new Date().toISOString()
      });
    });
    
    return alerts;
  }

  /**
   * Generate poaching-based alerts
   */
  generatePoachingAlerts(poachingData, predictions) {
    const alerts = [];
    
    if (!poachingData || poachingData.length === 0) return alerts;
    
    // Recent incident surge
    const recentIncidents = this.getRecentIncidents(poachingData, 7); // Last 7 days
    if (recentIncidents.length >= 3) {
      alerts.push({
        id: 'poaching_surge',
        type: this.TYPES.POACHING,
        priority: this.PRIORITY.HIGH,
        title: '⚠️ Poaching Incident Surge',
        message: `${recentIncidents.length} incidents reported in the last week`,
        actionable: true,
        actions: [
          'Deploy additional patrol units',
          'Activate emergency response protocol',
          'Contact law enforcement',
          'Implement heightened surveillance'
        ],
        data: { incidents: recentIncidents },
        timestamp: new Date().toISOString()
      });
    }
    
    // High-value species targeting
    const targetedSpecies = this.identifyTargetedSpecies(poachingData);
    targetedSpecies.forEach(species => {
      alerts.push({
        id: `targeting_${species.name}`,
        type: this.TYPES.POACHING,
        priority: this.PRIORITY.HIGH,
        title: `🎯 Species Targeting Alert`,
        message: `${species.name} being specifically targeted - ${species.incidents} recent incidents`,
        actionable: true,
        actions: [
          'Increase species-specific protection',
          'Deploy specialized anti-poaching units',
          'Enhance habitat security',
          'Coordinate with wildlife authorities'
        ],
        data: species,
        timestamp: new Date().toISOString()
      });
    });
    
    // Hotspot predictions
    if (predictions && predictions.length > 0) {
      const highRiskAreas = predictions.filter(p => p.predictedRisk >= 7);
      
      highRiskAreas.forEach(area => {
        alerts.push({
          id: `hotspot_${area.location}`,
          type: this.TYPES.POACHING,
          priority: this.PRIORITY.MEDIUM,
          title: `📍 High-Risk Area Alert`,
          message: `${area.location} predicted as high-risk for poaching activity`,
          actionable: true,
          actions: [
            'Increase patrol frequency in area',
            'Install additional surveillance',
            'Engage local communities',
            'Review access control measures'
          ],
          data: area,
          timestamp: new Date().toISOString()
        });
      });
    }
    
    return alerts;
  }

  /**
   * Generate conservation priority alerts
   */
  generateConservationAlerts(animalData) {
    const alerts = [];
    
    if (!animalData || animalData.length === 0) return alerts;
    
    // Low population species
    const endangeredSpecies = animalData.filter(animal => 
      (animal.count || animal.population || 0) < 50
    );
    
    if (endangeredSpecies.length > 0) {
      alerts.push({
        id: 'endangered_species',
        type: this.TYPES.CONSERVATION,
        priority: this.PRIORITY.HIGH,
        title: `🦏 Endangered Species Alert`,
        message: `${endangeredSpecies.length} species with critically low populations`,
        actionable: true,
        actions: [
          'Review conservation status',
          'Implement breeding programs',
          'Enhance habitat protection',
          'Coordinate conservation efforts'
        ],
        data: { species: endangeredSpecies },
        timestamp: new Date().toISOString()
      });
    }
    
    // Species not monitored recently
    const staleData = this.identifyStaleMonitoring(animalData);
    if (staleData.length > 0) {
      alerts.push({
        id: 'monitoring_gaps',
        type: this.TYPES.SYSTEM,
        priority: this.PRIORITY.MEDIUM,
        title: `📊 Monitoring Gaps Detected`,
        message: `${staleData.length} species need updated monitoring data`,
        actionable: true,
        actions: [
          'Schedule monitoring expeditions',
          'Deploy remote monitoring equipment',
          'Engage local observers',
          'Update data collection protocols'
        ],
        data: { species: staleData },
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  }

  /**
   * Generate habitat-related alerts
   */
  generateHabitatAlerts(animalData) {
    const alerts = [];
    
    // This would typically analyze habitat data
    // For now, we'll generate based on species distribution
    const habitatPressure = this.analyzeHabitatPressure(animalData);
    
    if (habitatPressure.fragmentation > 0.7) {
      alerts.push({
        id: 'habitat_fragmentation',
        type: this.TYPES.HABITAT,
        priority: this.PRIORITY.HIGH,
        title: `🌲 Habitat Fragmentation Alert`,
        message: 'High habitat fragmentation detected affecting wildlife populations',
        actionable: true,
        actions: [
          'Assess corridor connectivity',
          'Plan habitat restoration',
          'Implement protection measures',
          'Coordinate with land management'
        ],
        data: habitatPressure,
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  }

  /**
   * Generate system and operational alerts
   */
  generateSystemAlerts(poachingData, animalData) {
    const alerts = [];
    
    // Data quality alerts
    const dataQuality = this.assessDataQuality(poachingData, animalData);
    
    if (dataQuality.score < 0.7) {
      alerts.push({
        id: 'data_quality',
        type: this.TYPES.SYSTEM,
        priority: this.PRIORITY.MEDIUM,
        title: `📈 Data Quality Alert`,
        message: 'Data quality issues detected - may affect analysis accuracy',
        actionable: true,
        actions: [
          'Review data collection procedures',
          'Validate recent entries',
          'Train field staff',
          'Implement quality checks'
        ],
        data: dataQuality,
        timestamp: new Date().toISOString()
      });
    }
    
    // Resource allocation recommendations
    const resourceNeeds = this.analyzeResourceNeeds(poachingData, animalData);
    if (resourceNeeds.criticalAreas.length > 0) {
      alerts.push({
        id: 'resource_allocation',
        type: this.TYPES.SYSTEM,
        priority: this.PRIORITY.MEDIUM,
        title: `⚡ Resource Allocation Alert`,
        message: `${resourceNeeds.criticalAreas.length} areas need priority resource allocation`,
        actionable: true,
        actions: [
          'Reassess resource distribution',
          'Prioritize critical areas',
          'Request additional resources',
          'Optimize patrol schedules'
        ],
        data: resourceNeeds,
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  }

  /**
   * UTILITY FUNCTIONS
   */
  
  getRecentIncidents(incidents, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return incidents.filter(incident => {
      const incidentDate = new Date(incident.date);
      return incidentDate >= cutoffDate;
    });
  }
  
  identifyTargetedSpecies(incidents) {
    const speciesCounts = {};
    
    incidents.forEach(incident => {
      if (incident.species) {
        speciesCounts[incident.species] = (speciesCounts[incident.species] || 0) + 1;
      }
    });
    
    return Object.entries(speciesCounts)
      .filter(([species, count]) => count >= 3)
      .map(([species, count]) => ({
        name: species,
        incidents: count,
        percentage: (count / incidents.length * 100).toFixed(1)
      }));
  }
  
  identifyStaleMonitoring(animalData) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3); // 3 months ago
    
    return animalData.filter(animal => {
      if (!animal.lastSeen && !animal.date) return true;
      
      const lastDate = new Date(animal.lastSeen || animal.date);
      return lastDate < cutoffDate;
    });
  }
  
  analyzeHabitatPressure(animalData) {
    // Simplified habitat pressure analysis
    const locations = new Set(animalData.map(animal => animal.location).filter(Boolean));
    const averagePopulation = animalData.reduce((sum, animal) => 
      sum + (animal.count || animal.population || 0), 0) / animalData.length;
    
    return {
      fragmentation: locations.size > 10 ? 0.8 : 0.4,
      populationPressure: averagePopulation < 100 ? 0.7 : 0.3,
      locations: Array.from(locations)
    };
  }
  
  assessDataQuality(poachingData, animalData) {
    let score = 1.0;
    const issues = [];
    
    // Check for missing data
    const missingPoachingData = poachingData.filter(p => 
      !p.location || !p.date || !p.severity
    ).length;
    
    const missingAnimalData = animalData.filter(a => 
      !a.species && !a.name || !a.location
    ).length;
    
    if (missingPoachingData > poachingData.length * 0.1) {
      score -= 0.2;
      issues.push('Missing poaching incident data');
    }
    
    if (missingAnimalData > animalData.length * 0.1) {
      score -= 0.2;
      issues.push('Missing animal monitoring data');
    }
    
    // Check for outdated data
    const oldData = this.identifyStaleMonitoring(animalData);
    if (oldData.length > animalData.length * 0.3) {
      score -= 0.3;
      issues.push('Outdated monitoring data');
    }
    
    return {
      score: Math.max(score, 0),
      issues,
      recommendations: this.generateDataQualityRecommendations(issues)
    };
  }
  
  analyzeResourceNeeds(poachingData, animalData) {
    const locationIncidents = {};
    
    poachingData.forEach(incident => {
      if (incident.location) {
        locationIncidents[incident.location] = 
          (locationIncidents[incident.location] || 0) + 1;
      }
    });
    
    const criticalAreas = Object.entries(locationIncidents)
      .filter(([location, incidents]) => incidents >= 3)
      .map(([location, incidents]) => ({ location, incidents }))
      .sort((a, b) => b.incidents - a.incidents);
    
    return {
      criticalAreas,
      totalIncidents: poachingData.length,
      recommendation: criticalAreas.length > 0 ? 
        'Focus resources on high-incident areas' :
        'Maintain current resource distribution'
    };
  }
  
  generateDataQualityRecommendations(issues) {
    const recommendations = [];
    
    if (issues.includes('Missing poaching incident data')) {
      recommendations.push('Implement mandatory field validation');
      recommendations.push('Train staff on complete incident reporting');
    }
    
    if (issues.includes('Missing animal monitoring data')) {
      recommendations.push('Deploy additional monitoring equipment');
      recommendations.push('Establish regular monitoring schedules');
    }
    
    if (issues.includes('Outdated monitoring data')) {
      recommendations.push('Increase monitoring frequency');
      recommendations.push('Implement automated data collection where possible');
    }
    
    return recommendations;
  }

  /**
   * Display alert to user
   */
  showAlert(alert) {
    Alert.alert(
      alert.title,
      alert.message,
      alert.actionable ? [
        { text: 'Dismiss', style: 'cancel' },
        { text: 'View Actions', onPress: () => this.showActions(alert) }
      ] : [
        { text: 'OK', style: 'default' }
      ]
    );
  }

  /**
   * Show actionable recommendations
   */
  showActions(alert) {
    const actionText = alert.actions.map((action, index) => 
      `${index + 1}. ${action}`
    ).join('\n\n');
    
    Alert.alert(
      'Recommended Actions',
      actionText,
      [{ text: 'OK', style: 'default' }]
    );
  }

  /**
   * Get alert summary for dashboard
   */
  getAlertSummary(alerts) {
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.priority >= this.PRIORITY.CRITICAL).length,
      high: alerts.filter(a => a.priority >= this.PRIORITY.HIGH && a.priority < this.PRIORITY.CRITICAL).length,
      medium: alerts.filter(a => a.priority >= this.PRIORITY.MEDIUM && a.priority < this.PRIORITY.HIGH).length,
      byType: {}
    };
    
    Object.values(this.TYPES).forEach(type => {
      summary.byType[type] = alerts.filter(a => a.type === type).length;
    });
    
    return summary;
  }
}

export default new SmartAlertsService();