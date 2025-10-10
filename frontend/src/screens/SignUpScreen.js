import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/ApiService';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    organization: '',
    phoneNumber: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [parks, setParks] = useState([]);
  const [parksLoading, setParksLoading] = useState(false);
  const [parksError, setParksError] = useState(null);
  const [showParkModal, setShowParkModal] = useState(false);
  
  const { signUp, USER_ROLES } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Role options with detailed descriptions
  const roleOptions = [
    {
      id: USER_ROLES.VISITOR,
      name: 'Visitor',
      emoji: '👁️',
      description: 'View wildlife data and conservation information',
      color: '#2196F3',
      permissions: ['View animal data', 'View poaching reports', 'Access educational content'],
    },
    {
      id: USER_ROLES.DRIVER,
      name: 'Forest Driver',
      emoji: '🚗',
      description: 'Field personnel who can report wildlife sightings and incidents',
      color: '#FF9800',
      permissions: ['Report animal sightings', 'Report poaching incidents', 'Update field data'],
    },
    {
      id: USER_ROLES.RESEARCHER,
      name: 'Researcher',
      emoji: '🔬',
      description: 'Scientists and conservationists with full system access',
      color: '#4CAF50',
      permissions: ['Full data access', 'Advanced analytics', 'Research tools', 'Data export'],
    },
    {
      id: USER_ROLES.OFFICER,
      name: 'Wildlife Officer',
      emoji: '🛡️',
      description: 'Field officer responsible for enforcement and incident response',
      color: '#8E44AD',
      permissions: ['Report and manage incidents', 'Access enforcement tools', 'View analytics'],
    },
  ];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
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
    if (!formData.displayName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }
    if (!formData.password.trim()) {
      Alert.alert('Validation Error', 'Please enter a password.');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return false;
    }
    if (!formData.role) {
      Alert.alert('Validation Error', 'Please select your role.');
      return false;
    }
    // If officer role selected, ensure park is chosen so we can route alerts correctly
    if (formData.role === USER_ROLES.OFFICER) {
      if (!formData.parkId) {
        Alert.alert('Validation Error', 'As an officer you must select the park you are responsible for.');
        return false;
      }
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const profileData = {
        displayName: formData.displayName.trim(),
        role: formData.role,
        organization: formData.organization.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        // If officer selected, include park assignment so backend can send alerts to relevant officers
        parkId: formData.parkId || null,
        parkName: formData.parkName || null,
      };

      const result = await signUp(formData.email.trim(), formData.password, profileData);
      
      if (result.success) {
        Alert.alert(
          'Welcome to Forest Monitor! 🎉',
          `Your account has been created successfully as a ${roleOptions.find(r => r.id === formData.role)?.name}.`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                // Navigation will be handled by App.js based on auth state
              },
            },
          ]
        );
      } else {
        Alert.alert('Sign Up Failed', result.error || 'An error occurred during account creation.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedRole = () => {
    return roleOptions.find(role => role.id === formData.role);
  };

  // Fetch parks when officer role is selected
  React.useEffect(() => {
    let mounted = true;
    const loadParks = async () => {
      if (formData.role !== USER_ROLES.OFFICER) {
        // Clear any previously selected park when role is not officer
        setParks([]);
        setParksError(null);
        handleInputChange('parkId', '');
        handleInputChange('parkName', '');
        return;
      }
      setParksLoading(true);
      setParksError(null);
      try {
        const allParks = await ApiService.fetchParks();
        if (!mounted) return;
        // Optionally filter to active parks only
        const active = allParks && Array.isArray(allParks) ? allParks.filter(p => p.status === 'Active' || !p.status) : allParks;
        setParks(active);
      } catch (e) {
        console.error('Failed to load parks for officer selection', e);
        setParksError(e.message || 'Failed to load parks');
        Alert.alert('Error', 'Failed to load parks. Please try again later.');
      } finally {
        if (mounted) setParksLoading(false);
      }
    };

    loadParks();
    return () => { mounted = false; };
  }, [formData.role]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.logoEmoji}>🌲</Text>
            <Text style={styles.title}>Join Forest Monitor</Text>
            <Text style={styles.subtitle}>Create your wildlife conservation account</Text>
          </View>

          {/* Sign Up Form */}
          <View style={styles.formContainer}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>👤 Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={formData.displayName}
                onChangeText={(value) => handleInputChange('displayName', value)}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📧 Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🔒 Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password (min 6 chars)"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🔐 Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🎯 Role</Text>
              <TouchableOpacity
                style={[styles.input, styles.dropdownInput]}
                onPress={() => setShowRoleModal(true)}>
                {formData.role ? (
                  <View style={styles.selectedRoleContainer}>
                    <Text style={styles.selectedRoleEmoji}>
                      {getSelectedRole()?.emoji}
                    </Text>
                    <Text style={styles.selectedRoleText}>
                      {getSelectedRole()?.name}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select your role</Text>
                )}
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Park Selection for Officers */}
            {formData.role === USER_ROLES.OFFICER && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>🏞️ Assigned Park</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dropdownInput]}
                  onPress={() => setShowParkModal(true)}>
                  {formData.parkId ? (
                    <View style={styles.selectedRoleContainer}>
                      <Text style={styles.selectedRoleText}>{formData.parkName}</Text>
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>{parksLoading ? 'Loading parks...' : 'Select a park'}</Text>
                  )}
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
                {parksError && <Text style={{ color: 'red', marginTop: 6 }}>{parksError}</Text>}
              </View>
            )}

            {/* Organization Input (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>🏢 Organization (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Wildlife Research Institute"
                placeholderTextColor="#999"
                value={formData.organization}
                onChangeText={(value) => handleInputChange('organization', value)}
                autoCapitalize="words"
              />
            </View>

            {/* Phone Number Input (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>📱 Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>🌟 Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Already have an account?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginButtonText}>🚀 Sign In</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎯 Choose Your Role</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowRoleModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={roleOptions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.roleOption, { borderColor: item.color }]}
                  onPress={() => {
                    handleInputChange('role', item.id);
                    setShowRoleModal(false);
                  }}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleEmoji}>{item.emoji}</Text>
                    <View style={styles.roleInfo}>
                      <Text style={[styles.roleName, { color: item.color }]}>{item.name}</Text>
                      <Text style={styles.roleDescription}>{item.description}</Text>
                    </View>
                  </View>
                  <View style={styles.rolePermissions}>
                    {item.permissions.map((permission, index) => (
                      <Text key={index} style={styles.rolePermission}>
                        • {permission}
                      </Text>
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Park Selection Modal (for Officers) */}
      <Modal
        visible={showParkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowParkModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏞️ Select Park</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowParkModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {parksLoading ? (
              <View style={{ padding: 20 }}>
                <ActivityIndicator size="small" />
                <Text style={{ marginTop: 12 }}>Loading parks...</Text>
              </View>
            ) : (
              <FlatList
                data={parks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.roleOption, { borderColor: '#ddd' }]}
                    onPress={() => {
                      handleInputChange('parkId', item.id);
                      handleInputChange('parkName', item.name || item.displayName || item.title || 'Unnamed Park');
                      setShowParkModal(false);
                    }}>
                    <View style={styles.roleHeader}>
                      <View style={styles.roleInfo}>
                        <Text style={[styles.roleName]}>{item.name}</Text>
                        {item.location ? <Text style={styles.roleDescription}>📍 {item.location}</Text> : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={{ padding: 20 }}>
                    <Text style={{ color: '#666' }}>No parks available</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 20,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedRoleEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  selectedRoleText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  signUpButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  signUpButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
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
  roleOption: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    backgroundColor: '#f8f9fa',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleEmoji: {
    fontSize: 28,
    marginRight: 15,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  rolePermissions: {
    marginTop: 8,
  },
  rolePermission: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
});

export default SignUpScreen;