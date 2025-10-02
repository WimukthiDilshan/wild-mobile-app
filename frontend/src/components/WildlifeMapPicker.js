import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import LocationService from '../services/LocationService';

const { width, height } = Dimensions.get('window');

const WildlifeMapPicker = ({ visible, onClose, onLocationSelect, initialLocation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [customLocationName, setCustomLocationName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9022, // Malabe, Sri Lanka latitude
    longitude: 79.9633, // Malabe, Sri Lanka longitude
    latitudeDelta: 0.05, // Zoomed in view of Malabe area
    longitudeDelta: 0.05,
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const mapRef = useRef(null);

  // Wildlife hotspots data
  const wildlifeHotspots = [
    { id: 1, name: 'Amazon Rainforest', latitude: -3.4653, longitude: -62.2159, emoji: '🌳', type: 'Rainforest' },
    { id: 2, name: 'Serengeti National Park', latitude: -2.3333, longitude: 34.8333, emoji: '🦁', type: 'Savanna' },
    { id: 3, name: 'Borneo Rainforest', latitude: 0.9619, longitude: 114.5548, emoji: '🐒', type: 'Tropical Forest' },
    { id: 4, name: 'Yellowstone National Park', latitude: 44.4280, longitude: -110.5885, emoji: '🐻', type: 'Wilderness' },
    { id: 5, name: 'Madagascar', latitude: -18.7669, longitude: 46.8691, emoji: '🦎', type: 'Island Ecosystem' },
    { id: 6, name: 'Great Barrier Reef', latitude: -18.2871, longitude: 147.6992, emoji: '🐠', type: 'Marine' },
    { id: 7, name: 'Congo Basin', latitude: -0.2280, longitude: 15.8277, emoji: '🦍', type: 'Tropical Forest' },
    { id: 8, name: 'Pantanal Wetlands', latitude: -16.2500, longitude: -56.6667, emoji: '🐆', type: 'Wetlands' },
    { id: 9, name: 'Galapagos Islands', latitude: -0.9538, longitude: -90.9656, emoji: '🐢', type: 'Volcanic Islands' },
    { id: 10, name: 'Arctic Tundra', latitude: 71.0275, longitude: -156.7691, emoji: '🐻‍❄️', type: 'Tundra' }
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Set initial map region to Malabe, Sri Lanka
      setMapRegion({
        latitude: 6.9022, // Malabe, Sri Lanka latitude
        longitude: 79.9633, // Malabe, Sri Lanka longitude
        latitudeDelta: 0.05, // Zoomed in view of Malabe area
        longitudeDelta: 0.05,
      });
      setIsLoading(false);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      setSelectedLocation(null);
      setCustomLocationName('');
      setShowNameInput(false);
      setGpsLocation(null);
    });
  };

  const handleGetCurrentLocation = async () => {
    setIsGettingGPS(true);
    try {
      console.log('Starting GPS location request...');
      const location = await LocationService.getCurrentLocation({
        timeout: 20000,
        enableHighAccuracy: true,
        maximumAge: 5000
      });
      
      console.log('GPS location received:', location);
      setGpsLocation(location);
      setSelectedLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.description,
        source: 'GPS',
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      });
      
      // Update map region to GPS location
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      Alert.alert(
        '📍 GPS Location Found!',
        `Current location: ${location.formattedCoords}\nAccuracy: ±${location.accuracy?.toFixed(0)}m\n${location.description}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('GPS Error:', error);
      Alert.alert(
        'GPS Error', 
        error.message + '\n\nTip: Make sure GPS is enabled and you have granted location permissions.',
        [
          { text: 'OK' },
          { text: 'Try Again', onPress: handleGetCurrentLocation }
        ]
      );
    } finally {
      setIsGettingGPS(false);
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const locationData = {
      latitude,
      longitude,
      name: 'Selected Location',
      formattedCoords: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      source: 'Map'
    };
    setSelectedLocation(locationData);
    setShowNameInput(true);
  };

  const handleHotspotPress = (hotspot) => {
    const locationData = {
      latitude: hotspot.latitude,
      longitude: hotspot.longitude,
      name: hotspot.name,
      formattedCoords: `${hotspot.latitude.toFixed(6)}, ${hotspot.longitude.toFixed(6)}`,
      source: 'Hotspot'
    };
    setSelectedLocation(locationData);
    setCustomLocationName(hotspot.name); // Pre-fill with hotspot name
    setShowNameInput(true);
  };

  const handleZoomIn = () => {
    setMapRegion(prevRegion => ({
      ...prevRegion,
      latitudeDelta: prevRegion.latitudeDelta * 0.5,
      longitudeDelta: prevRegion.longitudeDelta * 0.5,
    }));
  };

  const handleZoomOut = () => {
    setMapRegion(prevRegion => ({
      ...prevRegion,
      latitudeDelta: Math.min(prevRegion.latitudeDelta * 2, 180),
      longitudeDelta: Math.min(prevRegion.longitudeDelta * 2, 360),
    }));
  };

  const handleGoToMalabe = () => {
    setMapRegion({
      latitude: 6.9022, // Malabe, Sri Lanka latitude
      longitude: 79.9633, // Malabe, Sri Lanka longitude
      latitudeDelta: 0.05, // Zoomed in view of Malabe area
      longitudeDelta: 0.05,
    });
  };

  const handleSaveLocation = () => {
    if (!customLocationName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for this location.');
      return;
    }

    const locationToSave = {
      ...selectedLocation,
      name: customLocationName.trim(),
      customName: customLocationName.trim(),
      source: selectedLocation?.source || 'Map'
    };

    onLocationSelect(locationToSave);
    handleClose();
  };


  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.modalOverlay, 
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            { 
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim 
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🗺️ Wildlife Location Picker</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* GPS Button */}
          <View style={styles.gpsContainer}>
            <TouchableOpacity
              style={[styles.gpsButton, isGettingGPS && styles.gpsButtonDisabled]}
              onPress={handleGetCurrentLocation}
              disabled={isGettingGPS}
            >
              {isGettingGPS ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.gpsButtonEmoji}>📡</Text>
                  <Text style={styles.gpsButtonText}>Get My Location</Text>
                </>
              )}
            </TouchableOpacity>
            
            {gpsLocation && (
              <View style={styles.gpsInfo}>
                <Text style={styles.gpsInfoText}>
                  📍 {gpsLocation.formattedCoords} (±{gpsLocation.accuracy?.toFixed(0)}m)
                </Text>
              </View>
            )}

            {/* Map Type Selector */}
            <View style={styles.mapTypeContainer}>
              <Text style={styles.mapTypeLabel}>Map View:</Text>
              <View style={styles.mapTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.mapTypeButton,
                    mapType === 'standard' && styles.mapTypeButtonActive
                  ]}
                  onPress={() => setMapType('standard')}
                >
                  <Text style={[
                    styles.mapTypeButtonText,
                    mapType === 'standard' && styles.mapTypeButtonTextActive
                  ]}>🗺️ Standard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.mapTypeButton,
                    mapType === 'satellite' && styles.mapTypeButtonActive
                  ]}
                  onPress={() => setMapType('satellite')}
                >
                  <Text style={[
                    styles.mapTypeButtonText,
                    mapType === 'satellite' && styles.mapTypeButtonTextActive
                  ]}>🛰️ Satellite</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.mapTypeButton,
                    mapType === 'hybrid' && styles.mapTypeButtonActive
                  ]}
                  onPress={() => setMapType('hybrid')}
                >
                  <Text style={[
                    styles.mapTypeButtonText,
                    mapType === 'hybrid' && styles.mapTypeButtonTextActive
                  ]}>🌍 Hybrid</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Go to Malabe Button */}
            {/* <View style={styles.locationContainer}>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleGoToMalabe}
              >
                <Text style={styles.locationButtonEmoji}>🇱🇰</Text>
                <Text style={styles.locationButtonText}>Go to Malabe, Sri Lanka</Text>
              </TouchableOpacity>
            </View> */}
          </View>

          {/* Google Maps Container */}
          <View style={styles.mapContainer}>
            {mapError ? (
              <View style={styles.mapErrorContainer}>
                <Text style={styles.mapErrorIcon}>🗺️</Text>
                <Text style={styles.mapErrorTitle}>Map Loading Error</Text>
                <Text style={styles.mapErrorText}>
                  Google Maps failed to load. Please check your internet connection and try again.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setMapError(null);
                    setIsLoading(true);
                  }}
                >
                  <Text style={styles.retryButtonText}>🔄 Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={mapRegion}
                onPress={handleMapPress}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                showsScale={true}
                mapType={mapType}
                loadingEnabled={true}
                loadingIndicatorColor="#4CAF50"
                loadingBackgroundColor="#ffffff"
                onMapReady={() => {
                  console.log('Google Maps loaded successfully');
                  setIsLoading(false);
                }}
                onError={(error) => {
                  console.error('Google Maps error:', error);
                  setMapError(error);
                  setIsLoading(false);
                }}
              >
              {/* Wildlife Hotspot Markers */}
              {wildlifeHotspots.map((hotspot) => (
                <Marker
                  key={hotspot.id}
                  coordinate={{
                    latitude: hotspot.latitude,
                    longitude: hotspot.longitude,
                  }}
                  title={hotspot.name}
                  description={hotspot.type}
                  onPress={() => handleHotspotPress(hotspot)}
                >
                  <View style={styles.hotspotMarker}>
                    <Text style={styles.hotspotEmoji}>{hotspot.emoji}</Text>
                  </View>
                </Marker>
              ))}

              {/* Selected Location Marker */}
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title={selectedLocation.name}
                  description={selectedLocation.formattedCoords}
                >
                  <View style={styles.selectedMarker}>
                    <Text style={styles.selectedEmoji}>📍</Text>
                  </View>
                </Marker>
              )}
              </MapView>
            )}

            {/* Zoom Controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={handleZoomIn}
              >
                <Text style={styles.zoomButtonText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={handleZoomOut}
              >
                <Text style={styles.zoomButtonText}>−</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              🎯 Tap anywhere on the map or wildlife hotspots to select a location
            </Text>
          </View>

          {/* Name Input Modal */}
          {showNameInput && (
            <View style={styles.nameInputOverlay}>
              <View style={styles.nameInputContainer}>
                <Text style={styles.nameInputTitle}>📍 Name This Location</Text>
                <Text style={styles.selectedLocationText}>
                  {selectedLocation?.formattedCoords}
                </Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Enter location name..."
                  placeholderTextColor="#999"
                  value={customLocationName}
                  onChangeText={setCustomLocationName}
                  autoFocus={true}
                />
                <View style={styles.nameInputButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowNameInput(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveLocation}
                  >
                    <Text style={styles.saveButtonText}>Save Location</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.95,
    height: height * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#4CAF50',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gpsContainer: {
    padding: 15,
    backgroundColor: '#F5F5F5',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gpsButtonDisabled: {
    backgroundColor: '#999',
  },
  gpsButtonEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  gpsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  gpsInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  gpsInfoText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  mapTypeContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  mapTypeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  mapTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapTypeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  mapTypeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  mapTypeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  locationContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationButtonEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  zoomControls: {
    position: 'absolute',
    right: 15,
    top: 15,
    flexDirection: 'column',
  },
  zoomButton: {
    width: 45,
    height: 45,
    backgroundColor: 'white',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  hotspotMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  hotspotEmoji: {
    fontSize: 20,
  },
  selectedMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  selectedEmoji: {
    fontSize: 20,
  },
  mapErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  mapErrorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapErrorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  mapErrorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    padding: 10,
    backgroundColor: '#E8F5E8',
  },
  instructionText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
  nameInputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInputContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  nameInputTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2E7D32',
  },
  selectedLocationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  nameInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    marginLeft: 10,
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default WildlifeMapPicker;