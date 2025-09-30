import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";

export default function RecommendationsScreen() {
  const route = useRoute();
  const { topParks = [] } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recommended Parks</Text>
      <FlatList
        data={topParks}
        keyExtractor={(item) => item.park}
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <Text style={styles.parkName}>{index + 1}. {item.park}</Text>
            <Text style={styles.score}>Score: {item.score.toFixed(3)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No recommendations found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  item: { marginBottom: 16, padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8 },
  parkName: { fontSize: 18, fontWeight: "bold" },
  score: { fontSize: 16, color: "#555" },
  empty: { textAlign: "center", marginTop: 40, color: "#888" },
});