import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import ApiService from "../services/ApiService";
import { useNavigation, useRoute } from "@react-navigation/native";

const animals = ["mammals", "birds", "reptiles", "amphibians", "insects"];
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

  const initialPreferences = route.params?.userPreferences || {
    animals: [],
    activities: [],
    environments: [],
    experience: [],
  };

  const [userPreferences, setUserPreferences] = useState(initialPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);

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

  const renderOptions = (category, options) => {
    return options.map((option) => {
      const selected = userPreferences[category].includes(option);
      return (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionCard,
            selected && styles.optionCardSelected
          ]}
          onPress={() => toggleSelection(category, option)}
          activeOpacity={0.85}
        >
          <Text style={selected ? styles.optionTextSelected : styles.optionText}>
            {option}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    try {
      const featureVector = {
        leopard: userPreferences.animals.includes("mammals") ? 1 : 0,
        elephant: userPreferences.animals.includes("birds") ? 1 : 0,
        bird: userPreferences.animals.includes("reptiles") ? 1 : 0,
        crocodile: userPreferences.animals.includes("amphibians") ? 1 : 0,
        sloth_bear: userPreferences.animals.includes("insects") ? 1 : 0,
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
const { recommendations, parkDetails } = await ApiService.getRecommendedParks(featureVector);

navigation.navigate("Recommendations", {
  recommendations,
  parkDetails,
});
    } catch (error) {
      alert("Failed to get park recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const panes = [
    {
      title: "Which animals do you like?",
      category: "animals",
      options: animals,
    },
    {
      title: "Which activities interest you?",
      category: "activities",
      options: activities,
    },
    {
      title: "Preferred environment?",
      category: "environments",
      options: environments,
    },
    {
      title: "Experience Level",
      category: "experience",
      options: experienceLevels,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progressContainer}>
        {panes.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              idx === step ? styles.progressDotActive : styles.progressDotInactive
            ]}
          />
        ))}
      </View>
      <Text style={styles.heading}>{panes[step].title}</Text>
      <View style={styles.optionsContainer}>
        {renderOptions(panes[step].category, panes[step].options)}
      </View>
      <View style={styles.buttonRow}>
        {step > 0 && (
          <TouchableOpacity
            style={[styles.largeButton, styles.buttonSecondary]}
            onPress={() => setStep(step - 1)}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < panes.length - 1 ? (
          <TouchableOpacity
            style={[styles.largeButton, styles.buttonPrimary]}
            onPress={() => setStep(step + 1)}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : isLoading ? (
          <ActivityIndicator size="large" color="#388e3c" style={{ flex: 1 }} />
        ) : (
          <TouchableOpacity
            style={[styles.largeButton, styles.buttonPrimary]}
            onPress={handleGetRecommendations}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Get Recommendations</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 32,
  },
  optionCard: {
    minWidth: 120,
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 18,
    margin: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  optionCardSelected: {
    borderColor: "#388e3c",
    backgroundColor: "#e8f5e9",
  },
  optionText: { color: "#222", fontSize: 17 },
  optionTextSelected: { color: "#388e3c", fontWeight: "bold", fontSize: 17 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 24,
    gap: 16,
  },
  largeButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 8,
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: "#388e3c",
  },
  buttonSecondary: {
    backgroundColor: "#c8e6c9",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
    marginBottom: 8,
    gap: 8,
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  progressDotActive: {
    borderWidth: 2,
    borderColor: "#388e3c",
    backgroundColor: "#388e3c",
  },
  progressDotInactive: {
    borderWidth: 1,
    borderColor: "#bbb",
    backgroundColor: "#c8e6c9",
  },
});
