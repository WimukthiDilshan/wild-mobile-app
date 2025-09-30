// API service for communicating with the backend
// Use 10.0.2.2 for Android emulator (maps to localhost on host machine)
// Use localhost for iOS simulator and physical devices on same network
import auth from '@react-native-firebase/auth';

const BASE_URL = 'http://10.0.2.2:3000/api';
//const BASE_URL = 'http://192.168.149.134:3000/api';

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
      const response = await fetch(`${BASE_URL}/poaching`, {
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
      const response = await fetch(`${BASE_URL}/parks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(parkData),
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
      const response = await fetch(`${BASE_URL}/parks/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(parkData),
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