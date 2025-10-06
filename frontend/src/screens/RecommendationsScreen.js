import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from 'axios';

export default function RecommendationsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { topParks = [] } = route.params || {};

  const parksArray = Array.isArray(topParks) ? topParks : [];

  const [recommendedParks, setRecommendedParks] = useState([]);
  const userInput = route.params?.userInput || {}; // adjust as needed

  const fetchRecommendations = async () => {
    try {
      const res = await axios.post('/api/recommend', userInput);
      if (res.data.success) {
        setRecommendedParks(res.data.data.topParks);
      }
    } catch (e) {
      // handle error if needed
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recommended Parks</Text>
      <FlatList
        data={parksArray}
        keyExtractor={(item, idx) =>
          item.id ? item.id : item.name ? item.name : idx.toString()
        }
        renderItem={({ item, index }) => (
          <View style={styles.parkCard}>
            <Text style={styles.parkName}>
              {index + 1}. {item.name || item.park || "Unnamed Park"}
            </Text>
            {item.location && (
              <Text style={styles.detail}>📍 {item.location}</Text>
            )}
            {item.area && (
              <Text style={styles.detail}>📏 Area: {item.area} km²</Text>
            )}
            {item.category && (
              <Text style={styles.detail}>🏷️ Category: {item.category}</Text>
            )}
            {item.status && (
              <Text style={styles.detail}>🔖 Status: {item.status}</Text>
            )}
            {item.activities && item.activities.length > 0 && (
              <Text style={styles.detail}>
                🎯 Activities: {item.activities.join(", ")}
              </Text>
            )}
            {item.animalTypes && item.animalTypes.length > 0 && (
              <Text style={styles.detail}>
                🐾 Animal Types: {item.animalTypes.join(", ")}
              </Text>
            )}
            {item.environments && item.environments.length > 0 && (
              <Text style={styles.detail}>
                🌳 Environments: {item.environments.join(", ")}
              </Text>
            )}
            {item.experienceLevels && item.experienceLevels.length > 0 && (
              <Text style={styles.detail}>
                🏕️ Experience Levels: {item.experienceLevels.join(", ")}
              </Text>
            )}
            {item.description && (
              <Text style={styles.detail}>{item.description}</Text>
            )}
            {item.photoUrls && item.photoUrls.length > 0 && (
              <ScrollView horizontal style={{ marginTop: 8 }}>
                {item.photoUrls.map((url, idx) => (
                  <Image
                    key={`${item.id || index}-img-${idx}`}
                    source={{ uri: url }}
                    style={{ width: 100, height: 80, marginRight: 8, borderRadius: 8 }}
                  />
                ))}
              </ScrollView>
            )}
            {item.score !== undefined && (
              <Text style={styles.score}>Score: {item.score.toFixed(3)}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No recommendations found.</Text>
        }
        contentContainerStyle={parksArray.length === 0 ? undefined : { paddingBottom: 24 }}
      />
      <TouchableOpacity
        style={[styles.largeButton, styles.buttonPrimary]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Back to Preferences</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#f8f8f8" },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 18,
    textAlign: "center",
    color: "#388e3c",
    letterSpacing: 0.5,
  },
  parkCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  parkName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#388e3c",
    marginBottom: 6,
  },
  detail: {
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
  },
  score: {
    fontSize: 16,
    color: "#222",
    fontWeight: "500",
  },
  empty: {
    textAlign: "center",
    color: "#888",
    fontSize: 16,
    marginVertical: 32,
  },
  largeButton: {
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 8,
    elevation: 2,
    marginTop: 12,
  },
  buttonPrimary: {
    backgroundColor: "#388e3c",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});