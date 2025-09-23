import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const PoachingScreen = ({ navigation }) => {
  const handleReportIncident = () => {
    Alert.alert('Emergency Report', 'This feature will connect to emergency services and wildlife protection units.');
  };

  const handleViewAlerts = () => {
    Alert.alert('Coming Soon', 'Poaching alerts and monitoring features will be implemented soon!');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚨 Poaching Monitor</Text>
          <Text style={styles.headerSubtitle}>
            Report incidents and monitor wildlife protection
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.emergencyCard}>
            <Text style={styles.emergencyTitle}>🆘 Emergency Reporting</Text>
            <Text style={styles.emergencyText}>
              Quick access to report wildlife crimes and suspicious activities
            </Text>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={handleReportIncident}>
              <Text style={styles.emergencyButtonText}>REPORT INCIDENT</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Poaching Prevention Features</Text>
            <Text style={styles.infoText}>
              This system will provide:
            </Text>
            <Text style={styles.bulletPoint}>• Real-time incident reporting</Text>
            <Text style={styles.bulletPoint}>• GPS location tracking</Text>
            <Text style={styles.bulletPoint}>• Emergency contact system</Text>
            <Text style={styles.bulletPoint}>• Wildlife crime database</Text>
            <Text style={styles.bulletPoint}>• Alert notifications</Text>
            <Text style={styles.bulletPoint}>• Patrol route planning</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewAlerts}>
            <Text style={styles.actionButtonText}>📱 View Active Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back to Main</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  content: {
    padding: 20,
  },
  emergencyCard: {
    backgroundColor: '#FFEBEE',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 10,
  },
  emergencyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  emergencyButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 10,
  },
  actionButton: {
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionButtonText: {
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
});

export default PoachingScreen;