import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { WebView } from 'react-native-webview';
import LocationService from '../services/LocationService';

const { width, height } = Dimensions.get('window');

const WildlifeMapPicker = ({ visible, onClose, onLocationSelect, initialLocation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [customLocationName, setCustomLocationName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const webViewRef = useRef(null);

  React.useEffect(() => {
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
        timeout: 20000, // Increase timeout to 20 seconds
        enableHighAccuracy: true,
        maximumAge: 5000 // Allow slightly older location data
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
      
      // Update map to GPS location - add small delay to ensure WebView is ready
      setTimeout(() => {
        if (webViewRef.current) {
          console.log('Sending location update to map:', location);
          webViewRef.current.postMessage(JSON.stringify({
            type: 'updateLocation',
            data: location
          }));
        } else {
          console.warn('WebView ref not available for location update');
        }
      }, 500);
      
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

  const handleLocationSelect = (locationData) => {
    if (locationData.customName && locationData.customName.trim()) {
      onLocationSelect({
        ...locationData,
        name: locationData.customName.trim(),
        source: locationData.source || 'Map'
      });
      handleClose();
    } else {
      setSelectedLocation(locationData);
      setShowNameInput(true);
    }
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

  const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .custom-div-icon {
            background: none;
            border: none;
        }
        .wildlife-marker {
            font-size: 20px;
            text-align: center;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
        }
        .leaflet-popup-content {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            text-align: center;
        }
        .popup-title {
            font-weight: bold;
            color: #2E7D32;
            margin-bottom: 5px;
        }
        .popup-coords {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Initialize map
        const map = L.map('map').setView([0, 0], 2);
        
        // Add satellite tile layer
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
            maxZoom: 18,
            minZoom: 2
        }).addTo(map);

        // Add OpenStreetMap overlay with transparency
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            opacity: 0.3,
            maxZoom: 18
        }).addTo(map);

        let selectedMarker = null;

        // Wildlife hotspots
        const wildlifeHotspots = [
            { name: 'Amazon Rainforest', lat: -3.4653, lng: -62.2159, emoji: '🌳', type: 'Rainforest' },
            { name: 'Serengeti National Park', lat: -2.3333, lng: 34.8333, emoji: '🦁', type: 'Savanna' },
            { name: 'Borneo Rainforest', lat: 0.9619, lng: 114.5548, emoji: '🐒', type: 'Tropical Forest' },
            { name: 'Yellowstone National Park', lat: 44.4280, lng: -110.5885, emoji: '🐻', type: 'Wilderness' },
            { name: 'Madagascar', lat: -18.7669, lng: 46.8691, emoji: '🦎', type: 'Island Ecosystem' },
            { name: 'Great Barrier Reef', lat: -18.2871, lng: 147.6992, emoji: '🐠', type: 'Marine' },
            { name: 'Congo Basin', lat: -0.2280, lng: 15.8277, emoji: '🦍', type: 'Tropical Forest' },
            { name: 'Pantanal Wetlands', lat: -16.2500, lng: -56.6667, emoji: '🐆', type: 'Wetlands' },
            { name: 'Galapagos Islands', lat: -0.9538, lng: -90.9656, emoji: '🐢', type: 'Volcanic Islands' },
            { name: 'Arctic Tundra', lat: 71.0275, lng: -156.7691, emoji: '🐻‍❄️', type: 'Tundra' }
        ];

        // Add wildlife hotspot markers
        wildlifeHotspots.forEach(spot => {
            const marker = L.marker([spot.lat, spot.lng], {
                icon: L.divIcon({
                    html: '<div class="wildlife-marker">' + spot.emoji + '</div>',
                    className: 'custom-div-icon',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map);

            marker.bindPopup(
                '<div class="popup-title">' + spot.name + '</div>' +
                '<div>' + spot.type + '</div>' +
                '<div class="popup-coords">' + spot.lat.toFixed(4) + ', ' + spot.lng.toFixed(4) + '</div>'
            );

            marker.on('click', function() {
                selectLocation(spot.lat, spot.lng, spot.name);
            });
        });

        // Handle map clicks
        map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            selectLocation(lat, lng, null);
        });

        function selectLocation(lat, lng, name) {
            // Remove previous selected marker
            if (selectedMarker) {
                map.removeLayer(selectedMarker);
            }

            // Add new selected marker
            selectedMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    html: '<div class="wildlife-marker">📍</div>',
                    className: 'custom-div-icon',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(map);

            const locationName = name || 'Selected Location';
            selectedMarker.bindPopup(
                '<div class="popup-title">' + locationName + '</div>' +
                '<div class="popup-coords">' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</div>'
            ).openPopup();

            // Send data to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                data: {
                    latitude: lat,
                    longitude: lng,
                    name: locationName,
                    formattedCoords: lat.toFixed(6) + ', ' + lng.toFixed(6)
                }
            }));
        }

        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
            try {
                console.log('Received message in WebView:', event.data);
                const message = JSON.parse(event.data);
                if (message.type === 'updateLocation') {
                    const { latitude, longitude } = message.data;
                    console.log('Updating map to location:', latitude, longitude);
                    map.setView([latitude, longitude], 15);
                    selectLocation(latitude, longitude, 'GPS Location');
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        });

        // Set initial view to show global wildlife hotspots
        setTimeout(() => {
            const group = new L.featureGroup(wildlifeHotspots.map(spot => 
                L.marker([spot.lat, spot.lng])
            ));
            map.fitBounds(group.getBounds().pad(0.1));
        }, 1000);

        // Notify React Native that map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapReady'
        }));
    </script>
</body>
</html>
  `;

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        handleLocationSelect(data.data);
      } else if (data.type === 'mapReady') {
        // Map is ready - you can optionally center on user location here
        // For now, we'll let users manually click the GPS button
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
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
          </View>

          {/* Map Container */}
          <View style={styles.mapContainer}>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading Wildlife Map...</Text>
              </View>
            )}
            
            <WebView
              ref={webViewRef}
              source={{ html: leafletHTML }}
              style={styles.webView}
              onLoadEnd={() => setIsLoading(false)}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
            />
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              🎯 Tap anywhere on the map or use GPS to select a location
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
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