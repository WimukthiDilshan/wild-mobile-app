import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import ApiService from "../services/ApiService";

export default function ParkDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { parkId } = route.params;

  const [park, setPark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const handleSavePark = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      const msg = await ApiService.savePark(parkId);
      setSaveMessage(msg);
    } catch (e) {
      setSaveMessage(e.message || "Failed to save park");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchPark = async () => {
      try {
        setLoading(true);
        const data = await ApiService.fetchParkById(parkId);
        setPark(data);
      } catch (e) {
        setError(e.message || "Failed to load park details");
      } finally {
        setLoading(false);
      }
    };
    fetchPark();
  }, [parkId]);

  const renderText = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(String).join(", ");
    return JSON.stringify(value);
  };

  const renderRow = (label, value) => {
    if (value === null || value === undefined) return null;
    return (
      <View style={styles.row} key={label}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{renderText(value)}</Text>
      </View>
    );
  };

  const renderBadges = (items) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.badgeContainer}>
        {items.map((it, i) => (
          <View style={styles.badge} key={i}>
            <Text style={styles.badgeText}>{String(it)}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#388e3c" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!park) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.error}>Park not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.parkCard}>
        <Text style={styles.heading}>{renderText(park.name) || "Unnamed Park"}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
        >
          {(park.photoUrls && park.photoUrls.length > 0
            ? park.photoUrls
            : [park.photoUrl]
          ).map((url, idx) =>
            url ? (
              <Image key={idx} source={{ uri: url }} style={styles.image} />
            ) : (
              <View key={idx} style={[styles.image, styles.imagePlaceholder]} />
            )
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSavePark}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Park"}</Text>
        </TouchableOpacity>

        {!!saveMessage && (
          <View style={styles.saveMessageBox}>
            <Text style={styles.saveMessageText}>{saveMessage}</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        {renderRow("Location", park.location)}
        {renderRow("Category", park.category)}
        {renderRow("Status", park.status)}
        {park.area !== undefined && park.area !== null && renderRow("Area", `${renderText(park.area)} sq km`)}
        {renderRow("Established", park.established)}
        {park.facilities && renderRow("Facilities", park.facilities)}

        {park.activities?.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Activities</Text>
            {renderBadges(park.activities)}
          </View>
        )}

        {park.animalTypes?.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Animals</Text>
            {renderBadges(park.animalTypes)}
          </View>
        )}

        {park.environments?.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Environments</Text>
            {renderBadges(park.environments)}
          </View>
        )}

        {park.experienceLevels?.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Experience Levels</Text>
            {renderBadges(park.experienceLevels)}
          </View>
        )}

        {park.description && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{renderText(park.description)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    backgroundColor: "#388e3c",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
    shadowColor: "#388e3c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveMessageBox: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    padding: 8,
    marginTop: 6,
    alignSelf: "center",
    maxWidth: "90%",
  },
  saveMessageText: {
    color: "#388e3c",
    fontSize: 14,
    textAlign: "center",
  },
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f8f8" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },
  parkCard: {
    margin: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2e7d32",
    marginHorizontal: 16,
    marginTop: 8,
    textAlign: "center",
  },
  imageScroll: { marginVertical: 10, paddingHorizontal: 12 },
  image: { width: 320, height: 200, borderRadius: 12, marginRight: 12, resizeMode: "cover" },
  imagePlaceholder: { backgroundColor: "#e6e6e6", justifyContent: "center", alignItems: "center" },
  details: { paddingHorizontal: 16, paddingTop: 8 },
  row: { flexDirection: "column", marginBottom: 8 },
  label: { fontSize: 13, color: "#666", marginBottom: 4 },
  value: { fontSize: 16, color: "#333" },
  sectionTitle: { fontSize: 16, color: "#2e7d32", fontWeight: "600", marginBottom: 6 },
  badgeContainer: { flexDirection: "row", flexWrap: "wrap" },
  badge: { backgroundColor: "#e8f5e9", paddingVertical: 6, paddingHorizontal: 8, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  badgeText: { color: "#2e7d32", fontSize: 13 },
  description: { fontSize: 15, color: "#444", lineHeight: 20 },
  error: { color: "#c00", fontSize: 18, textAlign: "center", marginTop: 8 },
  backButton: { margin: 10, alignSelf: "flex-start" },
  backText: { color: "#2e7d32", fontSize: 16 },
});
