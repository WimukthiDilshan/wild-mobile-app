import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import ApiService from "../services/ApiService";
import { useNavigation, useRoute } from "@react-navigation/native";

const categories = [
  "All",
  "National Park",
  "Wildlife Sanctuary",
  "Forest Reserve",
  "Wetland",
  "Mountain",
  "Coastal",
];

export default function AllParksScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialParks = route.params?.parks || [];

  const [parks, setParks] = useState(initialParks);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleFilter = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      if (category === "All") {
        const allParks = await ApiService.fetchParks();
        setParks(allParks);
      } else {
        const filtered = await ApiService.fetchParksByCategory(category);
        setParks(filtered);
      }
    } catch (e) {
      alert("Failed to fetch parks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderPark = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("ParkDetails", { parkId: item.id })}
    >
      <Text style={styles.name}>{item.name || "Unnamed Park"}</Text>
      {item.location && <Text style={styles.detail}>📍 {item.location}</Text>}
      {item.category && <Text style={styles.detail}>🏷️ {item.category}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>All Parks</Text>
      <View style={styles.filterRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterButton, selectedCategory === cat && styles.filterButtonActive]}
            onPress={() => handleFilter(cat)}
            disabled={loading}
          >
            <Text style={selectedCategory === cat ? styles.filterTextActive : styles.filterText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#388e3c" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={parks}
          keyExtractor={(item, idx) => item.id || idx.toString()}
          renderItem={renderPark}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TouchableOpacity
        style={[styles.largeButton, styles.buttonPrimary]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8", padding: 16 },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#388e3c",
    marginVertical: 16,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
  },
  filterButtonActive: {
    backgroundColor: "#388e3c",
  },
  filterText: {
    color: "#222",
    fontSize: 15,
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginVertical: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#388e3c",
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
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
