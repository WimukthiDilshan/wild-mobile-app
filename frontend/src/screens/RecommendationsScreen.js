import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";

export default function RecommendationsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
const { recommendations = [], parkDetails = [] } = route.params || {};

  const [recommendedParks, setRecommendedParks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:3000/api/recommend", userInput);

      if (res.data.success) {
        const { parkDetails = [], recommendations = [] } = res.data.data;

        // merge score with park details
        const merged = parkDetails.map((park) => {
          const match = recommendations.find((r) => r.park === park.name);
          return { ...park, score: match ? match.score : null };
        });

        setRecommendedParks(merged);
      }
    } catch (e) {
      console.error("Error fetching recommendations:", e);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (parkDetails.length && recommendations.length) {
    const merged = parkDetails.map((park) => {
      const match = recommendations.find(
        (r) => r.park.toLowerCase().trim() === park.name.toLowerCase().trim()
      );
      return { ...park, score: match ? match.score : null };
    });
    setRecommendedParks(merged);
  }
  setLoading(false);
}, []);

  const renderPark = ({ item, index }) => (
    <View style={styles.card}>
      {/* Park image */}
      <Image
        source={{
          uri:
            item.photoUrl ||
            (item.photoUrls && item.photoUrls[0]) ||
            "https://via.placeholder.com/400x250?text=No+Image",
        }}
        style={styles.image}
      />

      {/* Park details */}
      <View style={styles.content}>
        <Text style={styles.name}>
          {index + 1}. {item.name || "Unnamed Park"}
        </Text>

        {item.location && (
          <Text style={styles.detail}>📍 {item.location}</Text>
        )}
        {item.category && (
          <Text style={styles.detail}>🏷️ Category: {item.category}</Text>
        )}
        {item.status && (
          <Text style={styles.detail}>🔖 Status: {item.status}</Text>
        )}
        {item.activities?.length > 0 && (
          <Text style={styles.detail}>
            🎯 Activities: {item.activities.join(", ")}
          </Text>
        )}
        {item.animalTypes?.length > 0 && (
          <Text style={styles.detail}>
            🐾 Animal Types: {item.animalTypes.join(", ")}
          </Text>
        )}
        {item.environments?.length > 0 && (
          <Text style={styles.detail}>
            🌳 Environments: {item.environments.join(", ")}
          </Text>
        )}
        {item.experienceLevels?.length > 0 && (
          <Text style={styles.detail}>
            🏕️ Experience Levels: {item.experienceLevels.join(", ")}
          </Text>
        )}

        {item.score !== null && (
          <Text style={styles.score}>
            ⭐ Recommendation Score: {item.score.toFixed(3)}
          </Text>
        )}

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🌲 Recommended Parks for You</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#388e3c" style={{ marginTop: 50 }} />
      ) : recommendedParks.length > 0 ? (
        <FlatList
          data={recommendedParks}
          keyExtractor={(item, idx) => item.id || idx.toString()}
          renderItem={renderPark}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.empty}>No recommendations found.</Text>
      )}

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

// 🌿 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2e7d32",
    marginVertical: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 180,
  },
  content: {
    padding: 14,
  },
  name: {
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
  description: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
  },
  score: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1b5e20",
    marginTop: 6,
  },
  empty: {
    textAlign: "center",
    color: "#888",
    fontSize: 16,
    marginVertical: 40,
  },
  largeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#388e3c",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
