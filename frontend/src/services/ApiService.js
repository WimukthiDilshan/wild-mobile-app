// API service for communicating with the backend
// Use 10.0.2.2 for Android emulator (maps to localhost on host machine)
// Use localhost for iOS simulator and physical devices on same network
//const BASE_URL = 'http://localhost/api';
const BASE_URL = 'http://192.168.149.134:3000/api';

class ApiService {
  async fetchAnimals() {
    try {
      const response = await fetch(`${BASE_URL}/animals`);
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
      const response = await fetch(`${BASE_URL}/animals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${BASE_URL}/poaching`);
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
      const response = await fetch(`${BASE_URL}/poaching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
}

export default new ApiService();