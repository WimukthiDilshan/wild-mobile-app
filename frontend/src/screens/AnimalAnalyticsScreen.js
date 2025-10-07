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
  TextInput,
  FlatList,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import ApiService from '../services/ApiService';
import AIAnalyticsService from '../services/AIAnalyticsService';

// Scientific Names Mapping for Wildlife Species
const SPECIES_SCIENTIFIC_NAMES = {
  'Tiger': 'Panthera tigris',
  'Elephant': 'Elephas maximus',
  'Leopard': 'Panthera pardus',
  'Orangutan': 'Pongo pygmaeus',
  'Rhinoceros': 'Rhinoceros unicornis',
  'Giant Panda': 'Ailuropoda melanoleuca',
  'Polar Bear': 'Ursus maritimus',
  'Mountain Gorilla': 'Gorilla beringei beringei',
  'Snow Leopard': 'Panthera uncia',
  'Chimpanzee': 'Pan troglodytes',
  'Wolf': 'Canis lupus',
  'Lion': 'Panthera leo',
  'Giraffe': 'Giraffa camelopardalis',
  'Zebra': 'Equus quagga',
  'Cheetah': 'Acinonyx jubatus',
  'Jaguar': 'Panthera onca',
  'Hippopotamus': 'Hippopotamus amphibius',
  'Crocodile': 'Crocodylus niloticus',
  'Koala': 'Phascolarctos cinereus',
  'Kangaroo': 'Macropus giganteus'
};

// Helper function to get scientific name
const getScientificName = (commonName) => {
  return SPECIES_SCIENTIFIC_NAMES[commonName] || 'Species not classified';
};

const screenWidth = Dimensions.get('window').width;

const AnimalAnalyticsScreen = ({ route, navigation }) => {
  const { animal } = route.params;
  const [analytics, setAnalytics] = useState(null);
  const [allAnimals, setAllAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // Temporarily set to search for testing
  const [populationPredictions, setPopulationPredictions] = useState([]);
  const [conservationInsights, setConservationInsights] = useState([]);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, animalsData] = await Promise.all([
        ApiService.fetchAnalytics(),
        ApiService.fetchAnimals()
      ]);
      setAnalytics(analyticsData);
      setAllAnimals(animalsData);
      
      // Generate AI predictions for population trends
      if (animalsData && animalsData.length > 0) {
        const predictions = AIAnalyticsService.predictPopulationTrends(animalsData);
        const insights = AIAnalyticsService.generateSmartInsights([], animalsData);
        
        setPopulationPredictions(predictions);
        setConservationInsights(insights);
      }
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set dummy data for display
      setAnalytics({
        totalAnimals: 0,
        locationStats: {},
        statusStats: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Critically Endangered': return '#F44336';
      case 'Endangered': return '#FF9800';
      case 'Vulnerable': return '#FF5722';
      case 'Near Threatened': return '#FFC107';
      default: return '#4CAF50';
    }
  };

  const getSpeciesComparison = () => {
    if (!allAnimals.length) return [];
    
    const sameSpecies = allAnimals.filter(a => a.name === animal.name);
    const sameLocation = allAnimals.filter(a => a.location === animal.location);
    const sameStatus = allAnimals.filter(a => a.status === animal.status);
    
    return {
      sameSpecies: sameSpecies.length,
      sameLocation: sameLocation.length,
      sameStatus: sameStatus.length,
      totalSpecies: allAnimals.length
    };
  };

  const getLocationDistribution = () => {
    if (!allAnimals.length) return [];
    
    const locationCounts = allAnimals.reduce((acc, animal) => {
      acc[animal.location] = (acc[animal.location] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(locationCounts)
      .map(([location, count]) => ({
        name: location.slice(0, 10) + (location.length > 10 ? '...' : ''),
        count,
        color: location === animal.location ? '#4CAF50' : '#E0E0E0',
        legendFontColor: '#333',
        legendFontSize: 12
      }));
  };

  const getPopulationChart = () => {
    if (!allAnimals.length) return null;

    const speciesData = allAnimals.reduce((acc, a) => {
      if (!acc[a.name]) {
        acc[a.name] = { count: 0, locations: new Set() };
      }
      acc[a.name].count += a.count;
      acc[a.name].locations.add(a.location);
      return acc;
    }, {});

    const chartData = Object.entries(speciesData)
      .slice(0, 5)
      .map(([name, data]) => ({
        name: name.slice(0, 8),
        count: data.count,
        isCurrentAnimal: name === animal.name
      }));

    return {
      labels: chartData.map(d => d.name),
      datasets: [{
        data: chartData.map(d => d.count),
        colors: chartData.map(d => 
          d.isCurrentAnimal 
            ? (opacity = 1) => '#4CAF50'
            : (opacity = 1) => '#E0E0E0'
        )
      }]
    };
  };

  const renderOverview = () => {
    const comparison = getSpeciesComparison();
    
    return (
      <View>
        {/* Animal Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>🦁 {animal.name} Analysis</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Scientific Name:</Text>
            <Text style={[styles.summaryValue, { fontStyle: 'italic', color: '#666' }]}>
              {getScientificName(animal.name)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Population:</Text>
            <Text style={styles.summaryValue}>{animal.count} individuals</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Conservation Status:</Text>
            <Text style={[styles.summaryValue, { color: getStatusColor(animal.status) }]}>
              {animal.status}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Habitat Type:</Text>
            <Text style={styles.summaryValue}>{animal.habitat}</Text>
          </View>
        </View>

        {/* Comparison Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{comparison.sameLocation}</Text>
            <Text style={styles.statLabel}>Species in {'\n'}Same Location</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{comparison.sameStatus}</Text>
            <Text style={styles.statLabel}>Same Status{'\n'}Category</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{comparison.totalSpecies}</Text>
            <Text style={styles.statLabel}>Total Species{'\n'}Monitored</Text>
          </View>
        </View>

        {/* Risk Assessment */}
        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentTitle}>📊 Risk Assessment</Text>
          <View style={styles.riskIndicator}>
            <View style={[styles.riskBar, { backgroundColor: getStatusColor(animal.status) }]} />
            <Text style={styles.riskText}>{animal.status}</Text>
          </View>
          <Text style={styles.assessmentText}>
            Based on current population count of {animal.count} individuals and conservation status, 
            this species requires {animal.status.includes('Endangered') ? 'immediate' : 'ongoing'} monitoring attention.
          </Text>
        </View>

        {/* Habitat Info */}
        <View style={styles.habitatCard}>
          <Text style={styles.habitatTitle}>🌿 Habitat Analysis</Text>
          <Text style={styles.habitatText}>
            <Text style={styles.habitatLabel}>Primary Habitat: </Text>
            {animal.habitat}
          </Text>
          <Text style={styles.habitatText}>
            <Text style={styles.habitatLabel}>Location: </Text>
            {animal.location}
          </Text>
          <Text style={styles.habitatDescription}>
            This habitat type supports the species' survival needs including feeding, breeding, and shelter requirements.
          </Text>
        </View>
      </View>
    );
  };

  const renderCharts = () => {
    const locationData = getLocationDistribution();
    const populationData = getPopulationChart();

    return (
      <View>
        {/* Location Distribution */}
        {locationData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>📍 Species Distribution by Location</Text>
            <PieChart
              data={locationData}
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
          </View>
        )}

        {/* Population Comparison */}
        {populationData && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>📊 Population Comparison</Text>
            <BarChart
              data={populationData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForLabels: {
                  fontSize: 12
                }
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
            <Text style={styles.chartNote}>
              Green bar represents current species ({animal.name})
            </Text>
          </View>
        )}

        {/* Trends */}
        <View style={styles.trendsCard}>
          <Text style={styles.trendsTitle}>📈 Population Trends</Text>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Current Count:</Text>
            <Text style={styles.trendValue}>{animal.count} individuals</Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Density per Location:</Text>
            <Text style={styles.trendValue}>
              {(animal.count / getSpeciesComparison().sameLocation || 1).toFixed(1)} avg
            </Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Status Priority:</Text>
            <Text style={[styles.trendValue, { color: getStatusColor(animal.status) }]}>
              {animal.status.includes('Endangered') ? 'High' : 'Medium'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = allAnimals.filter(animal => {
      const matchesQuery = 
        animal.name.toLowerCase().includes(query.toLowerCase()) ||
        animal.location.toLowerCase().includes(query.toLowerCase()) ||
        animal.status.toLowerCase().includes(query.toLowerCase());

      if (selectedFilter === 'all') return matchesQuery;
      if (selectedFilter === 'endangered') {
        return matchesQuery && (animal.status.includes('Endangered') || animal.status.includes('Critically'));
      }
      if (selectedFilter === 'location') {
        return matchesQuery && animal.location === animal.location;
      }
      return matchesQuery;
    });

    setSearchResults(filtered);
  };

  const renderSearchResults = () => {
    return (
      <View style={styles.searchContainer}>
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <Text style={styles.searchTitle}>🔍 Wildlife Search</Text>
          <Text style={styles.searchSubtitle}>Find animals by name, location, or status</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search animals... (e.g., Tiger, Forest, Endangered)"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: '🌍 All Animals', icon: '🌍' },
              { key: 'endangered', label: '⚠️ Endangered', icon: '⚠️' },
              { key: 'location', label: '📍 By Location', icon: '📍' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.key && styles.activeFilterButton
                ]}
                onPress={() => {
                  setSelectedFilter(filter.key);
                  handleSearch(searchQuery);
                }}>
                <Text style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key && styles.activeFilterButtonText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Results */}
        {searchQuery ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsHeader}>
              🎯 Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </Text>
            
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                renderItem={({ item, index }) => (
                  <TouchableOpacity 
                    style={styles.resultCard}
                    onPress={() => navigation.navigate('AnimalDetails', { animal: item })}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusBadgeText}>
                          {item.status.replace('Critically ', 'Crit. ')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.resultDetails}>
                      <Text style={styles.resultLocation}>📍 {item.location}</Text>
                      <Text style={styles.resultCount}>👥 {item.count} individuals</Text>
                    </View>
                    <Text style={styles.resultDescription}>{item.description}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsIcon}>🔎</Text>
                <Text style={styles.noResultsText}>No animals found</Text>
                <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.searchTipsContainer}>
            <Text style={styles.searchTipsTitle}>💡 Search Tips</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>🐅</Text>
              <Text style={styles.tipText}>Search by species name (e.g., "Tiger", "Elephant")</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>📍</Text>
              <Text style={styles.tipText}>Search by location (e.g., "Forest", "Savanna")</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>⚠️</Text>
              <Text style={styles.tipText}>Search by status (e.g., "Endangered", "Vulnerable")</Text>
            </View>
            
            <View style={styles.quickStatsContainer}>
              <Text style={styles.quickStatsTitle}>📊 Quick Stats</Text>
              <View style={styles.quickStatsGrid}>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatNumber}>{allAnimals.length}</Text>
                  <Text style={styles.quickStatLabel}>Total Animals</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatNumber}>
                    {new Set(allAnimals.map(a => a.location)).size}
                  </Text>
                  <Text style={styles.quickStatLabel}>Locations</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatNumber}>
                    {allAnimals.filter(a => a.status.includes('Endangered')).length}
                  </Text>
                  <Text style={styles.quickStatLabel}>Endangered</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAITrends = () => {
    return (
      <View>
        {/* Population Predictions */}
        <View style={styles.aiPredictionsCard}>
          <Text style={styles.aiPredictionsTitle}>🔮 AI Population Predictions</Text>
          <Text style={styles.aiPredictionsSubtitle}>Trend analysis for next 6 months</Text>
          
          {populationPredictions.length > 0 ? (
            populationPredictions.slice(0, 5).map((prediction, index) => (
              <View key={index} style={styles.predictionSpeciesItem}>
                <View style={styles.speciesHeader}>
                  <Text style={styles.speciesName}>🦁 {prediction.species}</Text>
                  <View style={[styles.trendBadge, { 
                    backgroundColor: prediction.predictedChange >= 0 ? '#4CAF50' : '#F44336'
                  }]}>
                    <Text style={styles.trendText}>
                      {prediction.predictedChange >= 0 ? '↗️ GROWTH' : '↘️ DECLINE'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.populationStats}>
                  <View style={styles.populationStat}>
                    <Text style={styles.populationNumber}>{prediction.currentPopulation}</Text>
                    <Text style={styles.populationLabel}>Current</Text>
                  </View>
                  <View style={styles.predictionArrow}>
                    <Text style={styles.arrowText}>
                      {prediction.predictedChange >= 0 ? '📈' : '📉'}
                    </Text>
                  </View>
                  <View style={styles.populationStat}>
                    <Text style={[styles.populationNumber, {
                      color: prediction.predictedChange >= 0 ? '#4CAF50' : '#F44336'
                    }]}>
                      {Math.round(prediction.currentPopulation + prediction.predictedChange)}
                    </Text>
                    <Text style={styles.populationLabel}>Predicted</Text>
                  </View>
                </View>
                
                <View style={styles.riskAssessment}>
                  <View style={styles.riskIndicator}>
                    <Text style={styles.riskLabel}>Conservation Risk:</Text>
                    <View style={[styles.riskLevelBadge, {
                      backgroundColor: prediction.riskLevel >= 7 ? '#F44336' :
                                     prediction.riskLevel >= 4 ? '#FF9800' : '#4CAF50'
                    }]}>
                      <Text style={styles.riskLevelText}>
                        {prediction.riskLevel >= 7 ? 'HIGH' :
                         prediction.riskLevel >= 4 ? 'MEDIUM' : 'LOW'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.confidenceText}>
                    Confidence: {Math.round(prediction.confidence * 100)}%
                  </Text>
                </View>
                
                {prediction.recommendations && prediction.recommendations.length > 0 && (
                  <View style={styles.recommendationsContainer}>
                    <Text style={styles.recommendationsTitle}>💡 AI Recommendations:</Text>
                    {prediction.recommendations.slice(0, 2).map((rec, recIndex) => (
                      <Text key={recIndex} style={styles.recommendationText}>
                        • {rec}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataIcon}>🤖</Text>
              <Text style={styles.noDataText}>AI Analysis In Progress</Text>
              <Text style={styles.noDataSubtext}>More data needed for accurate predictions</Text>
            </View>
          )}
        </View>

        {/* Conservation Insights */}
        {conservationInsights.length > 0 && (
          <View style={styles.conservationInsightsCard}>
            <Text style={styles.conservationInsightsTitle}>🧠 AI Conservation Insights</Text>
            
            {conservationInsights.map((insight, index) => (
              <View key={index} style={[styles.conservationInsightItem, {
                borderLeftColor: insight.priority >= 8 ? '#F44336' :
                               insight.priority >= 6 ? '#FF9800' : '#4CAF50'
              }]}>
                <View style={styles.insightHeaderRow}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>P{insight.priority}</Text>
                  </View>
                </View>
                
                <Text style={styles.insightDescription}>{insight.description}</Text>
                <Text style={styles.insightRecommendation}>
                  💡 {insight.recommendation}
                </Text>
                
                <View style={styles.insightFooter}>
                  <Text style={styles.insightType}>{insight.type}</Text>
                  <Text style={styles.insightConfidence}>
                    {Math.round(insight.confidence * 100)}% confidence
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* AI Summary */}
        <View style={styles.aiSummaryCard}>
          <Text style={styles.aiSummaryTitle}>📋 AI Analysis Summary</Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>
                {populationPredictions.filter(p => p.predictedChange < 0).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Species at{'\n'}Risk</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>
                {populationPredictions.filter(p => p.riskLevel >= 7).length}
              </Text>
              <Text style={styles.summaryStatLabel}>High Risk{'\n'}Species</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>
                {conservationInsights.filter(i => i.priority >= 8).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Critical{'\n'}Insights</Text>
            </View>
          </View>
          
          <View style={styles.overallAssessment}>
            <Text style={styles.assessmentTitle}>🎯 Overall Assessment</Text>
            <Text style={styles.assessmentText}>
              {populationPredictions.filter(p => p.predictedChange < 0).length > 
               populationPredictions.filter(p => p.predictedChange >= 0).length
                ? '⚠️ Conservation action needed - declining populations detected'
                : '✅ Population trends looking stable - continue monitoring'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading {animal.name} analytics...</Text>
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
          <Text style={styles.headerTitle}>📊 {animal.name} Analytics</Text>
          <Text style={styles.headerSubtitle}>Detailed analysis and insights</Text>
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
            style={[styles.tab, activeTab === 'charts' && styles.activeTab]}
            onPress={() => setActiveTab('charts')}>
            <Text style={[styles.tabText, activeTab === 'charts' && styles.activeTabText]}>
              Charts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}>
            <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
              Search
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ai-trends' && styles.activeTab]}
            onPress={() => setActiveTab('ai-trends')}>
            <Text style={[styles.tabText, activeTab === 'ai-trends' && styles.activeTabText]}>
              AI Trends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'charts' && renderCharts()}
          {activeTab === 'search' && renderSearchResults()}
          {activeTab === 'ai-trends' && renderAITrends()}
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back to Animal Details</Text>
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
    backgroundColor: '#4CAF50',
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
  tabScrollContainer: {
    marginHorizontal: 15,
    marginTop: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginTop: 20,
    borderRadius: 12,
    padding: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 1,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  assessmentCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  assessmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  riskBar: {
    width: 60,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  riskText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  assessmentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  habitatCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  habitatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  habitatText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  habitatLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  habitatDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
    fontStyle: 'italic',
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
  chartNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  trendsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trendLabel: {
    fontSize: 14,
    color: '#666',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
  // Search Styles
  searchContainer: {
    flex: 1,
  },
  searchHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  searchInputContainer: {
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: {
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderRadius: 12,
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  resultCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLocation: {
    fontSize: 14,
    color: '#666',
  },
  resultCount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  searchTipsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  searchTipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipBullet: {
    fontSize: 16,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  quickStatsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  quickStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // AI Trends Styles
  aiPredictionsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  aiPredictionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  aiPredictionsSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  predictionSpeciesItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  populationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  populationStat: {
    alignItems: 'center',
    flex: 1,
  },
  populationNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  populationLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  predictionArrow: {
    paddingHorizontal: 15,
  },
  arrowText: {
    fontSize: 24,
  },
  riskAssessment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  riskLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  riskLevelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  recommendationsContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  // Conservation Insights Styles
  conservationInsightsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  conservationInsightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  conservationInsightItem: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    backgroundColor: '#607D8B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  // AI Summary Styles
  aiSummaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
  },
  aiSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  overallAssessment: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  assessmentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  assessmentText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default AnimalAnalyticsScreen;
