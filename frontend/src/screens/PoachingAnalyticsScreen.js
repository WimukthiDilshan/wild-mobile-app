import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import ApiService from '../services/ApiService';
import AIAnalyticsService from '../services/AIAnalyticsService';
import { useAuth } from '../contexts/AuthContext';

const screenWidth = Dimensions.get('window').width;

const PoachingAnalyticsScreen = ({ navigation }) => {
  const { user, rolePermissions } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiInsights, setAiInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);

  // Check if user has permission to view analytics
  if (!rolePermissions?.canViewAnalytics) {
    return (
      <View style={styles.permissionDenied}>
        <Text style={styles.permissionTitle}>🚫 Access Denied</Text>
        <Text style={styles.permissionText}>
          Your role ({user?.role}) doesn't have permission to view poaching analytics.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, incidentsData] = await Promise.all([
        ApiService.fetchPoachingAnalytics(),
        ApiService.fetchPoachingIncidents()
      ]);
      setAnalytics(analyticsData);
      setIncidents(incidentsData);
      
      // Generate AI insights and predictions
      if (incidentsData && incidentsData.length > 0) {
        const insights = AIAnalyticsService.generateSmartInsights(incidentsData, []);
        const hotspotPredictions = AIAnalyticsService.predictPoachingHotspots(incidentsData);
        
        setAiInsights(insights);
        setPredictions(hotspotPredictions);
      }
      
    } catch (error) {
      console.error('Error loading poaching data:', error);
      Alert.alert('Error', 'Failed to load poaching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return '#F44336';
      case 'Medium': return '#FF9800';
      case 'Low': return '#FFC107';
      default: return '#757575';
    }
  };

  const getRiskLevel = () => {
    if (!analytics) return 'Unknown';
    const { severityRatio } = analytics;
    const highPercentage = parseFloat(severityRatio.high);
    
    if (highPercentage >= 40) return 'Critical';
    if (highPercentage >= 25) return 'High';
    if (highPercentage >= 15) return 'Medium';
    return 'Low';
  };

  const getRiskColor = () => {
    const risk = getRiskLevel();
    switch (risk) {
      case 'Critical': return '#D32F2F';
      case 'High': return '#F44336';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getSeverityChartData = () => {
    if (!analytics) return [];
    
    const { bySeverity } = analytics;
    return [
      {
        name: 'High',
        count: bySeverity.High,
        color: '#F44336',
        legendFontColor: '#333',
        legendFontSize: 14
      },
      {
        name: 'Medium',
        count: bySeverity.Medium,
        color: '#FF9800',
        legendFontColor: '#333',
        legendFontSize: 14
      },
      {
        name: 'Low',
        count: bySeverity.Low,
        color: '#FFC107',
        legendFontColor: '#333',
        legendFontSize: 14
      }
    ];
  };

  const getLocationChartData = () => {
    if (!analytics) return { labels: [], datasets: [{ data: [] }] };
    
    const { byLocation } = analytics;
    const locations = Object.entries(byLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return {
      labels: locations.map(([location]) => location.slice(0, 8) + (location.length > 8 ? '...' : '')),
      datasets: [{
        data: locations.map(([, count]) => count),
        colors: locations.map((_, index) => 
          (opacity = 1) => `rgba(255, ${100 + index * 30}, 100, ${opacity})`
        )
      }]
    };
  };

  const getMonthlyTrendData = () => {
    if (!analytics) return { labels: [], datasets: [{ data: [] }] };
    
    const { byMonth } = analytics;
    const months = Object.entries(byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6); // Last 6 months
    
    return {
      labels: months.map(([month]) => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[parseInt(monthNum) - 1] || month.slice(-2);
      }),
      datasets: [{
        data: months.map(([, count]) => count),
        strokeWidth: 3,
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`
      }]
    };
  };

  const renderOverview = () => {
    if (!analytics) return null;

    return (
      <View>
        {/* Alert Banner */}
        <View style={[styles.alertBanner, { backgroundColor: getRiskColor() }]}>
          <Text style={styles.alertText}>
            🚨 Risk Level: {getRiskLevel()}
          </Text>
          <Text style={styles.alertSubtext}>
            {analytics.totalIncidents} total incidents reported
          </Text>
        </View>

        {/* Key Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.totalIncidents}</Text>
            <Text style={styles.statLabel}>Total{'\n'}Incidents</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F44336' }]}>
              {analytics.bySeverity.High}
            </Text>
            <Text style={styles.statLabel}>High{'\n'}Severity</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.topHotspots.length}</Text>
            <Text style={styles.statLabel}>Active{'\n'}Hotspots</Text>
          </View>
        </View>

        {/* Severity Distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>🎯 Incident Severity Distribution</Text>
          <PieChart
            data={getSeverityChartData()}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
          <View style={styles.severityLegend}>
            <Text style={styles.severityText}>
              High: {analytics.severityRatio.high}% | 
              Medium: {analytics.severityRatio.medium}% | 
              Low: {analytics.severityRatio.low}%
            </Text>
          </View>
        </View>

        {/* Top Hotspots */}
        <View style={styles.hotspotsCard}>
          <Text style={styles.hotspotsTitle}>🔥 Top Poaching Hotspots</Text>
          {analytics.topHotspots.map((hotspot, index) => (
            <View key={index} style={styles.hotspotItem}>
              <View style={styles.hotspotRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.hotspotInfo}>
                <Text style={styles.hotspotLocation}>{hotspot.location}</Text>
                <Text style={styles.hotspotCount}>{hotspot.count} incidents</Text>
              </View>
              <View style={[styles.hotspotBar, { 
                width: `${(hotspot.count / analytics.topHotspots[0].count) * 100}%`,
                backgroundColor: index === 0 ? '#F44336' : index === 1 ? '#FF9800' : '#FFC107'
              }]} />
            </View>
          ))}
        </View>

        {/* Monthly Trend */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📈 Monthly Incident Trend</Text>
          <LineChart
            data={getMonthlyTrendData()}
            width={screenWidth - 60}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#F44336'
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>

        {/* AI Smart Insights */}
        {aiInsights.length > 0 && (
          <View style={styles.aiInsightsCard}>
            <Text style={styles.aiInsightsTitle}>🤖 AI Smart Insights</Text>
            {aiInsights.slice(0, 3).map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <View style={[styles.confidenceBadge, { 
                    backgroundColor: insight.confidence >= 0.8 ? '#4CAF50' : 
                                   insight.confidence >= 0.6 ? '#FF9800' : '#757575'
                  }]}>
                    <Text style={styles.confidenceText}>
                      {Math.round(insight.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                <Text style={styles.insightRecommendation}>💡 {insight.recommendation}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPredictions = () => {
    return (
      <View>
        {/* Hotspot Predictions */}
        <View style={styles.predictionsCard}>
          <Text style={styles.predictionsTitle}>🔮 AI Hotspot Predictions</Text>
          <Text style={styles.predictionsSubtitle}>Next 30 days risk assessment</Text>
          
          {predictions.slice(0, 5).map((prediction, index) => (
            <View key={index} style={styles.predictionItem}>
              <View style={styles.predictionHeader}>
                <Text style={styles.predictionLocation}>{prediction.location}</Text>
                <View style={[styles.riskBadge, { 
                  backgroundColor: prediction.predictedRisk >= 7 ? '#F44336' :
                                 prediction.predictedRisk >= 4 ? '#FF9800' : '#4CAF50'
                }]}>
                  <Text style={styles.riskText}>
                    {prediction.predictedRisk >= 7 ? 'HIGH' :
                     prediction.predictedRisk >= 4 ? 'MED' : 'LOW'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.riskMeter}>
                <View style={[styles.riskFill, { 
                  width: `${Math.min(prediction.predictedRisk * 10, 100)}%`,
                  backgroundColor: prediction.predictedRisk >= 7 ? '#F44336' :
                                 prediction.predictedRisk >= 4 ? '#FF9800' : '#4CAF50'
                }]} />
              </View>
              
              <Text style={styles.predictionScore}>
                Risk Score: {prediction.predictedRisk.toFixed(1)}/10
              </Text>
              <Text style={styles.predictionRecommendation}>
                📋 {prediction.recommendation}
              </Text>
              
              {prediction.factors && prediction.factors.length > 0 && (
                <View style={styles.factorsContainer}>
                  <Text style={styles.factorsTitle}>Key Factors:</Text>
                  {prediction.factors.map((factor, factorIndex) => (
                    <Text key={factorIndex} style={styles.factorText}>
                      • {factor.description}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Risk Analysis */}
        <View style={styles.riskAnalysisCard}>
          <Text style={styles.riskAnalysisTitle}>📊 Risk Analysis Summary</Text>
          
          <View style={styles.riskStats}>
            <View style={styles.riskStatItem}>
              <Text style={styles.riskStatNumber}>
                {predictions.filter(p => p.predictedRisk >= 7).length}
              </Text>
              <Text style={styles.riskStatLabel}>High Risk{'\n'}Locations</Text>
            </View>
            <View style={styles.riskStatItem}>
              <Text style={styles.riskStatNumber}>
                {predictions.filter(p => p.confidence >= 0.8).length}
              </Text>
              <Text style={styles.riskStatLabel}>High Confidence{'\n'}Predictions</Text>
            </View>
            <View style={styles.riskStatItem}>
              <Text style={styles.riskStatNumber}>
                {Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100) || 0}%
              </Text>
              <Text style={styles.riskStatLabel}>Average{'\n'}Confidence</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderAIInsights = () => {
    return (
      <View>
        {/* All AI Insights */}
        <View style={styles.allInsightsCard}>
          <Text style={styles.allInsightsTitle}>🧠 Complete AI Analysis</Text>
          
          {aiInsights.map((insight, index) => (
            <View key={index} style={[styles.fullInsightItem, {
              borderLeftColor: insight.priority >= 8 ? '#F44336' :
                             insight.priority >= 6 ? '#FF9800' : '#4CAF50'
            }]}>
              <View style={styles.insightPriorityHeader}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <View style={styles.priorityIndicator}>
                  <Text style={styles.priorityText}>P{insight.priority}</Text>
                </View>
              </View>
              
              <Text style={styles.insightType}>Type: {insight.type}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              <Text style={styles.insightRecommendation}>
                💡 Recommendation: {insight.recommendation}
              </Text>
              
              <View style={styles.insightMetrics}>
                <Text style={styles.confidenceIndicator}>
                  Confidence: {Math.round(insight.confidence * 100)}%
                </Text>
                <Text style={styles.priorityIndicator}>
                  Priority: {insight.priority}/10
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderIncidents = () => {
    return (
      <View>
        {/* Location Distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📍 Incidents by Location</Text>
          <BarChart
            data={getLocationChartData()}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>

        {/* Recent Incidents */}
        <View style={styles.incidentsCard}>
          <Text style={styles.incidentsTitle}>📋 Recent Incidents</Text>
          {incidents.slice(0, 5).map((incident, index) => (
            <View key={index} style={styles.incidentItem}>
              <View style={styles.incidentHeader}>
                <Text style={styles.incidentSpecies}>🦁 {incident.species}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(incident.severity) }]}>
                  <Text style={styles.severityText}>{incident.severity}</Text>
                </View>
              </View>
              <Text style={styles.incidentLocation}>📍 {incident.location}</Text>
              <Text style={styles.incidentDate}>📅 {incident.date}</Text>
              <Text style={styles.incidentDescription}>{incident.description}</Text>
              <Text style={styles.incidentReporter}>👮 Reported by: {incident.reportedBy}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F44336" />
        <Text style={styles.loadingText}>Loading poaching analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛡️ Poaching Analytics</Text>
          <Text style={styles.headerSubtitle}>Wildlife protection insights</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}>
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'incidents' && styles.activeTab]}
            onPress={() => setActiveTab('incidents')}>
            <Text style={[styles.tabText, activeTab === 'incidents' && styles.activeTabText]}>
              Incidents
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'predictions' && styles.activeTab]}
            onPress={() => setActiveTab('predictions')}>
            <Text style={[styles.tabText, activeTab === 'predictions' && styles.activeTabText]}>
              AI Predict
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'insights' && styles.activeTab]}
            onPress={() => setActiveTab('insights')}>
            <Text style={[styles.tabText, activeTab === 'insights' && styles.activeTabText]}>
              AI Insights
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'incidents' && renderIncidents()}
          {activeTab === 'predictions' && renderPredictions()}
          {activeTab === 'insights' && renderAIInsights()}
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Main</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#F44336',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#F44336',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    padding: 20,
  },
  alertBanner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  alertSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  severityLegend: {
    marginTop: 10,
    alignItems: 'center',
  },
  severityText: {
    fontSize: 12,
    color: '#666',
  },
  hotspotsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  hotspotsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  hotspotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  hotspotRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  hotspotInfo: {
    flex: 1,
  },
  hotspotLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  hotspotCount: {
    fontSize: 12,
    color: '#666',
  },
  hotspotBar: {
    position: 'absolute',
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  incidentsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  incidentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  incidentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  incidentSpecies: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  incidentLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  incidentDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  incidentDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  incidentReporter: {
    fontSize: 12,
    color: '#999',
  },
  // AI Insights Styles
  aiInsightsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  aiInsightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  insightItem: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  confidenceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  insightDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  insightRecommendation: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  // Predictions Styles
  predictionsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  predictionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  predictionsSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  predictionItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  predictionLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  riskMeter: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  riskFill: {
    height: '100%',
    borderRadius: 3,
  },
  predictionScore: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  predictionRecommendation: {
    fontSize: 12,
    color: '#9C27B0',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  factorsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  factorsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  factorText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  // Risk Analysis Styles
  riskAnalysisCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  riskAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  riskStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  riskStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  riskStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  // Full AI Insights Styles
  allInsightsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  allInsightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  fullInsightItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  insightPriorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityIndicator: {
    backgroundColor: '#607D8B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  insightType: {
    fontSize: 11,
    color: '#9E9E9E',
    fontStyle: 'italic',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  insightMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confidenceIndicator: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#757575',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    marginTop: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PoachingAnalyticsScreen;
