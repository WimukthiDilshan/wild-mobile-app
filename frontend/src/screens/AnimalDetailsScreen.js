import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const AnimalDetailsScreen = ({ route, navigation }) => {
  const { animal } = route.params;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Critically Endangered':
        return '#F44336';
      case 'Endangered':
        return '#FF9800';
      case 'Vulnerable':
        return '#FF5722';
      case 'Near Threatened':
        return '#FFC107';
      default:
        return '#4CAF50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Critically Endangered':
        return '🚨';
      case 'Endangered':
        return '⚠️';
      case 'Vulnerable':
        return '🔶';
      case 'Near Threatened':
        return '⚡';
      default:
        return '✅';
    }
  };

  const showMoreInfo = () => {
    Alert.alert(
      'Conservation Status Info',
      `${animal.status}\n\nThis classification indicates the species' risk of extinction. Conservation efforts are ongoing to protect and monitor these animals in their natural habitat.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.animalName}>{animal.name}</Text>
          <TouchableOpacity
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(animal.status) }
            ]}
            onPress={showMoreInfo}>
            <Text style={styles.statusIcon}>{getStatusIcon(animal.status)}</Text>
            <Text style={styles.statusText}>{animal.status}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🦁</Text>
            <Text style={styles.statNumber}>{animal.count}</Text>
            <Text style={styles.statLabel}>Population Count</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>📋 Animal Information</Text>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🌍 Location:</Text>
              <Text style={styles.detailValue}>{animal.location}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🏞️ Habitat:</Text>
              <Text style={styles.detailValue}>{animal.habitat}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📊 Conservation Status:</Text>
              <Text style={[
                styles.detailValue,
                { color: getStatusColor(animal.status) }
              ]}>
                {animal.status}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🔢 Population Count:</Text>
              <Text style={styles.detailValue}>{animal.count} individuals</Text>
            </View>
          </View>
        </View>

        {/* Conservation Info */}
        <View style={styles.conservationContainer}>
          <Text style={styles.sectionTitle}>🌱 Conservation Notes</Text>
          <View style={styles.conservationCard}>
            <Text style={styles.conservationText}>
              This {animal.name.toLowerCase()} population is being monitored as part of our forest conservation program. 
              The current count of {animal.count} individuals represents our latest survey data from the {animal.location}.
            </Text>
            
            <Text style={styles.conservationText}>
              Habitat: The species thrives in {animal.habitat.toLowerCase()} environments, which are crucial for their survival and breeding patterns.
            </Text>
            
            {animal.status !== 'Least Concern' && (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  ⚠️ This species requires special attention due to its {animal.status} conservation status.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Analyst')}>
            <Text style={styles.actionButtonText}>📊 View Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.goBack()}>
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              ← Back to List
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data last updated: {new Date().toLocaleDateString()}
          </Text>
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
  headerCard: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  animalName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: 'white',
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    width: 140,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontWeight: '600',
  },
  conservationContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  conservationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  conservationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertBox: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginTop: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  actionContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2196F3',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default AnimalDetailsScreen;