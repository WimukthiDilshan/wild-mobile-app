import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const MainScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.appName}>🌲 Forest Guardian</Text>
        <Text style={styles.subtitle}>Wildlife Monitoring & Protection System</Text>
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
            <TouchableOpacity
              style={[styles.actionButton, styles.insertButton]}
              onPress={() => navigation.navigate('InsertAnimals')}
              activeOpacity={0.8}>
              <Text style={styles.buttonIcon}>🦁</Text>
              <Text style={styles.buttonTitle}>Insert Animals</Text>
              <Text style={styles.buttonSubtitle}>Add new wildlife data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.poachingAnalyticsButton]}
              onPress={() => navigation.navigate('PoachingAnalytics')}
              activeOpacity={0.8}>
              <Text style={styles.buttonIcon}>🛡️</Text>
              <Text style={styles.buttonTitle}>Poaching Analytics</Text>
              <Text style={styles.buttonSubtitle}>Monitor protection data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.addPoachingButton]}
              onPress={() => navigation.navigate('AddPoaching')}
              activeOpacity={0.8}>
              <Text style={styles.buttonIcon}>🚨</Text>
              <Text style={styles.buttonTitle}>Add Poaching</Text>
              <Text style={styles.buttonSubtitle}>Report incidents & alerts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.animalsDataButton]}
              onPress={() => navigation.navigate('Analyst')}
              activeOpacity={0.8}>
              <Text style={styles.buttonIcon}>📊</Text>
              <Text style={styles.buttonTitle}>Animals Data</Text>
              <Text style={styles.buttonSubtitle}>View animal analytics</Text>
            </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#2E7D32',
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
  animalsDataButton: {
    backgroundColor: '#FF9800',
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