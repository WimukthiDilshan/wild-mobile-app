import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import ApiService from '../services/ApiService';
import { useAuth } from '../contexts/AuthContext';
import firestore from '@react-native-firebase/firestore';
import LocationService from '../services/LocationService';

const { width, height } = Dimensions.get('window');

const SafariMapScreen = ({ navigation, route }) => {
  const { park } = route.params || {};
  const { userData } = useAuth();
  
  const [mapRegion, setMapRegion] = useState({
    latitude: park?.coordinates?.latitude || 6.9022,
    longitude: park?.coordinates?.longitude || 79.9633,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Form modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [animalMarkers, setAnimalMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    count: '',
    habitat: '',
    status: 'Not Evaluated',
    description: '',
  });

  // Predefined species
  const wildlifeSpecies = [
    { id: 1, name: 'Tiger', emoji: '🐅', category: 'Big Cats' },
    { id: 2, name: 'Elephant', emoji: '🐘', category: 'Large Mammals' },
    { id: 3, name: 'Leopard', emoji: '🐆', category: 'Big Cats' },
    { id: 4, name: 'Orangutan', emoji: '🦧', category: 'Primates' },
    { id: 5, name: 'Rhinoceros', emoji: '🦏', category: 'Large Mammals' },
    { id: 6, name: 'Giant Panda', emoji: '🐼', category: 'Bears' },
    { id: 7, name: 'Polar Bear', emoji: '🐻‍❄️', category: 'Bears' },
    { id: 8, name: 'Mountain Gorilla', emoji: '🦍', category: 'Primates' },
    { id: 9, name: 'Snow Leopard', emoji: '🐆', category: 'Big Cats' },
    { id: 10, name: 'Chimpanzee', emoji: '🐵', category: 'Primates' },
    { id: 11, name: 'Wolf', emoji: '🐺', category: 'Carnivores' },
    { id: 12, name: 'Lion', emoji: '🦁', category: 'Big Cats' },
    { id: 13, name: 'Giraffe', emoji: '🦒', category: 'Large Mammals' },
    { id: 14, name: 'Zebra', emoji: '🦓', category: 'Ungulates' },
    { id: 15, name: 'Custom Species', emoji: '🐾', category: 'Other' },
  ];

  // Conservation status options
  const conservationStatuses = [
    { id: 1, name: 'Least Concern', emoji: '💚', color: '#4CAF50' },
    { id: 2, name: 'Near Threatened', emoji: '💛', color: '#FFC107' },
    { id: 3, name: 'Vulnerable', emoji: '🧡', color: '#FF9800' },
    { id: 4, name: 'Endangered', emoji: '❤️', color: '#F44336' },
    { id: 5, name: 'Critically Endangered', emoji: '💔', color: '#D32F2F' },
    { id: 6, name: 'Extinct in Wild', emoji: '🖤', color: '#424242' },
    { id: 7, name: 'Not Evaluated', emoji: '⚪', color: '#9E9E9E' },
  ];

  // Load animal markers from Firestore on mount
  React.useEffect(() => {
    const loadAnimalMarkers = async () => {
      try {
        const markersSnapshot = await firestore()
          .collection('animal_markers')
          .where('parkId', '==', park?.id || 'default')
          .get();
        
        const markers = [];
        markersSnapshot.forEach(doc => {
          const data = doc.data();
          markers.push({
            id: doc.id,
            latitude: data.latitude,
            longitude: data.longitude,
            name: data.name,
            emoji: data.emoji,
            count: data.count,
          });
        });
        
        setAnimalMarkers(markers);
      } catch (error) {
        console.error('Error loading animal markers:', error);
      }
    };

    loadAnimalMarkers();
  }, [park?.id]);

  // Fetch user's current GPS location on mount
  React.useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await LocationService.getCurrentLocation();
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    };

    getUserLocation();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter the animal species name.');
      return false;
    }
    if (!formData.count.trim() || isNaN(parseInt(formData.count)) || parseInt(formData.count) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid count (positive number).');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const animalData = {
        name: formData.name.trim(),
        location: park?.name || 'Safari Location',
        count: parseInt(formData.count),
        habitat: formData.habitat.trim(),
        status: formData.status,
        description: formData.description.trim(),
        addedBy: userData?.displayName || userData?.email || 'Unknown User',
        addedByUserId: userData?.uid || null,
        addedByRole: userData?.role || 'unknown',
        addedAt: new Date().toISOString(),
      };

      await ApiService.addAnimal(animalData);
      
      // Add animal marker with emoji if location was pinned
      if (pinnedLocation) {
        const selectedSpecies = wildlifeSpecies.find(s => s.name === formData.name);
        const animalEmoji = selectedSpecies?.emoji || '🐾';
        
        // Save marker to Firestore for persistence
        const markerData = {
          parkId: park?.id || 'default',
          parkName: park?.name || 'Safari Location',
          latitude: pinnedLocation.latitude,
          longitude: pinnedLocation.longitude,
          name: formData.name,
          emoji: animalEmoji,
          count: formData.count,
          addedBy: userData?.displayName || userData?.email || 'Unknown User',
          addedAt: new Date().toISOString(),
        };
        
        const markerDoc = await firestore()
          .collection('animal_markers')
          .add(markerData);
        
        // Update local state for immediate UI update
        setAnimalMarkers(prev => [
          ...prev,
          {
            id: markerDoc.id,
            latitude: pinnedLocation.latitude,
            longitude: pinnedLocation.longitude,
            name: formData.name,
            emoji: animalEmoji,
            count: formData.count,
          }
        ]);
        setPinnedLocation(null);
      }
      
      Alert.alert(
        'Success! 🎉',
        `${formData.name} has been successfully added to the wildlife database!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({
                name: '',
                count: '',
                habitat: '',
                status: 'Not Evaluated',
                description: '',
              });
              setShowFormModal(false);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to add animal: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    Alert.alert(
      'Pin Location',
      'Do you need to insert animal in this place?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => setPinnedLocation(null),
        },
        {
          text: 'Yes',
          onPress: () => {
            setPinnedLocation({ latitude, longitude });
            setShowFormModal(true);
          },
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Safari Map</Text>
        <TouchableOpacity
          style={styles.insertAnimalButton}
          onPress={() => setShowFormModal(true)}
        >
          <Text style={styles.insertAnimalButtonText}>Insert Animal</Text>
        </TouchableOpacity>
      </View>

      {/* Park Info Banner */}
      {park && (
        <View style={styles.parkInfoBanner}>
          <Text style={styles.parkInfoText}>🏞️ {park.name}</Text>
          <Text style={styles.parkLocationText}>📍 {park.location}</Text>
        </View>
      )}

      {/* Map View */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
        onPress={handleMapPress}
      >
        {/* Park Location Marker */}
        {park?.coordinates && (
          <Marker
            coordinate={{
              latitude: park.coordinates.latitude,
              longitude: park.coordinates.longitude,
            }}
            title={park.name}
            description={park.location}
          >
            <View style={styles.parkMarker}>
              <Text style={styles.parkMarkerText}>🏞️</Text>
            </View>
          </Marker>
        )}

        {/* Pinned Location Marker (temporary, before animal is added) */}
        {pinnedLocation && (
          <Marker
            coordinate={{
              latitude: pinnedLocation.latitude,
              longitude: pinnedLocation.longitude,
            }}
            title="Animal Location"
            description="Pinned location for animal data"
          >
            <View style={styles.pinnedMarker}>
              <Text style={styles.pinnedMarkerText}>📍</Text>
            </View>
          </Marker>
        )}

        {/* Animal Markers with their emojis */}
        {animalMarkers.map((animal) => (
          <Marker
            key={animal.id}
            coordinate={{
              latitude: animal.latitude,
              longitude: animal.longitude,
            }}
            title={animal.name}
            description={`Count: ${animal.count}`}
          >
            <View style={styles.animalMarker}>
              <Text style={styles.animalMarkerText}>{animal.emoji}</Text>
            </View>
          </Marker>
        ))}

        {/* User's Current Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            description="Current GPS location"
          >
            <View style={styles.userLocationContainer}>
              <View style={styles.userLocationLabel}>
                <Text style={styles.userLocationLabelText}>Your Location</Text>
              </View>
              <View style={styles.userLocationMarker}>
                <Text style={styles.userLocationMarkerText}>📍</Text>
              </View>
            </View>
          </Marker>
        )}
      </MapView>

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

      {/* Add Animal Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContainer}>
            <View style={styles.formModalHeader}>
              <Text style={styles.formModalTitle}>🦁 Add Wildlife Data</Text>
              <TouchableOpacity
                style={styles.formCloseButton}
                onPress={() => setShowFormModal(false)}
              >
                <Text style={styles.formCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScrollView}>
              {/* Species Selection */}
              <View style={styles.formInputGroup}>
                <Text style={styles.formLabel}>🐾 Animal Species *</Text>
                <TouchableOpacity
                  style={[styles.formInput, styles.formDropdownInput]}
                  onPress={() => setShowSpeciesModal(true)}
                >
                  <Text style={formData.name ? styles.formInputText : styles.formPlaceholderText}>
                    {formData.name || 'Select or enter species'}
                  </Text>
                  <Text style={styles.formDropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Count Input */}
              <View style={styles.formInputGroup}>
                <Text style={styles.formLabel}>🔢 Population Count *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter number of animals spotted"
                  placeholderTextColor="#999"
                  value={formData.count}
                  onChangeText={(value) => handleInputChange('count', value)}
                  keyboardType="numeric"
                />
              </View>

              {/* Habitat Input */}
              <View style={styles.formInputGroup}>
                <Text style={styles.formLabel}>🌿 Habitat Type</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Dense forest, Grasslands, Wetlands"
                  placeholderTextColor="#999"
                  value={formData.habitat}
                  onChangeText={(value) => handleInputChange('habitat', value)}
                />
              </View>

              {/* Conservation Status */}
              <View style={styles.formInputGroup}>
                <Text style={styles.formLabel}>⚠️ Conservation Status</Text>
                <TouchableOpacity
                  style={[styles.formInput, styles.formDropdownInput]}
                  onPress={() => setShowStatusModal(true)}
                >
                  <View style={styles.formStatusContainer}>
                    <Text style={styles.formStatusEmoji}>
                      {conservationStatuses.find(s => s.name === formData.status)?.emoji}
                    </Text>
                    <Text style={styles.formInputText}>{formData.status}</Text>
                  </View>
                  <Text style={styles.formDropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={styles.formInputGroup}>
                <Text style={styles.formLabel}>📝 Additional Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formMultilineInput]}
                  placeholder="Any additional observations or notes..."
                  placeholderTextColor="#999"
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.formSubmitButton, isLoading && styles.formSubmitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.formSubmitButtonText}>🐾 Add to Database</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Species Selection Modal */}
      <Modal
        visible={showSpeciesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSpeciesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModalContainer}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>🐾 Select Animal Species</Text>
              <TouchableOpacity
                style={styles.selectionCloseButton}
                onPress={() => setShowSpeciesModal(false)}
              >
                <Text style={styles.selectionCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={wildlifeSpecies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectionModalItem}
                  onPress={() => {
                    if (item.name === 'Custom Species') {
                      setShowSpeciesModal(false);
                      Alert.prompt(
                        'Custom Species',
                        'Enter the animal species name:',
                        (text) => {
                          if (text) handleInputChange('name', text);
                        }
                      );
                    } else {
                      handleInputChange('name', item.name);
                      setShowSpeciesModal(false);
                    }
                  }}
                >
                  <View style={styles.selectionModalItemContent}>
                    <Text style={styles.selectionModalItemEmoji}>{item.emoji}</Text>
                    <View>
                      <Text style={styles.selectionModalItemTitle}>{item.name}</Text>
                      <Text style={styles.selectionModalItemSubtitle}>{item.category}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Conservation Status Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModalContainer}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>⚠️ Conservation Status</Text>
              <TouchableOpacity
                style={styles.selectionCloseButton}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.selectionCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={conservationStatuses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectionModalItem}
                  onPress={() => {
                    handleInputChange('status', item.name);
                    setShowStatusModal(false);
                  }}
                >
                  <View style={styles.selectionModalItemContent}>
                    <Text style={styles.selectionModalItemEmoji}>{item.emoji}</Text>
                    <View style={styles.formFlex1}>
                      <Text style={[styles.selectionModalItemTitle, { color: item.color }]}>
                        {item.name}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  insertAnimalButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  insertAnimalButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  parkInfoBanner: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  parkInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  parkLocationText: {
    fontSize: 14,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  parkMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 167, 38, 0.9)',
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
  parkMarkerText: {
    fontSize: 24,
  },
  pinnedMarker: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
  pinnedMarkerText: {
    fontSize: 22,
  },
  animalMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
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
  animalMarkerText: {
    fontSize: 26,
  },
  userLocationContainer: {
    alignItems: 'center',
  },
  userLocationLabel: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  userLocationLabelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userLocationMarker: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#2196F3',
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
  userLocationMarkerText: {
    fontSize: 22,
  },
  zoomControls: {
    position: 'absolute',
    right: 15,
    top: '45%',
    flexDirection: 'column',
  },
  zoomButton: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  // Form Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  formModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  formModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#4CAF50',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  formModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  formCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCloseButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  formScrollView: {
    padding: 20,
  },
  formInputGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  formMultilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  formDropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formInputText: {
    fontSize: 16,
    color: '#333',
  },
  formPlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  formDropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  formStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formStatusEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  formSubmitButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  formSubmitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  formSubmitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Selection Modal Styles
  selectionModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  selectionCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCloseButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  selectionModalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  selectionModalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionModalItemEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  selectionModalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectionModalItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  formFlex1: {
    flex: 1,
  },
});

export default SafariMapScreen;

