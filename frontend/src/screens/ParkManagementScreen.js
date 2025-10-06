import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
// import { launchImageLibrary } from "react-native-image-picker";
import ApiService from "../services/ApiService";
import WildlifeMapPicker from "../components/WildlifeMapPicker";
import { useAuth } from "../contexts/AuthContext";
import RNFS from "react-native-fs";
import ImageUploader from "../uploads/ImageUpload";

const ParkManagementScreen = ({ navigation }) => {
  const { hasPermission } = useAuth();
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPark, setEditingPark] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    area: "",
    established: "",
    description: "",
    coordinates: { latitude: 0, longitude: 0 },
    facilities: "",
    category: "National Park",
    status: "Active",
    photoUrls: [], // Add photoUrl to formData
    animalTypes: [],
    activities: [],
    environments: [],
    experienceLevels: [],
  });
  const [photoUploading, setPhotoUploading] = useState(false);

  const parkCategories = [
    "National Park",
    "Nature Reserve",
    "Wildlife Sanctuary",
    "Forest Reserve",
    "Marine Park",
  ];
  const parkStatuses = ["Active", "Under Development", "Maintenance", "Closed"];

  const animalTypeOptions = [
    "mammals",
    "birds",
    "reptiles",
    "amphibians",
    "insects",
  ];
  const activityOptions = [
    "Safari Rides",
    "Bird Watching",
    "Camping",
    "Hiking",
  ];
  const environmentOptions = [
    "Forest",
    "Wetland",
    "Mountain",
    "Coastal",
  ];
  const experienceLevelOptions = [
    "Family Friendly",
    "Adventure Seekers",
    "Relaxation and Nature",
  ];

  useEffect(() => {
    loadParks();
  }, []);

  const loadParks = async () => {
    try {
      setLoading(true);
      const parksData = await ApiService.fetchParks();
      setParks(parksData);
    } catch (error) {
      Alert.alert("Error", "Failed to load parks data");
      console.error("Error loading parks:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParks();
    setRefreshing(false);
  };

  const openAddModal = () => {
    setEditingPark(null);
    setFormData({
      name: "",
      location: "",
      area: "",
      established: "",
      description: "",
      coordinates: { latitude: 0, longitude: 0 },
      facilities: "",
      category: "National Park",
      status: "Active",
      photoUrl: "", // Add photoUrl to formData
      animalTypes: [],
      activities: [],
      environments: [],
      experienceLevels: [],
    });
    setModalVisible(true);
  };

  const openEditModal = (park) => {
    setEditingPark(park);
    setFormData({
      name: park.name || "",
      location: park.location || "",
      area: park.area || "",
      established: park.established || "",
      description: park.description || "",
      coordinates: park.coordinates || { latitude: 0, longitude: 0 },
      facilities: park.facilities || "",
      category: park.category || "National Park",
      status: park.status || "Active",
      photoUrl: park.photoUrl || "",
      animalTypes: park.animalTypes || [],
      activities: park.activities || [],
      environments: park.environments || [],
      experienceLevels: park.experienceLevels || [],
    });
    setModalVisible(true);
  };

  const pickImage = async () => {
    const options = {
      mediaType: "photo",
      quality: 0.7,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log("User cancelled");
      } else if (response.errorCode) {
        console.log("Error:", response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        const uri = response.assets[0].uri;
        console.log("Selected:", uri);
        await uploadToCloudinary(uri); // Await upload so modal stays open and preview updates
      }
    });
  };

  const uploadToCloudinary = async (uri) => {
    setPhotoUploading(true);

    // Convert content:// URI to file path
    let fileUri = uri;
    if (uri.startsWith("content://")) {
      const destPath = `${RNFS.TemporaryDirectoryPath}/${Date.now()}.jpg`;
      await RNFS.copyFile(uri, destPath);
      fileUri = destPath;
    }

    const data = new FormData();
    data.append("file", {
      uri: fileUri,
      type: "image/jpeg",
      name: "park.jpg",
    });
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );
      const file = await res.json();
      setFormData((prev) => ({ ...prev, photoUrl: file.secure_url }));
      Alert.alert("Success", "Photo uploaded!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Photo upload failed");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      Alert.alert(
        "Error",
        "Please fill in required fields (Name and Location)"
      );
      return;
    }

    try {
      // If photo is being uploaded, wait
      if (photoUploading) {
        Alert.alert("Please wait", "Photo is still uploading...");
        return;
      }

      const parkData = {
        ...formData,
        area: formData.area ? parseFloat(formData.area) : 0,
        createdAt: editingPark?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingPark) {
        await ApiService.updatePark(editingPark.id, parkData);
        Alert.alert("Success", "Park updated successfully!");
      } else {
        await ApiService.addPark(parkData);
        Alert.alert("Success", "Park added successfully!");
      }

      setModalVisible(false);
      await loadParks();
    } catch (error) {
      Alert.alert("Error", `Failed to ${editingPark ? "update" : "add"} park`);
      console.error("Error saving park:", error);
    }
  };
  const handleDelete = (park) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${park.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await ApiService.deletePark(park.id);
              Alert.alert("Success", "Park deleted successfully!");
              await loadParks();
            } catch (error) {
              Alert.alert("Error", "Failed to delete park");
              console.error("Error deleting park:", error);
            }
          },
        },
      ]
    );
  };

  const toggleMultiSelect = (field, value) => {
    setFormData((prev) => {
      const arr = prev[field] || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...arr, value] };
      }
    });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "National Park":
        return "#4CAF50";
      case "Nature Reserve":
        return "#2196F3";
      case "Wildlife Sanctuary":
        return "#FF9800";
      case "Forest Reserve":
        return "#795548";
      case "Marine Park":
        return "#00BCD4";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "#4CAF50";
      case "Under Development":
        return "#FF9800";
      case "Maintenance":
        return "#FFC107";
      case "Closed":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading parks data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏞️ Park Management</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats Card */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{parks.length}</Text>
          <Text style={styles.statLabel}>Total Parks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {parks.filter((p) => p.status === "Active").length}
          </Text>
          <Text style={styles.statLabel}>Active Parks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {parks.reduce((sum, p) => sum + (p.area || 0), 0).toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Total Area (km²)</Text>
        </View>
      </View>

      {/* Parks List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {parks.map((park, index) => (
          <View key={park.id || index} style={styles.parkCard}>
            <View style={styles.parkHeader}>
              <View style={styles.parkTitleContainer}>
                <Text style={styles.parkName}>{park.name}</Text>
                <View style={styles.badgeContainer}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: getCategoryColor(park.category) },
                    ]}
                  >
                    <Text style={styles.badgeText}>{park.category}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(park.status) },
                    ]}
                  >
                    <Text style={styles.badgeText}>{park.status}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.parkDetails}>
              <Text style={styles.detailText}>📍 {park.location}</Text>
              {park.area > 0 && (
                <Text style={styles.detailText}>📏 Area: {park.area} km²</Text>
              )}
              {park.established && (
                <Text style={styles.detailText}>
                  📅 Est: {park.established}
                </Text>
              )}
              {park.description && (
                <Text style={styles.descriptionText}>{park.description}</Text>
              )}
              {park.facilities && (
                <Text style={styles.detailText}>
                  🏪 Facilities: {park.facilities}
                </Text>
              )}
            </View>

            {park.photoUrl ? (
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <Image
                  source={{ uri: park.photoUrl }}
                  style={{ width: "100%", height: 180, borderRadius: 12 }}
                  resizeMode="cover"
                />
              </View>
            ) : null}

            <View style={styles.actionButtons}>
              {hasPermission("canEditParks") && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => openEditModal(park)}
                >
                  <Text style={styles.actionButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
              )}
              {hasPermission("canDeleteParks") && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(park)}
                >
                  <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {parks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🏞️</Text>
            <Text style={styles.emptyTitle}>No Parks Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start by adding your first park to the database
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {hasPermission("canAddParks") && (
        <TouchableOpacity style={styles.floatingButton} onPress={openAddModal}>
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingPark ? "Edit Park" : "Add New Park"}
              </Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Park Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Enter park name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location: text })
                  }
                  placeholder="Enter location"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.formLabel}>Area (km²)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.area}
                    onChangeText={(text) =>
                      setFormData({ ...formData, area: text })
                    }
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.formLabel}>Established</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.established}
                    onChangeText={(text) =>
                      setFormData({ ...formData, established: text })
                    }
                    placeholder="YYYY"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryButtons}>
                    {parkCategories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          formData.category === category &&
                            styles.selectedCategoryButton,
                        ]}
                        onPress={() => setFormData({ ...formData, category })}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            formData.category === category &&
                              styles.selectedCategoryButtonText,
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.statusButtons}>
                    {parkStatuses.map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          formData.status === status &&
                            styles.selectedStatusButton,
                        ]}
                        onPress={() => setFormData({ ...formData, status })}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            formData.status === status &&
                              styles.selectedStatusButtonText,
                          ]}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Enter park description"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Facilities</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.facilities}
                  onChangeText={(text) =>
                    setFormData({ ...formData, facilities: text })
                  }
                  placeholder="e.g., Visitor Center, Camping, Trails"
                />
              </View>
              <View style={styles.formGroup}>
  <Text style={styles.formLabel}>Park Photos</Text>

<ImageUploader
  onUpload={(updateFn) => {
    setFormData((prev) => ({
      ...prev,
      photoUrls: typeof updateFn === 'function' ? updateFn(prev.photoUrls) : updateFn,
    }));
  }}
/>

{formData.photoUrls?.length > 0 && (
  <ScrollView horizontal style={{ marginTop: 10 }}>
    {formData.photoUrls.map((url, index) => (
      <Image
        key={index}
        source={{ uri: url }}
        style={{ width: 120, height: 120, marginRight: 10, borderRadius: 8 }}
      />
    ))}
  </ScrollView>
)}
</View>

              {/* Animal Types Multi-select */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Which animal types do you like?</Text>
                <View style={styles.multiSelectRow}>
                  {animalTypeOptions.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.multiSelectButton,
                        formData.animalTypes.includes(type) && styles.selectedMultiSelectButton,
                      ]}
                      onPress={() => toggleMultiSelect("animalTypes", type)}
                    >
                      <Text
                        style={[
                          styles.multiSelectButtonText,
                          formData.animalTypes.includes(type) && styles.selectedMultiSelectButtonText,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Activities Multi-select */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Which activities are you interested in?</Text>
                <View style={styles.multiSelectRow}>
                  {activityOptions.map((activity) => (
                    <TouchableOpacity
                      key={activity}
                      style={[
                        styles.multiSelectButton,
                        formData.activities.includes(activity) && styles.selectedMultiSelectButton,
                      ]}
                      onPress={() => toggleMultiSelect("activities", activity)}
                    >
                      <Text
                        style={[
                          styles.multiSelectButtonText,
                          formData.activities.includes(activity) && styles.selectedMultiSelectButtonText,
                        ]}
                      >
                        {activity}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Environment Multi-select */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Preferred Environment?</Text>
                <View style={styles.multiSelectRow}>
                  {environmentOptions.map((env) => (
                    <TouchableOpacity
                      key={env}
                      style={[
                        styles.multiSelectButton,
                        formData.environments.includes(env) && styles.selectedMultiSelectButton,
                      ]}
                      onPress={() => toggleMultiSelect("environments", env)}
                    >
                      <Text
                        style={[
                          styles.multiSelectButtonText,
                          formData.environments.includes(env) && styles.selectedMultiSelectButtonText,
                        ]}
                      >
                        {env}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Experience Level Multi-select */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Experience Level?</Text>
                <View style={styles.multiSelectRow}>
                  {experienceLevelOptions.map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.multiSelectButton,
                        formData.experienceLevels.includes(level) && styles.selectedMultiSelectButton,
                      ]}
                      onPress={() => toggleMultiSelect("experienceLevels", level)}
                    >
                      <Text
                        style={[
                          styles.multiSelectButtonText,
                          formData.experienceLevels.includes(level) && styles.selectedMultiSelectButtonText,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>
                    {editingPark ? "💾 Update Park" : "✅ Add Park"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  placeholder: {
    width: 60,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
  },
  statCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  parkCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  parkHeader: {
    marginBottom: 12,
  },
  parkTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  parkName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  badgeContainer: {
    gap: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  parkDetails: {
    gap: 4,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  floatingButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalForm: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  categoryButtons: {
    flexDirection: "row",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedCategoryButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#666",
  },
  selectedCategoryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  statusButtons: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedStatusButton: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  statusButtonText: {
    fontSize: 14,
    color: "#666",
  },
  selectedStatusButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalActions: {
    paddingTop: 20,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  photoButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  photoButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  multiSelectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  multiSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },
  selectedMultiSelectButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  multiSelectButtonText: {
    fontSize: 14,
    color: "#666",
  },
  selectedMultiSelectButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ParkManagementScreen;
