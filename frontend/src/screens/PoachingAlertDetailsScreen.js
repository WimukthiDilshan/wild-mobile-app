import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import ApiService from '../services/ApiService';
import LocationService from '../services/LocationService';
import WildlifeMapPicker from '../components/WildlifeMapPicker';
import { useAuth } from '../contexts/AuthContext';

const PoachingAlertDetailsScreen = ({ route, navigation }) => {
  const { incident } = route.params || {};
  if (!incident) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No details available</Text>
      </View>
    );
  }

  const [currentIncident, setCurrentIncident] = useState({ status: incident.status || incident.state || incident.investigationStatus || 'pending', ...incident });
  const [saving, setSaving] = useState(false);

  const date = currentIncident.date ? new Date(currentIncident.date) : (currentIncident.createdAt ? new Date(currentIncident.createdAt) : null);

  const statusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'in progress':
      case 'investigating':
        return '#FFA726';
      case 'resolved':
        return '#66BB6A';
      case 'pending':
      default:
        return '#EF5350';
    }
  };

  const severityColor = (severity) => {
    switch ((severity || '').toString().toLowerCase()) {
      case 'high':
        return '#D32F2F';
      case 'medium':
        return '#F57C00';
      case 'low':
        return '#388E3C';
      default:
        return '#616161';
    }
  };

  const { userData } = useAuth();

  // Fetch latest incident from server (to get persisted evidence URLs etc.)
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (currentIncident && currentIncident.id) {
          const fresh = await ApiService.fetchPoachingIncidentById(currentIncident.id);
          if (!cancelled && fresh) {
            setCurrentIncident({ status: fresh.status || currentIncident.status, ...fresh });
          }
        }
      } catch (e) {
        // ignore fetch errors for now
        console.warn('Could not refresh incident:', e.message || e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const updateStatus = async (newStatus) => {
    if (!currentIncident || !currentIncident.id) return;
    Alert.alert(
      'Confirm',
      `Mark this incident as "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setSaving(true);
              const updated = await ApiService.updatePoachingStatus(currentIncident.id, { status: newStatus });
              setCurrentIncident(updated);
              Alert.alert('Success', `Status updated to ${newStatus}`);
              // notify parent list to refresh by navigating back with param
              try {
                navigation && navigation.goBack && navigation.goBack();
              } catch (e) {
                // ignore
              }
            } catch (err) {
              console.error('Failed to update status', err);
              Alert.alert('Error', 'Failed to update status');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const [modalVisible, setModalVisible] = useState(false);
  const STATUS_OPTIONS = ['pending', 'in progress', 'resolved'];

  const onSelectStatus = async (s) => {
    setModalVisible(false);
    // confirm and update
    await updateStatus(s);
  };

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [evidenceViewerVisible, setEvidenceViewerVisible] = useState(false);
  const [evidenceIndex, setEvidenceIndex] = useState(0);

  const parseCoords = (it) => {
    if (!it) return null;
    if (it.latitude && it.longitude) return { latitude: Number(it.latitude), longitude: Number(it.longitude) };
    if (it.lat && it.lng) return { latitude: Number(it.lat), longitude: Number(it.lng) };
    // try parse from location string like 'Name (6.900277, 79.964689)'
    const loc = typeof it.location === 'string' ? it.location : (typeof it === 'string' ? it : null);
    if (loc) {
      const m = loc.match(/\(([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)\)/);
      if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };
    }
    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{incident.species || incident.title || 'Poaching Alert'}</Text>

      <View style={styles.sectionRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.value}>{(currentIncident.status || currentIncident.state || currentIncident.investigationStatus || 'pending').toUpperCase()}</Text>
            {currentIncident.severity ? (
              <View style={[styles.severityBadge, { backgroundColor: severityColor(currentIncident.severity), marginLeft: 12 }]}>
                <Text style={styles.severityText}>{String(currentIncident.severity).toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.change]} onPress={() => setModalVisible(true)}>
            <Text style={styles.actionText}>Change Status</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* severity is shown inline next to Status (avoid duplicate display) */}

      <View style={styles.section}>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{incident.location || formatLatLng(incident)}</Text>
        <TouchableOpacity style={[styles.viewLocationButton, { backgroundColor: '#4CAF50', marginTop: 8 }]} onPress={() => setShowMapPicker(true)}>
          <Text style={styles.viewLocationButtonText}>View on Map</Text>
        </TouchableOpacity>
        {/* Inline location details removed; use View on Map to inspect coordinates on the map */}
      </View>

      <WildlifeMapPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={() => setShowMapPicker(false)}
        initialLocation={(() => {
          const coords = parseCoords(incident);
          if (!coords) return null;
          const formatted = LocationService.formatCoordinates(coords.latitude, coords.longitude);
          return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            name: incident.species || incident.title || 'Alert location',
            formattedCoords: formatted.formatted,
            source: 'Record'
          };
        })()}
      />

      {date && (
        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{date.toLocaleString()}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Reported By</Text>
        <Text style={styles.value}>{incident.reportedBy || incident.reporter || 'Unknown'}</Text>
      </View>

      {currentIncident.assignedTo && (
        <View style={styles.section}>
          <Text style={styles.label}>Assigned To</Text>
          <Text style={styles.value}>{currentIncident.assignedTo}</Text>
        </View>
      )}

      {incident.description && (
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{incident.description}</Text>
        </View>
      )}

      {/* Evidence gallery (thumbnails) */}
      {(currentIncident.evidence && currentIncident.evidence.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.label}>Evidence</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenceScroll}>
            {currentIncident.evidence.map((url, idx) => (
              <TouchableOpacity key={idx} onPress={() => { setEvidenceIndex(idx); setEvidenceViewerVisible(true); }} activeOpacity={0.85}>
                <Image source={{ uri: url }} style={styles.evidenceThumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Full screen evidence viewer */}
      <Modal visible={evidenceViewerVisible} transparent animationType="fade">
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setEvidenceViewerVisible(false)}>
            <Text style={styles.viewerCloseText}>Close</Text>
          </TouchableOpacity>
          {currentIncident.evidence && currentIncident.evidence[evidenceIndex] ? (
            <Image source={{ uri: currentIncident.evidence[evidenceIndex] }} style={styles.viewerImage} resizeMode="contain" />
          ) : (
            <Text style={{ color: '#fff' }}>No image</Text>
          )}
        </View>
      </Modal>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select new status</Text>
              {STATUS_OPTIONS.map((s) => {
                const selected = (currentIncident.status || '').toLowerCase() === s.toLowerCase();
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.modalOption,
                      { backgroundColor: statusColor(s) },
                      selected ? styles.modalOptionSelected : null,
                    ]}
                    onPress={() => onSelectStatus(s)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.modalOptionText, { color: '#fff', textAlign: 'left', flex: 1 }]}>{s.toUpperCase()}</Text>
                    {selected ? <Text style={styles.checkMark}>✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      {/* If you have additional fields (assignedTo, evidence urls), they can be rendered here */}
    </ScrollView>
  );
};

const formatLatLng = (item) => {
  if (!item) return 'Location unknown';
  if (typeof item.location === 'string') return item.location;
  if (item.latitude && item.longitude) return `${item.latitude}, ${item.longitude}`;
  if (item.lat && item.lng) return `${item.lat}, ${item.lng}`;
  return 'Location unknown';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6F3' },
  content: { padding: 16, paddingTop: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#666' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#222', marginTop: 4 },
  section: { marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  actions: { flexDirection: 'column', alignItems: 'flex-end' },
  actionButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, marginBottom: 6 },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  inProgress: { backgroundColor: '#FFA726' },
  resolved: { backgroundColor: '#66BB6A' },
  change: { backgroundColor: '#2196F3' },
  label: { color: '#888', fontSize: 12, marginBottom: 4 },
  value: { fontSize: 16, color: '#222' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  modalOption: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 6, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  modalOptionText: { fontSize: 15, color: '#222' },
  modalOptionSelected: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  checkMark: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalCancelButton: { marginTop: 8, alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: '#FF3B30', fontWeight: '700' },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginTop: 6 },
  severityText: { color: '#fff', fontWeight: '700' },
  viewLocationButton: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#2196F3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  viewLocationButtonText: { color: '#fff', fontWeight: '700' },
  locationDetails: { marginTop: 8, padding: 10, backgroundColor: '#FFF', borderRadius: 8 },
  meta: { color: '#666', fontSize: 13 },
  evidenceScroll: { marginTop: 8 },
  evidenceThumb: { width: 96, height: 96, borderRadius: 8, marginRight: 10, backgroundColor: '#eee' },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: '92%', height: '78%' },
  viewerClose: { position: 'absolute', top: 36, left: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 },
  viewerCloseText: { color: '#fff', fontWeight: '700' },
});

export default PoachingAlertDetailsScreen;
