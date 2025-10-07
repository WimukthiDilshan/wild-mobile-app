import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Share,
  TextInput,
  FlatList,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import RNFS from 'react-native-fs';
import { BarChart, PieChart } from 'react-native-chart-kit';
import ApiService from '../services/ApiService';
import { useAuth } from '../contexts/AuthContext';

const screenWidth = Dimensions.get('window').width;

const AnalystScreen = ({ navigation }) => {
  const { user, rolePermissions } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [poachingIncidents, setPoachingIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportLoading, setExportLoading] = useState(false);

  // Check if user has permission to view analytics
  if (!rolePermissions?.canViewAnalytics) {
    return (
      <View style={styles.permissionDenied}>
        <Text style={styles.permissionTitle}>🚫 Access Denied</Text>
        <Text style={styles.permissionText}>
          Your role ({user?.role}) doesn't have permission to view analytics.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Auto-search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timer);
  }, [searchQuery, selectedFilter]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, animalsData, incidentsData] = await Promise.all([
        ApiService.fetchAnalytics(),
        ApiService.fetchAnimals(),
        ApiService.fetchPoachingIncidents()
      ]);
      setAnalytics(analyticsData);
      setAnimals(animalsData);
      setPoachingIncidents(incidentsData || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics data');
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getLocationChartData = () => {
    if (!analytics?.locationStats) return null;

    const locations = Object.keys(analytics.locationStats);
    const counts = Object.values(analytics.locationStats).map(stat => stat.count);

    return {
      labels: locations.map(loc => loc.length > 10 ? loc.substring(0, 10) + '...' : loc),
      datasets: [{
        data: counts,
      }],
    };
  };

  const getSpeciesPieData = () => {
    if (!analytics?.speciesStats) return [];

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    return Object.entries(analytics.speciesStats)
      .slice(0, 6) // Show top 6 species
      .map(([species, data], index) => ({
        name: species,
        population: data.count,
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load analytics data</Text>
      </View>
    );
  }

  const locationChartData = getLocationChartData();
  const speciesPieData = getSpeciesPieData();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Critically Endangered': return '#F44336';
      case 'Endangered': return '#FF9800';
      case 'Vulnerable': return '#FF5722';
      case 'Near Threatened': return '#FFC107';
      default: return '#4CAF50';
    }
  };

  const generateExcelData = () => {
    // Create properly formatted CSV data for Excel
    const headers = ['Animal Name', 'Species Count', 'Location', 'Habitat', 'Conservation Status', 'Date Added', 'Added By'];
    
    // Function to properly escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '""';
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };
    
    const csvRows = [
      // Add BOM for proper UTF-8 encoding in Excel
      '\uFEFF' + headers.map(escapeCSV).join(','),
      ...animals.map(animal => [
        animal.name || 'Unknown',
        animal.count || 0,
        animal.location || 'Unknown Location',
        animal.habitat || 'Unknown Habitat',
        animal.status || 'Not Evaluated',
        animal.addedAt ? new Date(animal.addedAt).toLocaleDateString() : new Date().toLocaleDateString(),
        animal.addedBy || 'Unknown User'
      ].map(escapeCSV).join(','))
    ];
    
    return csvRows.join('\n');
  };

  const generateAnalyticsExcelData = () => {
    // Function to properly escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '""';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };
    
    // Create comprehensive analytics CSV with proper formatting
    const summarySection = [
      '\uFEFF' + ['Metric', 'Value', 'Details'].map(escapeCSV).join(','),
      [
        'Total Species',
        analytics?.summary?.totalSpecies || 0,
        'Number of different species monitored'
      ].map(escapeCSV).join(','),
      [
        'Total Animals',
        analytics?.summary?.totalCount || 0,
        'Total individual animals tracked'
      ].map(escapeCSV).join(','),
      [
        'Locations',
        analytics?.summary?.locationsCount || 0,
        'Number of monitoring locations'
      ].map(escapeCSV).join(','),
      '',
      ['Location Statistics', '', ''].map(escapeCSV).join(','),
      ['Location Name', 'Animal Count', 'Species Count'].map(escapeCSV).join(',')
    ];

    const locationSection = analytics?.locationStats
      ? Object.entries(analytics.locationStats).map(([location, stats]) => 
          [location, stats.count || 0, stats.animals || 0].map(escapeCSV).join(',')
        )
      : [];

    const speciesHeader = [
      '',
      ['Species Statistics', '', ''].map(escapeCSV).join(','),
      ['Species Name', 'Total Count', 'Locations Found'].map(escapeCSV).join(',')
    ];

    const speciesSection = analytics?.speciesStats
      ? Object.entries(analytics.speciesStats).map(([species, data]) => 
          [
            species, 
            data.count || 0, 
            data.locations?.join('; ') || 'Unknown'
          ].map(escapeCSV).join(',')
        )
      : [];

    return [
      ...summarySection,
      ...locationSection,
      ...speciesHeader,
      ...speciesSection
    ].join('\n');
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to download Excel files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleDownloadExcel = async (type = 'animals') => {
    if (exportLoading) return; // Prevent multiple simultaneous downloads
    
    try {
      setExportLoading(true);
      
      // Request storage permission
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Storage permission is required to download files.');
        return;
      }
      
      const csvData = type === 'animals' ? generateExcelData() : generateAnalyticsExcelData();
      const fileName = type === 'animals' 
        ? `forest_animals_data_${new Date().toISOString().split('T')[0]}.csv`
        : `forest_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Define the file path
      const downloadPath = Platform.OS === 'ios' 
        ? RNFS.DocumentDirectoryPath 
        : RNFS.DownloadDirectoryPath;
      
      const filePath = `${downloadPath}/${fileName}`;
      
      // Write the CSV data to file
      await RNFS.writeFile(filePath, csvData, 'utf8');
      
      Alert.alert(
        '✅ Download Complete!',
        `Your ${type === 'animals' ? 'animals' : 'analytics'} data has been saved to:\n\n📁 ${Platform.OS === 'ios' ? 'Files App' : 'Downloads'}\n📄 ${fileName}\n\nYou can open it with Excel, Google Sheets, or any spreadsheet app.`,
        [
          {
            text: 'Share File',
            onPress: async () => {
              try {
                await Share.share({
                  url: Platform.OS === 'ios' ? `file://${filePath}` : filePath,
                  title: `Forest ${type === 'animals' ? 'Animals' : 'Analytics'} Data`,
                  message: `Forest wildlife data exported on ${new Date().toLocaleDateString()}`,
                });
              } catch (shareError) {
                console.log('Share error:', shareError);
              }
            }
          },
          { 
            text: 'Done', 
            style: 'default' 
          }
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Error', 
        `Failed to download Excel file: ${error.message}\n\nTrying alternative method...`,
        [
          {
            text: 'Try Share Instead',
            onPress: async () => {
              try {
                const csvData = type === 'animals' ? generateExcelData() : generateAnalyticsExcelData();
                const fileName = type === 'animals' 
                  ? `forest_animals_data_${new Date().toISOString().split('T')[0]}.csv`
                  : `forest_analytics_${new Date().toISOString().split('T')[0]}.csv`;
                
                await Share.share({
                  message: `📊 ${fileName}\n\n${csvData}`,
                  title: `Forest ${type === 'animals' ? 'Animals' : 'Analytics'} Data Export`,
                });
              } catch (shareError) {
                Alert.alert('Error', 'Unable to export data. Please try again.');
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setExportLoading(false);
    }
  };

  const renderOverview = () => (
    <View>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>📊 Forest Analytics Overview</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{analytics.summary.totalSpecies}</Text>
            <Text style={styles.summaryLabel}>Total Species</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{analytics.summary.totalCount}</Text>
            <Text style={styles.summaryLabel}>Total Animals</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{analytics.summary.locationsCount}</Text>
            <Text style={styles.summaryLabel}>Locations</Text>
          </View>
        </View>
      </View>

      {/* Creative Excel Export Section */}
      <View style={styles.exportContainer}>
        <Text style={styles.exportTitle}>📊 Export Data to Excel</Text>
        <Text style={styles.exportSubtitle}>Download comprehensive reports for analysis</Text>
        
        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={[styles.exportButton, exportLoading && styles.exportButtonDisabled]}
            onPress={() => handleDownloadExcel('analytics')}
            disabled={exportLoading}
            activeOpacity={0.8}>
            <View style={styles.exportIcon}>
              <Text style={styles.exportIconText}>📈</Text>
            </View>
            <View style={styles.exportContent}>
              <Text style={styles.exportButtonTitle}>Analytics Report</Text>
              <Text style={styles.exportButtonSubtitle}>
                {exportLoading ? 'Creating file...' : 'Complete analytics with charts data'}
              </Text>
            </View>
            <View style={styles.downloadArrow}>
              {exportLoading ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Text style={styles.downloadArrowText}>⬇️</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButton, exportLoading && styles.exportButtonDisabled]}
            onPress={() => handleDownloadExcel('animals')}
            disabled={exportLoading}
            activeOpacity={0.8}>
            <View style={styles.exportIcon}>
              <Text style={styles.exportIconText}>🦁</Text>
            </View>
            <View style={styles.exportContent}>
              <Text style={styles.exportButtonTitle}>Animals Data</Text>
              <Text style={styles.exportButtonSubtitle}>
                {exportLoading ? 'Creating file...' : 'Individual animal records & details'}
              </Text>
            </View>
            <View style={styles.downloadArrow}>
              {exportLoading ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Text style={styles.downloadArrowText}>⬇️</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.exportInfo}>
          <Text style={styles.exportInfoText}>
            💡 Tip: Data exports as CSV format compatible with Excel, Google Sheets, and other spreadsheet applications.
          </Text>
        </View>
      </View>

      {/* Location Distribution Chart */}
      {locationChartData && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>🌍 Animals by Location</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={locationChartData}
                width={Math.max(screenWidth - 40, locationChartData.labels.length * 60)}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                verticalLabelRotation={45}
                showValuesOnTopOfBars={true}
              />
            </ScrollView>
          </View>
        )}

        {/* Species Distribution Pie Chart */}
        {speciesPieData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>🦁 Top Species Distribution</Text>
            <PieChart
              data={speciesPieData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}

        {/* Location Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>📍 Location Breakdown</Text>
          {Object.entries(analytics.locationStats).map(([location, stats]) => (
            <View key={location} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>{location}</Text>
                <View style={styles.locationStats}>
                  <Text style={styles.statText}>{stats.animals} species</Text>
                  <Text style={styles.statText}>{stats.count} animals</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(stats.count / analytics.summary.totalCount) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Species Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>🦌 Species Information</Text>
          {Object.entries(analytics.speciesStats)
            .sort(([,a], [,b]) => b.count - a.count)
            .map(([species, data]) => (
            <View key={species} style={styles.speciesCard}>
              <View style={styles.speciesHeader}>
                <Text style={styles.speciesName}>{species}</Text>
                <Text style={styles.speciesCount}>{data.count} individuals</Text>
              </View>
              <Text style={styles.speciesLocations}>
                Found in: {data.locations.join(', ')}
              </Text>
            </View>
          ))}
        </View>

        {/* Last Updated */}
        <View style={styles.footerContainer}>
          <Text style={styles.lastUpdated}>
            Last updated: {new Date(analytics.lastUpdated).toLocaleDateString()} at{' '}
            {new Date(analytics.lastUpdated).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );

  const renderAnimalsData = () => (
    <View>
      {/* Animals Overview Header */}
      <View style={styles.animalsHeader}>
        <Text style={styles.sectionTitle}>🦁 Individual Animals Directory</Text>
        <Text style={styles.animalsSubtitle}>
          Detailed information for each monitored animal species
        </Text>
        <View style={styles.animalsSummary}>
          <Text style={styles.summaryText}>
            📊 {animals.length} species monitored • {analytics.summary.totalCount} total animals
          </Text>
        </View>
        
        {/* Quick Export Button for Animals Tab */}
        <TouchableOpacity
          style={[styles.quickExportButton, exportLoading && styles.exportButtonDisabled]}
          onPress={() => handleDownloadExcel('animals')}
          disabled={exportLoading}
          activeOpacity={0.8}>
          {exportLoading ? (
            <>
              <ActivityIndicator size="small" color="white" style={{marginRight: 8}} />
              <Text style={styles.quickExportText}>Creating File...</Text>
            </>
          ) : (
            <>
              <Text style={styles.quickExportIcon}>📑</Text>
              <Text style={styles.quickExportText}>Download Animals Excel</Text>
              <Text style={styles.quickExportArrow}>⬇️</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Animals Grid */}
      <View style={styles.animalsGrid}>
        {animals.map((animal, index) => (
          <TouchableOpacity
            key={index}
            style={styles.animalCard}
            onPress={() => navigation.navigate('AnimalDetails', { animal })}
            activeOpacity={0.8}>
            
            {/* Animal Card Header */}
            <View style={styles.animalCardHeader}>
              <View style={styles.animalInfo}>
                <Text style={styles.animalName}>🦁 {animal.name}</Text>
                <Text style={styles.animalLocation}>📍 {animal.location}</Text>
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(animal.status) }]}>
                <Text style={styles.statusDot}>•</Text>
              </View>
            </View>

            {/* Count & Status */}
            <View style={styles.animalStats}>
              <View style={styles.countDisplay}>
                <Text style={styles.countNumber}>{animal.count}</Text>
                <Text style={styles.countLabel}>individuals</Text>
              </View>
              <View style={styles.statusInfo}>
                <Text style={[styles.statusText, { color: getStatusColor(animal.status) }]}>
                  {animal.status === 'Critically Endangered' ? 'Critical' :
                   animal.status === 'Endangered' ? 'Endangered' :
                   animal.status === 'Vulnerable' ? 'Vulnerable' :
                   animal.status === 'Near Threatened' ? 'Watch' : 'Stable'}
                </Text>
              </View>
            </View>

            {/* Habitat Info */}
            <View style={styles.habitatInfo}>
              <Text style={styles.habitatText}>🌿 {animal.habitat}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { 
                    width: `${Math.min((animal.count / 50) * 100, 100)}%`,
                    backgroundColor: getStatusColor(animal.status)
                  }]} 
                />
              </View>
              <Text style={styles.progressText}>Population Health</Text>
            </View>

            {/* View Details Button */}
            <View style={styles.cardActions}>
              <View style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>👁️ View Details</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Species Stats */}
      <View style={styles.quickStats}>
        <Text style={styles.sectionTitle}>🔍 Quick Species Overview</Text>
        <View style={styles.statsRow}>
          {Object.entries(analytics.speciesStats || {})
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 4)
            .map(([species, data], index) => (
            <View key={species} style={styles.quickStatCard}>
              <Text style={styles.quickStatSpecies}>{species}</Text>
              <Text style={styles.quickStatCount}>{data.count}</Text>
              <Text style={styles.quickStatLabel}>total</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // Search Functions
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    let results = [];

    // Search through animals
    animals.forEach(animal => {
      if (
        (animal.name && animal.name.toLowerCase().includes(query)) ||
        (animal.location && animal.location.toLowerCase().includes(query)) ||
        (animal.habitat && animal.habitat.toLowerCase().includes(query)) ||
        (animal.status && animal.status.toLowerCase().includes(query))
      ) {
        results.push({
          type: 'animal',
          id: animal.name || 'unknown',
          title: animal.name || 'Unknown Animal',
          subtitle: `${animal.location || 'Unknown'} • ${animal.status || 'Unknown'}`,
          data: animal,
          icon: '🦁'
        });
      }
    });

    // Search through poaching incidents
    poachingIncidents.forEach(incident => {
      if (
        (incident.location && incident.location.toLowerCase().includes(query)) ||
        (incident.animalType && incident.animalType.toLowerCase().includes(query)) ||
        (incident.severity && incident.severity.toLowerCase().includes(query)) ||
        (incident.description && incident.description.toLowerCase().includes(query))
      ) {
        results.push({
          type: 'incident',
          id: incident.id || Math.random().toString(),
          title: `${incident.animalType || 'Unknown'} Incident`,
          subtitle: `${incident.location || 'Unknown'} • ${incident.severity || 'Unknown'}`,
          data: incident,
          icon: '🚨'
        });
      }
    });

    // Apply filters
    if (selectedFilter === 'animals') {
      results = results.filter(item => item.type === 'animal');
    } else if (selectedFilter === 'incidents') {
      results = results.filter(item => item.type === 'incident');
    } else if (selectedFilter === 'endangered') {
      results = results.filter(item => 
        item.type === 'animal' && 
        item.data && item.data.status &&
        (item.data.status === 'Critically Endangered' || item.data.status === 'Endangered')
      );
    } else if (selectedFilter === 'critical') {
      results = results.filter(item => 
        item.type === 'incident' && item.data && item.data.severity === 'Critical'
      );
    }

    setSearchResults(results);
  };

  const renderSearchResults = () => (
    <View style={styles.searchContainer}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <Text style={styles.searchTitle}>🔍 Search Forest Data</Text>
        <Text style={styles.searchSubtitle}>Find animals, incidents, and conservation data</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search animals, locations, incidents..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {[
          { id: 'all', label: '🌟 All', color: '#2E7D32' },
          { id: 'animals', label: '🦁 Animals', color: '#FF6B35' },
          { id: 'incidents', label: '🚨 Incidents', color: '#D32F2F' },
          { id: 'endangered', label: '⚠️ Endangered', color: '#F57C00' },
          { id: 'critical', label: '🔴 Critical', color: '#B71C1C' }
        ].map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              { backgroundColor: selectedFilter === filter.id ? filter.color : '#f0f0f0' }
            ]}
            onPress={() => {
              setSelectedFilter(filter.id);
              if (searchQuery.trim()) handleSearch();
            }}>
            <Text style={[
              styles.filterButtonText,
              { color: selectedFilter === filter.id ? 'white' : '#333' }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Results */}
      {searchQuery.trim() ? (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.resultsHeader}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </Text>
          
          <FlatList
            data={searchResults}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => {
                  if (item.type === 'animal') {
                    navigation.navigate('AnimalDetails', { animal: item.data });
                  }
                }}
                activeOpacity={0.7}>
                <View style={styles.resultIcon}>
                  <Text style={styles.resultIconText}>{item.icon}</Text>
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>{item.title}</Text>
                  <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                  {item.type === 'animal' && item.data && (
                    <Text style={styles.resultDetails}>
                      Count: {item.data.count || 'Unknown'} • Habitat: {item.data.habitat || 'Unknown'}
                    </Text>
                  )}
                  {item.type === 'incident' && item.data && (
                    <Text style={styles.resultDetails}>
                      Date: {item.data.date || 'Unknown'} • Status: {item.data.status || 'Unknown'}
                    </Text>
                  )}
                </View>
                <View style={styles.resultArrow}>
                  <Text style={styles.resultArrowText}>→</Text>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : (
        <View style={styles.searchTipsContainer}>
          <Text style={styles.searchTipsTitle}>🎯 Search Tips</Text>
          <View style={styles.searchTip}>
            <Text style={styles.searchTipIcon}>🦁</Text>
            <Text style={styles.searchTipText}>Search animal names: "Tiger", "Elephant"</Text>
          </View>
          <View style={styles.searchTip}>
            <Text style={styles.searchTipIcon}>📍</Text>
            <Text style={styles.searchTipText}>Find by location: "North Zone", "River Area"</Text>
          </View>
          <View style={styles.searchTip}>
            <Text style={styles.searchTipIcon}>🚨</Text>
            <Text style={styles.searchTipText}>Search incidents: "Poaching", "Critical"</Text>
          </View>
          <View style={styles.searchTip}>
            <Text style={styles.searchTipIcon}>🌿</Text>
            <Text style={styles.searchTipText}>Filter by habitat: "Rainforest", "Grassland"</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}>
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            📊 Analytics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'animals' && styles.activeTab]}
          onPress={() => setActiveTab('animals')}>
          <Text style={[styles.tabText, activeTab === 'animals' && styles.activeTabText]}>
            🦁 Animals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}>
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            🔍 Search
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional rendering based on active tab */}
      {activeTab === 'search' ? (
        // Search tab: Use View container instead of ScrollView to avoid FlatList nesting issue
        <View style={styles.contentContainer}>
          {renderSearchResults()}
        </View>
      ) : (
        // Other tabs: Use ScrollView with refresh control
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'animals' && renderAnimalsData()}

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.lastUpdated}>
              Last updated: {new Date().toLocaleDateString()} at{' '}
              {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
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
    backgroundColor: '#4CAF50',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  locationCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  locationStats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  speciesCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  speciesCount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  speciesLocations: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  footerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
    backgroundColor: '#F8F9FA',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  // Animals Directory Styles
  animalsHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  animalsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  animalsSummary: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  animalsGrid: {
    padding: 20,
    paddingTop: 10,
  },
  animalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  animalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  animalLocation: {
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  animalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countDisplay: {
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  countLabel: {
    fontSize: 12,
    color: '#666',
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  habitatInfo: {
    marginBottom: 12,
  },
  habitatText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  cardActions: {
    alignItems: 'center',
  },
  detailsButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  quickStats: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatCard: {
    backgroundColor: 'white',
    flex: 1,
    margin: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  quickStatSpecies: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickStatCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  // Excel Export Styles
  exportContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  exportSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  exportButtons: {
    gap: 12,
  },
  exportButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exportButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#F0F0F0',
  },
  exportIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exportIconText: {
    fontSize: 20,
  },
  exportContent: {
    flex: 1,
  },
  exportButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  exportButtonSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  downloadArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadArrowText: {
    fontSize: 16,
  },
  exportInfo: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  exportInfoText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Quick Export Button for Animals Tab
  quickExportButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  quickExportIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  quickExportText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  quickExportArrow: {
    fontSize: 16,
    marginLeft: 8,
  },
  
  // Search Styles
  searchContainer: {
    padding: 16,
  },
  searchHeader: {
    marginBottom: 20,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  searchInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 18,
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchResultsContainer: {
    marginTop: 8,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultIconText: {
    fontSize: 18,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  resultDetails: {
    fontSize: 12,
    color: '#888',
  },
  resultArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultArrowText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  searchTipsContainer: {
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  searchTipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
  },
  searchTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  searchTipIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  searchTipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default AnalystScreen;