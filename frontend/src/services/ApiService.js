// API service for communicating with the backend
// Use 10.0.2.2 for Android emulator (maps to localhost on host machine)
// Use localhost for iOS simulator and physical devices on same network
import auth from '@react-native-firebase/auth';
import { NativeModules, Platform } from 'react-native';

// Default fallback (emulator)
let BASE_URL = 'http://10.0.2.2:3000/api';

function hostnameFromScriptURL() {
  try {
    const scriptURL = NativeModules && NativeModules.SourceCode && NativeModules.SourceCode.scriptURL;
    if (!scriptURL) return null;
    // e.g. http://192.168.8.111:8081/index.bundle?platform=android
    const m = scriptURL.match(/^https?:\/\/([^:/]+)(?::(\d+))?/i);
    if (!m) return null;
    return m[1];
  } catch (e) {
    return null;
  }
}

// Try to resolve a useful BASE_URL in dev: prioritize Metro's scriptURL host so
// the app running on the device will talk to the developer machine. Fall back
// to config.json and then to the emulator default.
if (__DEV__) {
  const host = hostnameFromScriptURL();
  if (host) {
    const resolvedHost = (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) ? '10.0.2.2' : host;
    BASE_URL = `http://${resolvedHost}:3000/api`;
    // eslint-disable-next-line no-console
    console.log('🌐 Detected local IP:', BASE_URL);
  }
}



try {
  // require at runtime; bundler will include config.json
  // Edit frontend/config.json to change BASE_URL for physical devices
  // e.g. "http://192.168.8.111:3000/api"
  // If config.json is missing or invalid, we fall back to 10.0.2.2
  // Note: require path is relative to this file
  // eslint-disable-next-line global-require
  const appConfig = require('../../config.json');
  if (appConfig && appConfig.BASE_URL) {
    BASE_URL = appConfig.BASE_URL;
  }
} catch (e) {
  // ignore and use default
}

class ApiService {
  async getAuthHeaders() {
    try {
      const user = auth().currentUser;
      if (user) {
        const token = await user.getIdToken();
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
      }
      return {
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  }
  async fetchAnimals() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/animals`, { headers });
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch animals');
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
      throw error;
    }
  }

  async fetchAnimalById(id) {
    try {
      const response = await fetch(`${BASE_URL}/animals/${id}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch animal');
      }
    } catch (error) {
      console.error('Error fetching animal:', error);
      throw error;
    }
  }

  async fetchAnimalsByLocation(location) {
    try {
      const response = await fetch(`${BASE_URL}/animals/location/${encodeURIComponent(location)}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch animals by location');
      }
    } catch (error) {
      console.error('Error fetching animals by location:', error);
      throw error;
    }
  }

  async fetchAnalytics() {
    try {
      const response = await fetch(`${BASE_URL}/analytics`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  async addAnimal(animalData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/animals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(animalData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to add animal');
      }
    } catch (error) {
      console.error('Error adding animal:', error);
      throw error;
    }
  }

  // Poaching incidents methods
  async fetchPoachingIncidents() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/poaching`, { headers });
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch poaching incidents');
      }
    } catch (error) {
      console.error('Error fetching poaching incidents:', error);
      throw error;
    }
  }

  async fetchPoachingAnalytics() {
    try {
      const response = await fetch(`${BASE_URL}/poaching/analytics`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch poaching analytics');
      }
    } catch (error) {
      console.error('Error fetching poaching analytics:', error);
      throw error;
    }
  }

  async reportPoachingIncident(incidentData) {
    try {
      const headers = await this.getAuthHeaders();
      let response;

      // Media support removed: always send JSON payload to backend
      response = await fetch(`${BASE_URL}/poaching`, {
        method: 'POST',
        headers,
        body: JSON.stringify(incidentData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to report poaching incident');
      }
    } catch (error) {
      console.error('Error reporting poaching incident:', error);
      throw error;
    }
  }

  async registerDeviceToken(token) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/device-token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (data && data.success) return true;
      throw new Error(data.error || 'Failed to register device token');
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  }

  async fetchPoachingIncidentById(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/poaching/${encodeURIComponent(id)}`, { headers });
      const data = await response.json();
      if (data.success) return data.data;
      throw new Error(data.error || 'Failed to fetch incident');
    } catch (error) {
      console.error('Error fetching incident by id:', error);
      throw error;
    }
  }

  async updatePoachingStatus(id, update) {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${BASE_URL}/poaching/${encodeURIComponent(id)}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(update),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        console.error('Update poaching status failed', { url, status: response.status, text });
        throw new Error((data && data.error) || `Request failed: ${response.status}`);
      }

      if (data && data.success) return data.data;
      // If response was ok but shape unexpected, return parsed data or raw text
      return data || text;
    } catch (error) {
      console.error('Error updating poaching status:', error);
      throw error;
    }
  }

  // Park management methods
  async fetchParks() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/parks`, { headers });
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch parks');
      }
    } catch (error) {
      console.error('Error fetching parks:', error);
      throw error;
    }
  }

  async fetchParkById(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/parks/${id}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch park');
      }
    } catch (error) {
      console.error('Error fetching park:', error);
      throw error;
    }
  }

  async addPark(parkData) {
    try {
      const headers = await this.getAuthHeaders();
      // parkData should include photoUrl if present
      const response = await fetch(`${BASE_URL}/parks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(parkData), // photoUrl included
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to add park');
      }
    } catch (error) {
      console.error('Error adding park:', error);
      throw error;
    }
  }

  async updatePark(id, parkData) {
    try {
      const headers = await this.getAuthHeaders();
      // parkData should include photoUrl if present
      const response = await fetch(`${BASE_URL}/parks/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(parkData), // photoUrl included
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update park');
      }
    } catch (error) {
      console.error('Error updating park:', error);
      throw error;
    }
  }

  async deletePark(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/parks/${id}`, {
        method: 'DELETE',
        headers,
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to delete park');
      }
    } catch (error) {
      console.error('Error deleting park:', error);
      throw error;
    }
  }

  async fetchParksByCategory(category) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/parks/category/${encodeURIComponent(category)}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch parks by category');
      }
    } catch (error) {
      console.error('Error fetching parks by category:', error);
      throw error;
    }
  }
  async getRecommendedParks(featureVector) {
  try {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${BASE_URL}/recommend`, {
      method: 'POST',
      headers,
      body: JSON.stringify(featureVector),
    });

    const data = await response.json();
    if (data.success) {
      return data.data.topParks; // [{parkName, score}, ...]
    } else {
      throw new Error(data.error || 'Failed to get recommendations');
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}


}

export default new ApiService();