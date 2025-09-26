import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
} from 'react-native';
import ApiService from '../services/ApiService';
import { useAuth } from '../contexts/AuthContext';
import LocationService from '../services/LocationService';
import WildlifeMapPicker from '../components/WildlifeMapPicker';

const AddPoachingScreen = ({ navigation }) => {
  const { user, userData, rolePermissions } = useAuth();
  const [formData, setFormData] = useState({
    species: '',
    location: '',
    date: '',
    severity: 'Medium',
    description: '',
    reportedBy: '',
  });
  const [loading, setLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Check if user has permission to add poaching reports
  if (!rolePermissions?.canAddData) {
    return (
      <View style={styles.permissionDenied}>
        <Text style={styles.permissionTitle}>🚫 Access Denied</Text>
        <Text style={styles.permissionText}>
          Your role ({userData?.role || user?.role}) doesn't have permission to report poaching incidents.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const severityOptions = ['Low', 'Medium', 'High'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGetGPSLocation = async () => {
    setIsGettingGPS(true);
    try {
      const location = await LocationService.getCurrentLocation();
      const locationString = `${location.description} (${location.formattedCoords})`;
      
      setLocationData({
        ...location,
        displayName: location.description,
        source: 'GPS'
      });
      
      handleInputChange('location', locationString);
      
      Alert.alert(
        '📍 GPS Location Retrieved!',
        `Location: ${location.description}\nCoordinates: ${location.formattedCoords}\nAccuracy: ±${location.accuracy?.toFixed(0)}m`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('GPS Error', error.message);
    } finally {
      setIsGettingGPS(false);
    }
  };

  const handleMapLocationSelect = (selectedLocation) => {
    const locationString = `${selectedLocation.name} (${selectedLocation.formattedCoords || `${selectedLocation.latitude?.toFixed(6)}, ${selectedLocation.longitude?.toFixed(6)}`})`;
    
    setLocationData({
      ...selectedLocation,
      displayName: selectedLocation.name,
      source: selectedLocation.source || 'Map'
    });
    
    handleInputChange('location', locationString);
    setShowMapPicker(false);
  };

  const validateForm = () => {
    if (!formData.species.trim()) {
      Alert.alert('Error', 'Please enter the species name');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please enter the location');
      return false;
    }
    if (!formData.date.trim()) {
      Alert.alert('Error', 'Please enter the date (YYYY-MM-DD)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Add logged-in user information to the form data
      const poachingData = {
        ...formData,
        // Add logged-in user information
        reportedBy: formData.reportedBy || userData?.displayName || userData?.email || user?.email || 'Unknown User',
        reportedByUserId: userData?.uid || user?.uid || null,
        reportedByRole: userData?.role || 'unknown',
        reportedAt: new Date().toISOString(),
      };

      await ApiService.reportPoachingIncident(poachingData);
      Alert.alert(
        'Success', 
        'Poaching incident reported successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({
                species: '',
                location: '',
                date: '',
                severity: 'Medium',
                description: '',
                reportedBy: '',
              });
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to report incident. Please try again.');
      console.error('Error reporting incident:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚨 Report Poaching Incident</Text>
          <Text style={styles.headerSubtitle}>Help us protect wildlife</Text>
          <View style={styles.userInfoContainer}>
            <Text style={styles.roleEmoji}>
              {userData?.role === 'researcher' ? '🔬' : 
               userData?.role === 'driver' ? '🚗' : '👁️'}
            </Text>
            <Text style={styles.userInfoText}>
              {userData?.displayName || userData?.email || user?.email} ({userData?.role})
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Species *</Text>
            <TextInput
              style={styles.input}
              value={formData.species}
              onChangeText={(value) => handleInputChange('species', value)}
              placeholder="e.g., Tiger, Elephant, etc."
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>📍 Location *</Text>
            
            {/* Location Display */}
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="GPS, Map, or enter manually"
              placeholderTextColor="#999"
            />

            {/* Location Methods */}
            <View style={styles.locationMethodsContainer}>
              <TouchableOpacity
                style={[styles.locationMethodButton, styles.gpsButton]}
                onPress={handleGetGPSLocation}
                disabled={isGettingGPS}
              >
                {isGettingGPS ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.locationMethodEmoji}>📡</Text>
                    <Text style={styles.locationMethodText}>GPS Location</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationMethodButton, styles.mapButton]}
                onPress={() => setShowMapPicker(true)}
              >
                <Text style={styles.locationMethodEmoji}>🗺️</Text>
                <Text style={styles.locationMethodText}>Map Picker</Text>
              </TouchableOpacity>
            </View>

            {/* Location Data Display */}
            {locationData && (
              <View style={styles.locationDataContainer}>
                <View style={styles.locationDataHeader}>
                  <Text style={styles.locationDataTitle}>
                    {locationData.source === 'GPS' ? '📡' : '🗺️'} {locationData.displayName}
                  </Text>
                  <Text style={styles.locationDataSource}>
                    via {locationData.source}
                  </Text>
                </View>
                <Text style={styles.locationDataCoords}>
                  📍 {locationData.formattedCoords || `${locationData.latitude?.toFixed(6)}, ${locationData.longitude?.toFixed(6)}`}
                </Text>
                {locationData.accuracy && (
                  <Text style={styles.locationDataAccuracy}>
                    🎯 Accuracy: ±{locationData.accuracy?.toFixed(0)}m
                  </Text>
                )}
                {locationData.timestamp && (
                  <Text style={styles.locationDataTime}>
                    🕒 {new Date(locationData.timestamp).toLocaleString()}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={formData.date}
              onChangeText={(value) => handleInputChange('date', value)}
              placeholder="2025-09-22"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Severity Level</Text>
            <View style={styles.severityContainer}>
              {severityOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.severityOption,
                    formData.severity === option && styles.selectedSeverity,
                    { backgroundColor: 
                      option === 'High' ? '#F44336' : 
                      option === 'Medium' ? '#FF9800' : '#FFC107' 
                    }
                  ]}
                  onPress={() => handleInputChange('severity', option)}>
                  <Text style={styles.severityText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Describe the incident details..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reported By</Text>
            <TextInput
              style={styles.input}
              value={formData.reportedBy}
              onChangeText={(value) => handleInputChange('reportedBy', value)}
              placeholder="Your name or ranger ID"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}>
            <Text style={styles.submitButtonText}>
              {loading ? 'Reporting...' : 'Report Incident'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Wildlife Map Picker */}
      <WildlifeMapPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationSelect}
        initialLocation={locationData}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
    marginHorizontal: 20,
  },
  userInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginLeft: 8,
  },
  roleEmoji: {
    fontSize: 18,
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedSeverity: {
    borderWidth: 3,
    borderColor: '#333',
  },
  severityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#757575',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Enhanced Location Styles
  locationMethodsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  locationMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gpsButton: {
    backgroundColor: '#2196F3',
  },
  mapButton: {
    backgroundColor: '#4CAF50',
  },
  locationMethodEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  locationMethodText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  locationDataContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  locationDataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    flex: 1,
  },
  locationDataSource: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '500',
  },
  locationDataCoords: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  locationDataAccuracy: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  locationDataTime: {
    fontSize: 11,
    color: '#888',
  },
});

export default AddPoachingScreen;
