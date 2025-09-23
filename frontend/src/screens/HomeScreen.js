import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ApiService from '../services/ApiService';

const HomeScreen = ({ navigation }) => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    try {
      setLoading(true);
      const animalsData = await ApiService.fetchAnimals();
      setAnimals(animalsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load animals data');
      console.error('Error loading animals:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnimals();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Critically Endangered':
        return '#F44336';
      case 'Endangered':
        return '#FF9800';
      case 'Vulnerable':
        return '#FF5722';
      case 'Near Threatened':
        return '#FFC107';
      default:
        return '#4CAF50';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading forest data...</Text>
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
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌲 Forest Animals Monitor</Text>
          <Text style={styles.headerSubtitle}>
            Tracking {animals.length} species across various forest locations
          </Text>
        </View>

        {/* Analyst Button */}
        <TouchableOpacity
          style={styles.analystButton}
          onPress={() => navigation.navigate('Analyst')}>
          <Text style={styles.analystButtonText}>📊 View Analytics Dashboard</Text>
        </TouchableOpacity>

        {/* Animals List */}
        <View style={styles.animalsContainer}>
          <Text style={styles.sectionTitle}>Animals in Our Database</Text>
          
          {animals.map((animal, index) => (
            <TouchableOpacity
              key={animal.id || index}
              style={styles.animalCard}
              onPress={() => navigation.navigate('AnimalDetails', { animal })}>
              
              <View style={styles.animalHeader}>
                <Text style={styles.animalName}>{animal.name}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(animal.status) }
                ]}>
                  <Text style={styles.statusText}>{animal.status}</Text>
                </View>
              </View>
              
              <View style={styles.animalDetails}>
                <Text style={styles.detailText}>📍 {animal.location}</Text>
                <Text style={styles.detailText}>🦁 Count: {animal.count}</Text>
                <Text style={styles.detailText}>🏞️ {animal.habitat}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Quick Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{animals.length}</Text>
              <Text style={styles.summaryLabel}>Species</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {animals.reduce((sum, animal) => sum + (animal.count || 0), 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Count</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {new Set(animals.map(animal => animal.location)).size}
              </Text>
              <Text style={styles.summaryLabel}>Locations</Text>
            </View>
          </View>
        </View>
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
  analystButton: {
    backgroundColor: '#2196F3',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  analystButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  animalsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  animalCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  animalDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  summarySection: {
    padding: 20,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default HomeScreen;