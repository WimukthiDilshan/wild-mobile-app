import React, { useState } from 'react';
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
} from 'react-native';
import ApiService from '../services/ApiService';

const AddPoachingScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    species: '',
    location: '',
    date: '',
    severity: 'Medium',
    description: '',
    reportedBy: '',
  });
  const [loading, setLoading] = useState(false);

  const severityOptions = ['Low', 'Medium', 'High'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      await ApiService.reportPoachingIncident(formData);
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
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="e.g., Amazon Rainforest"
              placeholderTextColor="#999"
            />
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
});

export default AddPoachingScreen;
