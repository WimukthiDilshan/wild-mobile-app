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
  ActivityIndicator,
  Animated,
} from 'react-native';
import ApiService from '../services/ApiService';
import OfflineQueue from '../services/OfflineQueue';
import { useAuth } from '../contexts/AuthContext';
import LocationService from '../services/LocationService';
import WildlifeMapPicker from '../components/WildlifeMapPicker';
import ImageUploader from '../uploads/ImageUpload';

const AddPoachingScreen = ({ navigation }) => {
  const { user, userData, rolePermissions } = useAuth();
  const [formData, setFormData] = useState({
    species: '',
    location: '',
    date: '',
    severity: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [emergencyPending, setEmergencyPending] = useState(false);
  // Evidence/media feature removed — simplified UI (no native modules required)
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // ...existing code... (removed reportedBy prefill for cleaner UX)

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
    // If the emergency flow is waiting for a manual map selection, auto-send
    if (emergencyPending) {
      // send emergency using this selected location
      performEmergencySendWithLoc(selectedLocation);
    }
  };

  // Send an emergency report using a provided location object (from map or fallback)
  const performEmergencySendWithLoc = async (loc) => {
    setEmergencyLoading(true);
    setEmergencyPending(false);
    let emergencyData = null;
    try {
      const coordsStr = loc ? `${loc.name || loc.description || ''} (${loc.formattedCoords || (loc.latitude && loc.longitude ? `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}` : '')})` : 'Location unknown';
      const dateString = new Date().toISOString().slice(0,10);
      emergencyData = {
        species: '🚨 Emergency Alert',
        location: coordsStr,
        date: dateString,
        severity: 'High',
        description: 'One-tap emergency alert (map-selected)',
        evidence: [],
        emergency: true,
        // Include reporter metadata so server stores who reported the incident.
        reportedBy: userData?.displayName || userData?.email || user?.email || 'Unknown User',
        reportedByUserId: userData?.uid || user?.uid || null,
        reportedByRole: userData?.role || 'unknown',
        reportedAt: new Date().toISOString(),
      };

      await ApiService.reportPoachingIncident(emergencyData);
      Alert.alert('🚨 Sent', 'Emergency alert sent successfully');
    } catch (err) {
      console.error('Emergency send failed (map):', err);
      const queued = await OfflineQueue.enqueueIncident({ ...(emergencyData || {}), _emergencyLocal: true });
      if (queued) {
        Alert.alert('Offline', 'No network — emergency saved and will be sent when connectivity returns.');
      } else {
        Alert.alert('Error', 'Failed to send emergency alert. Please try again.');
      }
    } finally {
      setEmergencyLoading(false);
    }
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
    if (!formData.severity || !formData.severity.trim()) {
      Alert.alert('Error', 'Please select a severity level');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Add logged-in user information to the form data
      // Ensure date is set to current date (YYYY-MM-DD) if not provided
      const dateString = formData.date && formData.date.trim()
        ? formData.date.trim()
        : new Date().toISOString().slice(0, 10);

      const poachingData = {
        ...formData,
        date: dateString,
        evidence: evidenceUrls,
              // Include reporter metadata so server stores who reported the incident.
              reportedBy: userData?.displayName || userData?.email || user?.email || 'Unknown User',
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
                  severity: '',
                description: '',
              });
              setEvidenceUrls([]);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error reporting incident:', error);
      // Attempt to enqueue for later if network or server error
      const queued = await OfflineQueue.enqueueIncident(poachingData);
      if (queued) {
        Alert.alert('Offline', 'You are currently offline or the server failed. The report has been saved and will be sent automatically when connectivity returns.');
        // reset form locally
        setFormData({
          species: '',
          location: '',
          date: '',
          severity: '',
          description: '',
        });
        setEvidenceUrls([]);
        navigation.goBack();
        return;
      }
      Alert.alert('Error', 'Failed to report incident. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show confirmation before actually submitting
  const confirmSubmit = () => {
    Alert.alert(
      'Confirm Report',
      'Are you sure you want to submit this poaching report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => handleSubmit() }
      ]
    );
  };

  // Reusable emergency trigger used by header button and FAB
  const triggerEmergency = () => {
    Alert.alert(
      '🚨 Send Emergency Alert?',
      'Send an immediate high-priority poaching alert to nearby officers?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: async () => {
          setEmergencyLoading(true);
          let emergencyData = null;
          try {
            let loc = locationData;
            let usedSource = loc ? (loc.source || 'Map') : null;

            if (!loc) {
              const getWithTimeout = (ms) => Promise.race([
                LocationService.getCurrentLocation(),
                new Promise((resolve) => setTimeout(() => resolve(null), ms)),
              ]);

              try {
                const gps = await getWithTimeout(15000);
                if (gps) {
                  loc = { ...gps, source: 'GPS' };
                  usedSource = 'GPS';
                } else if (locationData) {
                  loc = locationData;
                  usedSource = 'Map (fallback)';
                } else {
                  usedSource = 'none';
                  loc = null;
                  setEmergencyLoading(false);
                  Alert.alert(
                    '🚨 GPS timed out',
                    'Unable to obtain GPS fix. Opening the map so you can tap to select the incident location.',
                    [{ text: 'OK', onPress: () => { setEmergencyPending(true); setTimeout(() => setShowMapPicker(true), 250); } }]
                  );
                  return;
                }
              } catch (gpsErr) {
                console.warn('GPS error during emergency attempt:', gpsErr);
                if (locationData) {
                  loc = locationData;
                  usedSource = 'Map (fallback)';
                } else {
                  loc = null;
                  usedSource = 'none';
                  setEmergencyLoading(false);
                  Alert.alert(
                    '🚨 GPS error',
                    'Unable to obtain GPS location. Opening the map so you can select a location manually.',
                    [{ text: 'OK', onPress: () => { setEmergencyPending(true); setTimeout(() => setShowMapPicker(true), 250); } }]
                  );
                  return;
                }
              }
            }

            const coordsStr = loc ? `${loc.description || ''} (${loc.formattedCoords || (loc.latitude && loc.longitude ? `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}` : '')})` : 'Location unknown';
            const dateString = new Date().toISOString().slice(0,10);
            emergencyData = {
              species: '🚨 Emergency Alert',
              location: coordsStr,
              date: dateString,
              severity: 'High',
              description: 'One-tap emergency alert',
              evidence: [],
              emergency: true,
              // Include reporter metadata so server stores who reported the incident.
              reportedBy: userData?.displayName || userData?.email || user?.email || 'Unknown User',
              reportedByUserId: userData?.uid || user?.uid || null,
              reportedByRole: userData?.role || 'unknown',
              reportedAt: new Date().toISOString(),
            };

            if (usedSource === 'GPS') {
              Alert.alert('🚨 Location', 'Using current GPS location for the emergency alert');
            } else if (usedSource && usedSource.startsWith('Map')) {
              Alert.alert('🚨 Location', 'Using map-selected location for the emergency alert');
            } else {
              Alert.alert('🚨 Location', 'No reliable location available — sending without precise coordinates');
            }

            await ApiService.reportPoachingIncident(emergencyData);
            Alert.alert('🚨 Sent', 'Emergency alert sent successfully');
          } catch (err) {
            console.error('Emergency send failed:', err);
            const queued = await OfflineQueue.enqueueIncident({ ...(emergencyData || {}), _emergencyLocal: true });
            if (queued) {
              Alert.alert('Offline', 'No network — emergency saved and will be sent when connectivity returns.');
            } else {
              Alert.alert('Error', 'Failed to send emergency alert. Please try again.');
            }
          } finally {
            setEmergencyLoading(false);
          }
        }}
      ]
    );
  };

  // no header emergency button; primary emergency is the floating FAB

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Report Poaching Incident</Text>
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
        {/* Top one-tap emergency button */}
        <View style={styles.emergencyTopWrap}>
          <TouchableOpacity
            style={[styles.emergencyButtonHeader, emergencyLoading && styles.disabledButton]}
            onPress={triggerEmergency}
            activeOpacity={0.85}
          >
            <Text style={styles.emergencyButtonTextHeader}>{emergencyLoading ? 'Sending…' : '🚨 Emergency: One‑Tap Alert'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>🐾 Species *</Text>
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

          {/* Date is auto-filled to current date on submit (YYYY-MM-DD) */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>⚠️ Severity Level</Text>
            <View style={styles.severityContainer}>
              {severityOptions.map((option) => {
                const emoji = option === 'High' ? '🔴' : option === 'Medium' ? '🟠' : '🟢';
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.severityOption,
                      formData.severity === option && styles.selectedSeverity,
                      { backgroundColor: 
                        option === 'High' ? '#F44336' : 
                        option === 'Medium' ? '#FF9800' : '#4CAF50' 
                      }
                    ]}
                    onPress={() => handleInputChange('severity', option)}>
                    <Text style={styles.severityText}>{`${emoji} ${option}`}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>📝 Description</Text>
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
            <Text style={styles.label}>🖼️ Evidence (photos)</Text>
            <ImageUploader
              onUpload={(updater) => {
                // ImageUploader calls onUpload with an updater function
                setEvidenceUrls(prev => (typeof updater === 'function' ? updater(prev) : updater));
              }}
              onUploadingChange={(isUploading) => setUploadingImages(isUploading)}
            />
            {evidenceUrls.length > 0 && (
              <Text style={{ marginTop: 8, color: '#666' }}>{evidenceUrls.length} image(s) selected</Text>
            )}
            {uploadingImages && (
              <Text style={{ marginTop: 6, color: '#d84315' }}>Uploading images — please wait before submitting</Text>
            )}
          </View>

          {/* Reporter display removed to simplify UX */}

          {/* Evidence feature removed to avoid native build issues */}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.halfButton, styles.submitButton, (loading || uploadingImages) && styles.disabledButton]}
              onPress={confirmSubmit}
              disabled={loading || uploadingImages}>
              <Text style={styles.submitButtonText}>
                {loading ? 'Reporting...' : 'Report Incident'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.halfButton, styles.cancelButton, (loading || uploadingImages) && styles.disabledButton]}
              onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Wildlife Map Picker */}
      <WildlifeMapPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationSelect}
        initialLocation={locationData}
      />

      {/* Top emergency button is used; floating FAB removed */}
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
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  cancelButton: {
    backgroundColor: '#757575',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  halfButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
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
  readOnlyInput: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  readOnlyText: {
    color: '#333',
    fontSize: 16,
  },
  emergencyFab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#D32F2F',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  emergencyFabText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  // Emergency button at top styles
  emergencyTopWrap: {
    marginHorizontal: 12,
    marginTop: 12,
    alignItems: 'center',
    zIndex: 60,
  },
  emergencyContainerHeader: {
    padding: 6,
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButtonHeader: {
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    minWidth: 180,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  emergencyButtonTextHeader: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});

export default AddPoachingScreen;
