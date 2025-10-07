import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const SafariMapScreen = ({ navigation, route }) => {
  const { park } = route.params || {};
  
  const [mapRegion] = useState({
    latitude: park?.coordinates?.latitude || 6.9022,
    longitude: park?.coordinates?.longitude || 79.9633,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safari Map</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Park Info Banner */}
      {park && (
        <View style={styles.parkInfoBanner}>
          <Text style={styles.parkInfoText}>🏞️ {park.name}</Text>
          <Text style={styles.parkLocationText}>📍 {park.location}</Text>
        </View>
      )}

      {/* Map View */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {/* Park Location Marker */}
        {park?.coordinates && (
          <Marker
            coordinate={{
              latitude: park.coordinates.latitude,
              longitude: park.coordinates.longitude,
            }}
            title={park.name}
            description={park.location}
          >
            <View style={styles.parkMarker}>
              <Text style={styles.parkMarkerText}>🏞️</Text>
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FFA726',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 60,
  },
  parkInfoBanner: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  parkInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  parkLocationText: {
    fontSize: 14,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  parkMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 167, 38, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  parkMarkerText: {
    fontSize: 24,
  },
});

export default SafariMapScreen;

