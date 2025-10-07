import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import ApiService from '../services/ApiService';

const SafariStartScreen = ({ navigation }) => {
  const [parks, setParks] = useState([]);
  const [selectedPark, setSelectedPark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadActiveParks();
  }, []);

  const loadActiveParks = async () => {
    try {
      setLoading(true);
      const allParks = await ApiService.fetchParks();
      // Filter only active parks
      const activeParks = allParks.filter(park => park.status === 'Active');
      setParks(activeParks);
    } catch (error) {
      Alert.alert('Error', 'Failed to load parks');
      console.error('Error loading parks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParkSelect = (park) => {
    setSelectedPark(park);
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA726" />
        <Text style={styles.loadingText}>Loading parks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🦒 Start Safari</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>Which park are you in now?</Text>
        </View>

        {/* Dropdown/Picker */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedPark ? selectedPark.name : 'Select a park...'}
            </Text>
            <Text style={styles.dropdownIcon}>{showDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownList}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                {parks.map((park) => (
                  <TouchableOpacity
                    key={park.id}
                    style={styles.dropdownItem}
                    onPress={() => handleParkSelect(park)}
                  >
                    <Text style={styles.dropdownItemText}>{park.name}</Text>
                    <Text style={styles.dropdownItemLocation}>📍 {park.location}</Text>
                  </TouchableOpacity>
                ))}
                {parks.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No active parks available</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Selected Park Display */}
        {selectedPark && (
          <View style={styles.selectedParkContainer}>
            <Text style={styles.selectedParkTitle}>Selected Park:</Text>
            <View style={styles.parkCard}>
              <Text style={styles.parkName}>{selectedPark.name}</Text>
              <Text style={styles.parkLocation}>📍 {selectedPark.location}</Text>
              {selectedPark.area > 0 && (
                <Text style={styles.parkArea}>📏 Area: {selectedPark.area} km²</Text>
              )}
              {selectedPark.description && (
                <Text style={styles.parkDescription}>{selectedPark.description}</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.goButton}
              onPress={() => navigation.navigate('SafariMap', { park: selectedPark })}
              activeOpacity={0.8}
            >
              <Text style={styles.goButtonText}>Go</Text>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    backgroundColor: '#FFA726',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FFA726',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#FFA726',
    fontWeight: 'bold',
  },
  dropdownList: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dropdownItemLocation: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  selectedParkContainer: {
    marginTop: 20,
  },
  selectedParkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  parkCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  parkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  parkLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  parkArea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  parkDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  goButton: {
    backgroundColor: '#FFA726',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  goButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SafariStartScreen;

