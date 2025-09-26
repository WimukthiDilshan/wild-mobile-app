import Geolocation from '@react-native-community/geolocation';
import { Platform, Alert, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';

// Configure Geolocation with better default settings
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'auto',
  enableBackgroundLocationUpdates: false,
  locationProvider: 'auto'
});

class LocationService {
  static async isLocationServicesEnabled() {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          console.log('Location services check error:', error);
          resolve(false);
        },
        { timeout: 1000, maximumAge: 300000, enableHighAccuracy: false }
      );
    });
  }

  static async requestLocationPermission() {
    try {
      if (Platform.OS === 'android') {
        const fineLocationPermission = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        const coarseLocationPermission = await request(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);
        
        if (fineLocationPermission === RESULTS.GRANTED || coarseLocationPermission === RESULTS.GRANTED) {
          return true;
        } else if (fineLocationPermission === RESULTS.DENIED || coarseLocationPermission === RESULTS.DENIED) {
          Alert.alert(
            '🌍 Location Permission Required',
            'To accurately track wildlife locations, we need access to your device\'s GPS. This helps in precise wildlife monitoring and conservation efforts.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Grant Permission', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        } else {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  static async checkLocationPermission() {
    try {
      if (Platform.OS === 'android') {
        const fineLocationCheck = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        const coarseLocationCheck = await check(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION);
        
        return fineLocationCheck === RESULTS.GRANTED || coarseLocationCheck === RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  static async getCurrentLocation(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      ...options
    };

    return new Promise(async (resolve, reject) => {
      // Check and request permissions first
      const hasPermission = await this.checkLocationPermission();
      if (!hasPermission) {
        const permissionGranted = await this.requestLocationPermission();
        if (!permissionGranted) {
          reject(new Error('Location permission denied'));
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude, speed } = position.coords;
          const timestamp = position.timestamp;
          
          resolve({
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
            accuracy: accuracy || 0,
            altitude: altitude || 0,
            speed: speed || 0,
            timestamp: new Date(timestamp).toISOString(),
            formattedCoords: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            // Add wildlife-friendly location description
            description: this.getLocationDescription(latitude, longitude)
          });
        },
        (error) => {
          let errorMessage = 'Unable to get location';
          
          switch (error.code) {
            case 1:
              errorMessage = '🚫 Location access denied. Please enable location permissions in settings.';
              break;
            case 2:
              errorMessage = '📍 Location unavailable. Please check your GPS signal.';
              break;
            case 3:
              errorMessage = '⏱️ Location request timed out. Please try again.';
              break;
            default:
              errorMessage = `📍 Location error: ${error.message}`;
          }
          
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }

  static getLocationDescription(latitude, longitude) {
    // Simple geographical region detection for wildlife context
    if (latitude > 60) return '🏔️ Arctic Region';
    if (latitude > 45) return '🌲 Temperate Forest';
    if (latitude > 23.5) return '🌳 Temperate Zone';
    if (latitude > -23.5) return '🌴 Tropical Region';
    if (latitude > -45) return '🌿 Subtropical Zone';
    return '🐧 Antarctic Region';
  }

  static async watchLocation(onLocationUpdate, onError, options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      distanceFilter: 10, // Update every 10 meters
      ...options
    };

    // Check permissions first
    const hasPermission = await this.checkLocationPermission();
    if (!hasPermission) {
      const permissionGranted = await this.requestLocationPermission();
      if (!permissionGranted) {
        onError(new Error('Location permission denied'));
        return null;
      }
    }

    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude, speed } = position.coords;
        const timestamp = position.timestamp;
        
        onLocationUpdate({
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          accuracy: accuracy || 0,
          altitude: altitude || 0,
          speed: speed || 0,
          timestamp: new Date(timestamp).toISOString(),
          formattedCoords: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          description: this.getLocationDescription(latitude, longitude)
        });
      },
      (error) => {
        let errorMessage = 'Location tracking error';
        
        switch (error.code) {
          case 1:
            errorMessage = 'Location access denied';
            break;
          case 2:
            errorMessage = 'Location unavailable';
            break;
          case 3:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = error.message;
        }
        
        onError(new Error(errorMessage));
      },
      defaultOptions
    );

    return watchId;
  }

  static stopWatchingLocation(watchId) {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return parseFloat(distance.toFixed(2));
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Format coordinates for display
  static formatCoordinates(latitude, longitude, format = 'decimal') {
    if (format === 'dms') {
      return {
        latitude: this.decimalToDMS(latitude, 'lat'),
        longitude: this.decimalToDMS(longitude, 'lng'),
        formatted: `${this.decimalToDMS(latitude, 'lat')}, ${this.decimalToDMS(longitude, 'lng')}`
      };
    }
    
    return {
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    };
  }

  static decimalToDMS(decimal, type) {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = ((absolute - degrees - minutes / 60) * 3600).toFixed(2);
    
    let direction;
    if (type === 'lat') {
      direction = decimal >= 0 ? 'N' : 'S';
    } else {
      direction = decimal >= 0 ? 'E' : 'W';
    }
    
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  }
}

export default LocationService;