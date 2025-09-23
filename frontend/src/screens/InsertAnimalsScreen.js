import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const InsertAnimalsScreen = ({ navigation }) => {
  const handleAddAnimal = () => {
    Alert.alert('Coming Soon', 'Animal insertion feature will be implemented soon!');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🦁 Insert Animals</Text>
          <Text style={styles.headerSubtitle}>
            Add new wildlife data to the monitoring system
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Add Wildlife Data</Text>
            <Text style={styles.infoText}>
              This feature will allow you to:
            </Text>
            <Text style={styles.bulletPoint}>• Add new animal species</Text>
            <Text style={styles.bulletPoint}>• Record animal counts</Text>
            <Text style={styles.bulletPoint}>• Set location information</Text>
            <Text style={styles.bulletPoint}>• Update conservation status</Text>
            <Text style={styles.bulletPoint}>• Add habitat details</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddAnimal}>
            <Text style={styles.actionButtonText}>+ Add New Animal</Text>
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
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#4CAF50',
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

export default InsertAnimalsScreen;