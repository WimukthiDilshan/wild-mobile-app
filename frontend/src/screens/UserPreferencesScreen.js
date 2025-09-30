import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Button,
  ActivityIndicator,
} from "react-native";
import ApiService from "../services/ApiService"; // Adjust path
import { useNavigation, useRoute } from "@react-navigation/native";

const animals = ["Leopard", "Elephant", "Bird", "Crocodile", "Sloth Bear"];
const activities = ["Safari Rides", "Bird Watching", "Camping", "Hiking"];
const environments = ["Forest", "Wetland", "Mountain", "Coastal"];
const experienceLevels = [
  "Family-Friendly",
  "Adventure Seekers",
  "Relaxation & Nature",
];

export default function UserPreferencesScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Optional: Receive pre-selected preferences via route.params
  const initialPreferences = route.params?.userPreferences || {
    animals: [],
    activities: [],
    environments: [],
    experience: [],
  };

  const [userPreferences, setUserPreferences] = useState(initialPreferences);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle selection helper
  const toggleSelection = (category, value) => {
    setUserPreferences((prev) => {
      const selected = prev[category];
      if (selected.includes(value)) {
        return { ...prev, [category]: selected.filter((item) => item !== value) };
      } else {
        return { ...prev, [category]: [...selected, value] };
      }
    });
  };

  // Render buttons for each category
  const renderOptions = (category, options) => {
    return options.map((option) => {
      const selected = userPreferences[category].includes(option);
      return (
        <TouchableOpacity
          key={option}
          style={[styles.optionButton, selected && styles.optionButtonSelected]}
          onPress={() => toggleSelection(category, option)}
        >
          <Text style={selected ? styles.optionTextSelected : styles.optionText}>
            {option}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  // Handle getting recommendations
  const handleGetRecommendations = async () => {
    setIsLoading(true);
    try {
      const featureVector = {
        leopard: userPreferences.animals.includes("Leopard") ? 1 : 0,
        elephant: userPreferences.animals.includes("Elephant") ? 1 : 0,
        bird: userPreferences.animals.includes("Bird") ? 1 : 0,
        crocodile: userPreferences.animals.includes("Crocodile") ? 1 : 0,
        sloth_bear: userPreferences.animals.includes("Sloth Bear") ? 1 : 0,
        safari: userPreferences.activities.includes("Safari Rides") ? 1 : 0,
        birdwatching: userPreferences.activities.includes("Bird Watching") ? 1 : 0,
        camping: userPreferences.activities.includes("Camping") ? 1 : 0,
        hiking: userPreferences.activities.includes("Hiking") ? 1 : 0,
        forest: userPreferences.environments.includes("Forest") ? 1 : 0,
        wetland: userPreferences.environments.includes("Wetland") ? 1 : 0,
        mountain: userPreferences.environments.includes("Mountain") ? 1 : 0,
        coastal: userPreferences.environments.includes("Coastal") ? 1 : 0,
        family: userPreferences.experience.includes("Family-Friendly") ? 1 : 0,
        adventure: userPreferences.experience.includes("Adventure Seekers") ? 1 : 0,
        relaxation: userPreferences.experience.includes("Relaxation & Nature") ? 1 : 0,
      };

      const topParks = await ApiService.getRecommendedParks(featureVector);

      console.log("Top recommended parks:", topParks);
      // Navigate to Recommendations screen, passing topParks
      navigation.navigate("Recommendations", { topParks });
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      alert("Failed to get park recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Which animals do you like?</Text>
      <View style={styles.optionsContainer}>{renderOptions("animals", animals)}</View>

      <Text style={styles.heading}>Which activities interest you?</Text>
      <View style={styles.optionsContainer}>{renderOptions("activities", activities)}</View>

      <Text style={styles.heading}>Preferred environment?</Text>
      <View style={styles.optionsContainer}>{renderOptions("environments", environments)}</View>

      <Text style={styles.heading}>Experience Level</Text>
      <View style={styles.optionsContainer}>{renderOptions("experience", experienceLevels)}</View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#4caf50" />
      ) : (
        <Button title="Get Recommendations" onPress={handleGetRecommendations} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  heading: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  optionsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  optionButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 20,
    margin: 5,
  },
  optionButtonSelected: {
    backgroundColor: "#4caf50",
    borderColor: "#4caf50",
  },
  optionText: { color: "#000" },
  optionTextSelected: { color: "#fff", fontWeight: "bold" },
});
