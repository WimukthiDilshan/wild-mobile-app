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
import { useAuth } from '../contexts/AuthContext';

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
});

export default AddPoachingScreen;
