import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import MainScreen from './src/screens/MainScreen';
import HomeScreen from './src/screens/HomeScreen';
import AnalystScreen from './src/screens/AnalystScreen';
import AnimalDetailsScreen from './src/screens/AnimalDetailsScreen';
import AnimalAnalyticsScreen from './src/screens/AnimalAnalyticsScreen';
import InsertAnimalsScreen from './src/screens/InsertAnimalsScreen';
import PoachingAnalyticsScreen from './src/screens/PoachingAnalyticsScreen';
import AddPoachingScreen from './src/screens/AddPoachingScreen';
import PoachingAlertsScreen from './src/screens/PoachingAlertsScreen';
import PoachingAlertDetailsScreen from './src/screens/PoachingAlertDetailsScreen';
import ParkManagementScreen from './src/screens/ParkManagementScreen';
import UserPreferences from './src/screens/UserPreferencesScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';
import SafariStartScreen from './src/screens/SafariStartScreen';
import SafariMapScreen from './src/screens/SafariMapScreen';

const Stack = createNativeStackNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.logoEmoji}>🌲</Text>
    <Text style={styles.loadingTitle}>Forest Monitor</Text>
    <ActivityIndicator size="large" color="#4CAF50" style={styles.loadingSpinner} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

// Authentication Navigator
const AuthNavigator = () => (
  <Stack.Navigator
    initialRouteName="Login"
    screenOptions={{
      headerStyle: {
        backgroundColor: '#4CAF50',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}>
    <Stack.Screen 
      name="Login" 
      component={LoginScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="SignUp" 
      component={SignUpScreen} 
      options={{ 
        title: '🌟 Create Account',
        headerBackTitle: 'Back',
      }}
    />
  </Stack.Navigator>
);

// Main App Navigator (for authenticated users)
const AppNavigator = () => {
  const { hasPermission, userData, USER_ROLES } = useAuth();
  
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen 
        name="Main" 
        component={MainScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: '🌲 Forest Monitor' }}
      />
      {hasPermission('canViewAnalytics') && (
        <Stack.Screen 
          name="Analyst" 
          component={AnalystScreen} 
          options={{ title: '📊 Analytics Dashboard' }}
        />
      )}
      <Stack.Screen 
        name="AnimalDetails" 
        component={AnimalDetailsScreen} 
        options={{ title: '🦁 Animal Details' }}
      />
      <Stack.Screen
        name="PoachingAlertDetails"
        component={PoachingAlertDetailsScreen}
        options={{ title: '🚨 Poaching Alert' }}
      />
      {hasPermission('canViewAnalytics') && (
        <Stack.Screen 
          name="AnimalAnalytics" 
          component={AnimalAnalyticsScreen} 
          options={{ title: '📊 Animal Analytics' }}
        />
      )}
      {hasPermission('canAddAnimals') && (
        <Stack.Screen 
          name="InsertAnimals" 
          component={InsertAnimalsScreen} 
          options={{ title: '🦁 Insert Animals' }}
        />
      )}
      {hasPermission('canViewAnalytics') && (
        <Stack.Screen 
          name="PoachingAnalytics" 
          component={PoachingAnalyticsScreen} 
          options={{ title: '⚠️ Poaching Analytics' }}
        />
      )}
      
      {userData?.role === USER_ROLES.OFFICER && (
        <Stack.Screen
          name="PoachingAlerts"
          component={PoachingAlertsScreen}
          options={{ title: '🚨 Poaching Alerts' }}
        />
      )}
      {hasPermission('canAddPoaching') && (
        <Stack.Screen 
          name="AddPoaching" 
          component={AddPoachingScreen} 
          options={{ title: '🚨 Report Poaching' }}
        />
      )}
      {hasPermission('canAccessParkManagement') && (
        <Stack.Screen 
          name="ParkManagement" 
          component={ParkManagementScreen} 
          options={{ headerShown: false }}
        />
      )}
      {hasPermission('canGetPreferences') && (
        <Stack.Screen 
          name="PreferenceManagement" 
          component={UserPreferences} 
          options={{ headerShown: false }}
        />
      )}
      {hasPermission('canGetPreferences') && (
        <Stack.Screen 
          name="Recommendations" 
          component={RecommendationsScreen} 
          options={{ headerShown: false }}
        />
      )}
      {/* DebugPush screen removed for production */}
      <Stack.Screen 
        name="SafariStart" 
        component={SafariStartScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SafariMap" 
        component={SafariMapScreen} 
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  );
};

// Main App Component
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      <NavigationContainer>
        {user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 40,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
  },
});

export default App;