import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const MainScreen = ({ navigation }) => {
  const { user, userData, signOut, hasPermission, USER_ROLES, getRoleDisplayName, getRoleEmoji } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (!result.success) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeUser}>
              Welcome, {userData?.displayName || user?.displayName || user?.email || 'User'}!
            </Text>
            <Text style={styles.userRole}>
              Role: {userData?.role ? getRoleDisplayName(userData.role) : (user?.role || 'Unknown')}
            </Text>
          </View>
          {/** Show role emoji if available */}
          <View style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 20 }}>{getRoleEmoji(userData?.role)}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.appName}>🌲 Forest Guardian</Text>
        <Text style={styles.subtitle}>Wildlife Monitoring & Protection System</Text>
        
    {/* Start Safari Button - Only for Visitors and Drivers */}
      {(userData?.role === 'visitor' || userData?.role === 'driver') && (
          <TouchableOpacity 
            style={styles.startSafariButton} 
            onPress={() => navigation.navigate('SafariStart')}
            activeOpacity={0.8}
          >
            <Text style={styles.startSafariButtonText}>🦒 Start Safari</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome to Forest Guardian</Text>
          <Text style={styles.description}>
            Monitor, protect, and analyze forest wildlife data
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {userData?.role === USER_ROLES.OFFICER && (
              <TouchableOpacity
                style={[styles.actionButton, styles.poachingAlertsButton]}
                onPress={() => navigation.navigate('PoachingAlerts')}
                activeOpacity={0.8}>
                <Text style={styles.buttonIcon}>🚨</Text>
                <Text style={styles.buttonTitle}>Poaching Alerts</Text>
                <Text style={styles.buttonSubtitle}>View reported incidents</Text>
              </TouchableOpacity>
            )}

            {hasPermission('canAddAnimals') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.insertButton]}
                onPress={() => navigation.navigate('InsertAnimals')}
                activeOpacity={0.8}>
                <Text style={styles.buttonIcon}>🦁</Text>
                <Text style={styles.buttonTitle}>Insert Animals</Text>
                <Text style={styles.buttonSubtitle}>Add new wildlife data</Text>
              </TouchableOpacity>
            )}

            {hasPermission('canViewAnalytics') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.poachingAnalyticsButton]}
                onPress={() => navigation.navigate('PoachingAnalytics')}
                activeOpacity={0.8}>
                <Text style={styles.buttonIcon}>�️</Text>
                <Text style={styles.buttonTitle}>Poaching Analytics</Text>
                <Text style={styles.buttonSubtitle}>Monitor protection data</Text>
              </TouchableOpacity>
            )}

            {hasPermission('canAddPoaching') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.addPoachingButton]}
                onPress={() => navigation.navigate('AddPoaching')}
                activeOpacity={0.8}>
                <Text style={styles.buttonIcon}>🚨</Text>
                <Text style={styles.buttonTitle}>Add Poaching</Text>
                <Text style={styles.buttonSubtitle}>Report incidents & alerts</Text>
              </TouchableOpacity>
            )}

            {hasPermission('canViewAnalytics') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.animalsDataButton]}
                onPress={() => navigation.navigate('Analyst')}
                activeOpacity={0.8}>
                <Text style={styles.buttonIcon}>📊</Text>
                <Text style={styles.buttonTitle}>Animals Data</Text>
                <Text style={styles.buttonSubtitle}>View animal analytics</Text>
              </TouchableOpacity>
            )}

            {/* Park Management - Available for users with park permissions */}
            {hasPermission('canAccessParkManagement') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.homeButton]}
                onPress={() => navigation.navigate('ParkManagement')}
                activeOpacity={0.8}>
                <Text style={styles.buttonIcon}>�️</Text>
                <Text style={styles.buttonTitle}>Add Park Details</Text>
                <Text style={styles.buttonSubtitle}>Manage wildlife parks</Text>
              </TouchableOpacity>
            )}
            {hasPermission('canGetPreferences') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.insertButton]}
                onPress={() => navigation.navigate('PreferenceManagement')}
                activeOpacity={0.8}>
                <Text style={styles.buttonIcon}>🦁</Text>
                <Text style={styles.buttonTitle}>Get PReferences </Text>
                <Text style={styles.buttonSubtitle}>Add new wildlife data</Text>
              </TouchableOpacity>
            )}








          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Protecting Wildlife Through Technology</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: '#2E7D32',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  welcomeUser: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 14,
    color: '#A5D6A7',
    textTransform: 'capitalize',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A5D6A7',
    textAlign: 'center',
  },
  startSafariButton: {
    backgroundColor: '#FFA726',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startSafariButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    minHeight: height - 200, // Ensure enough space for all buttons
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#A5D6A7',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  actionButton: {
    width: width - 40,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  insertButton: {
    backgroundColor: '#4CAF50',
  },
  poachingAnalyticsButton: {
    backgroundColor: '#2196F3',
  },
  addPoachingButton: {
    backgroundColor: '#F44336',
  },
  poachingAlertsButton: {
    backgroundColor: '#D32F2F',
  },
  animalsDataButton: {
    backgroundColor: '#FF9800',
  },
  homeButton: {
    backgroundColor: '#9C27B0',
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#A5D6A7',
    fontStyle: 'italic',
  },
});

export default MainScreen;