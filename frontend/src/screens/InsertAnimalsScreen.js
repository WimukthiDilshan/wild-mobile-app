import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Animated,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import ApiService from '../services/ApiService';

const InsertAnimalsScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    count: '',
    habitat: '',
    status: 'Not Evaluated',
    description: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Predefined locations
  const wildlifeLocations = [
    { id: 1, name: 'Amazon Rainforest', emoji: '🌳', region: 'South America' },
    { id: 2, name: 'African Savanna', emoji: '🦁', region: 'Africa' },
    { id: 3, name: 'Borneo Forest', emoji: '🌲', region: 'Asia' },
    { id: 4, name: 'Madagascar', emoji: '🐾', region: 'Africa' },
    { id: 5, name: 'Yellowstone National Park', emoji: '🏔️', region: 'North America' },
    { id: 6, name: 'Serengeti', emoji: '🦓', region: 'Africa' },
    { id: 7, name: 'Galapagos Islands', emoji: '🐢', region: 'South America' },
    { id: 8, name: 'Great Barrier Reef', emoji: '🐠', region: 'Oceania' },
    { id: 9, name: 'Arctic Tundra', emoji: '🐻‍❄️', region: 'Arctic' },
    { id: 10, name: 'Custom Location', emoji: '📍', region: 'Other' },
  ];

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

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
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
    if (!formData.location.trim()) {
      Alert.alert('Validation Error', 'Please select or enter a location.');
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
        location: formData.location.trim(),
        count: parseInt(formData.count),
        habitat: formData.habitat.trim(),
        status: formData.status,
        description: formData.description.trim(),
      };

      await ApiService.addAnimal(animalData);
      
      Alert.alert(
        'Success! 🎉',
        `${formData.name} has been successfully added to the wildlife database!`,
        [
          {
            text: 'Add Another',
            onPress: () => {
              setFormData({
                name: '',
                location: '',
                count: '',
                habitat: '',
                status: 'Not Evaluated',
                description: '',
              });
            },
          },
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to add animal: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🦁 Add Wildlife Data</Text>
            <Text style={styles.headerSubtitle}>
              Help us track and protect wildlife populations
            </Text>
          </View>

          <Animated.View style={[styles.formContainer, { transform: [{ translateY: slideAnim }] }]}>
            {/* Species Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🐾 Animal Species *</Text>
              <TouchableOpacity
                style={[styles.input, styles.dropdownInput]}
                onPress={() => setShowSpeciesModal(true)}>
                <Text style={formData.name ? styles.inputText : styles.placeholderText}>
                  {formData.name || 'Select or enter species'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Location Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📍 Location *</Text>
              <TouchableOpacity
                style={[styles.input, styles.dropdownInput]}
                onPress={() => setShowLocationModal(true)}>
                <Text style={formData.location ? styles.inputText : styles.placeholderText}>
                  {formData.location || 'Select or enter location'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Count Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🔢 Population Count *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter number of animals spotted"
                placeholderTextColor="#999"
                value={formData.count}
                onChangeText={(value) => handleInputChange('count', value)}
                keyboardType="numeric"
              />
            </View>

            {/* Habitat Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🌿 Habitat Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dense forest, Grasslands, Wetlands"
                placeholderTextColor="#999"
                value={formData.habitat}
                onChangeText={(value) => handleInputChange('habitat', value)}
              />
            </View>

            {/* Conservation Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>⚠️ Conservation Status</Text>
              <TouchableOpacity
                style={[styles.input, styles.dropdownInput]}
                onPress={() => setShowStatusModal(true)}>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusEmoji}>
                    {conservationStatuses.find(s => s.name === formData.status)?.emoji}
                  </Text>
                  <Text style={styles.inputText}>{formData.status}</Text>
                </View>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📝 Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
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
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>🐾 Add to Database</Text>
              )}
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Back to Main</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </Animated.View>

      {/* Species Selection Modal */}
      <Modal
        visible={showSpeciesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSpeciesModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🐾 Select Animal Species</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSpeciesModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={wildlifeSpecies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
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
                  }}>
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemEmoji}>{item.emoji}</Text>
                    <View>
                      <Text style={styles.modalItemTitle}>{item.name}</Text>
                      <Text style={styles.modalItemSubtitle}>{item.category}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 Select Location</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLocationModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={wildlifeLocations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (item.name === 'Custom Location') {
                      setShowLocationModal(false);
                      Alert.prompt(
                        'Custom Location',
                        'Enter the location name:',
                        (text) => {
                          if (text) handleInputChange('location', text);
                        }
                      );
                    } else {
                      handleInputChange('location', item.name);
                      setShowLocationModal(false);
                    }
                  }}>
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemEmoji}>{item.emoji}</Text>
                    <View>
                      <Text style={styles.modalItemTitle}>{item.name}</Text>
                      <Text style={styles.modalItemSubtitle}>{item.region}</Text>
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
        onRequestClose={() => setShowStatusModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚠️ Conservation Status</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStatusModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={conservationStatuses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    handleInputChange('status', item.name);
                    setShowStatusModal(false);
                  }}>
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemEmoji}>{item.emoji}</Text>
                    <View style={styles.flex1}>
                      <Text style={[styles.modalItemTitle, { color: item.color }]}>
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
    backgroundColor: '#f8f9fa',
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#757575',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalItemEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  flex1: {
    flex: 1,
  },
});

export default InsertAnimalsScreen;