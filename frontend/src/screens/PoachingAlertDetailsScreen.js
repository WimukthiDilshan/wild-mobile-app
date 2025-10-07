import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image, Linking } from 'react-native';
import ApiService from '../services/ApiService';
import firestore from '@react-native-firebase/firestore';
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

  // helper to find a phone number from a variety of possible fields
  const findReporterPhone = (it) => {
    if (!it) return null;
    const candidates = [
      it.reporterPhone,
      it.reporterPhoneNumber,
      it.reportedByPhone,
      it.phone,
      it.phoneNumber,
      it.contactPhone,
      it.reporterContact,
      it.reporter?.phone,
      it.reportedBy?.phone,
      it.contact?.phone,
      // nested possibilities
      it.reporter?.contact?.phone,
      it.reportedBy?.contact?.phone,
    ];
    for (const c of candidates) {
      if (!c) continue;
      const s = String(c).trim();
      // basic sanitization: keep digits, + and spaces
      const cleaned = s.replace(/[^0-9+\s()-]/g, '');
      if (cleaned.length >= 5) return cleaned;
    }
    return null;
  };

  const onCall = async (phone) => {
    if (!phone) {
      Alert.alert('No number', 'No reporter phone number is available');
      return;
    }
    Alert.alert(
      'Call Reporter',
      `Call ${incident.reportedBy || incident.reporter || 'reporter'} at ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: async () => {
            // Try a few variants of the tel: URL. Some Android builds or OS versions
            // make canOpenURL unreliable (package visibility). Rather than block,
            // attempt to open the dialer and catch failure.
            const tryOpen = async (url) => {
              try {
                await Linking.openURL(url);
                return true;
              } catch (err) {
                console.warn('openURL failed for', url, err);
                return false;
              }
            };

            // basic normalization: remove non-digit except leading +
            const cleaned = String(phone).trim().replace(/[^0-9+]/g, '');
            const candidates = [
              `tel:${phone}`,
              `tel:${encodeURIComponent(phone)}`,
              `tel:${cleaned}`,
            ];

            for (const url of candidates) {
              // try opening the dialer; succeed if any variant works
              // eslint-disable-next-line no-await-in-loop
              const ok = await tryOpen(url);
              if (ok) return;
            }

            // If we reached here, opening the dialer failed on this device.
            Alert.alert('Error', 'Dialer not available or failed to open on this device. Please try on a device with phone capabilities.');
          }
        }
      ]
    );
  };

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

  const statusSymbol = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s === 'pending') return '🕒';
    if (s === 'in progress' || s === 'investigating') return '🔄';
    if (s === 'resolved') return '✅';
    return '🕒';
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
  const [reporterUser, setReporterUser] = useState(null);

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

  // If the incident contains a reportedByUserId, try to fetch the corresponding user doc
  React.useEffect(() => {
    let cancelled = false;
    const loadReporter = async () => {
      try {
        const uid = currentIncident?.reportedByUserId || incident?.reportedByUserId || currentIncident?.reportedByUid || incident?.reportedByUid;
        if (!uid) return;
        const doc = await firestore().collection('users').doc(uid).get();
        if (!cancelled && doc && doc.exists) {
          setReporterUser(doc.data());
          console.debug('Loaded reporter user for call lookup', { uid, data: doc.data() });
        }
      } catch (err) {
        console.warn('Failed to load reporter user', err);
      }
    };
    loadReporter();
    return () => { cancelled = true; };
  }, [currentIncident, incident]);

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
  const [phoneDebugVisible, setPhoneDebugVisible] = useState(false);

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
          <View style={styles.statusRow}>
            <Text style={styles.value}>{`${statusSymbol(currentIncident.status || currentIncident.state || currentIncident.investigationStatus)}  ${(currentIncident.status || currentIncident.state || currentIncident.investigationStatus || 'pending').toUpperCase()}`}</Text>
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
        {currentIncident.severity ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.label}>Severity</Text>
            <View style={[styles.severityBadge, { backgroundColor: severityColor(currentIncident.severity), alignSelf: 'flex-start' }]}>
              <Text style={styles.severityText}>{String(currentIncident.severity).toUpperCase()}</Text>
            </View>
          </View>
        ) : (
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.label}>Severity</Text>
            <Text style={styles.value}>Unknown</Text>
          </View>
        )}

        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{incident.location || formatLatLng(incident)}</Text>
        <TouchableOpacity style={[styles.viewLocationButton, { backgroundColor: '#4CAF50' }]} onPress={() => setShowMapPicker(true)}>
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

      {/* Call Reporter button - render if phone available */}
      {(() => {
        const reporterPhone = (reporterUser && reporterUser.phoneNumber) || findReporterPhone(currentIncident) || findReporterPhone(incident) || (userData && userData.phoneNumber);
        if (!reporterPhone) {
          console.debug('PoachingAlertDetails: no reporter phone found on incident', { id: incident.id });
          // provide a small diagnostics control so devs can inspect candidate fields on-device
          return (
            <View style={styles.section}>
              <TouchableOpacity style={[styles.viewLocationButton, { backgroundColor: '#9E9E9E' }]} onPress={() => setPhoneDebugVisible(true)}>
                <Text style={styles.viewLocationButtonText}>No reporter phone found — tap to inspect</Text>
              </TouchableOpacity>
            </View>
          );
        }
        console.debug('PoachingAlertDetails: reporter phone detected', { id: incident.id, phone: reporterPhone });
        return (
          <View style={styles.section}>
            <TouchableOpacity style={styles.callButton} onPress={() => onCall(reporterPhone)}>
              <Text style={styles.callButtonText}>Call Reporter: {reporterPhone}</Text>
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Phone debug modal - shows candidate fields and values */}
      <Modal visible={phoneDebugVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>Phone candidates</Text>
            <ScrollView style={{ marginBottom: 12 }}>
              {(() => {
                // gather candidate values from incident for inspection
                const list = [];
                const pushIf = (path, val) => {
                  if (val === undefined || val === null) return;
                  const s = String(val).trim();
                  if (!s) return;
                  // mark if looks phone-like
                  const cleaned = s.replace(/[^0-9+\s()-]/g, '');
                  const looksLikePhone = cleaned.length >= 5 && /[0-9]/.test(cleaned);
                  list.push({ path, value: s, looksLikePhone });
                };
                // explicit candidate keys
                const explicit = ['reporterPhone','reporterPhoneNumber','reportedByPhone','phone','phoneNumber','contactPhone','reporterContact'];
                explicit.forEach(k => pushIf(k, incident[k]));
                // include reporterUser fields for inspection (if loaded)
                if (reporterUser) {
                  Object.keys(reporterUser).forEach(k => pushIf(`reporterUser.${k}`, reporterUser[k]));
                }
                // also inspect top-level nested objects shallowly
                Object.keys(incident).forEach(k => {
                  const v = incident[k];
                  if (typeof v === 'string' || typeof v === 'number') pushIf(k, v);
                  else if (v && typeof v === 'object') {
                    // shallow keys
                    Object.keys(v).forEach(sub => pushIf(`${k}.${sub}`, v[sub]));
                  }
                });
                if (list.length === 0) return <Text style={{ color: '#666' }}>No fields found to inspect.</Text>;
                return list.map((it, i) => (
                  <View key={i} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <Text style={{ fontWeight: '700' }}>{it.path}{it.looksLikePhone ? '  🔎' : ''}</Text>
                    <Text style={{ color: '#333' }}>{it.value}</Text>
                  </View>
                ));
              })()}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setPhoneDebugVisible(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#222', marginTop: 4, paddingHorizontal: 4 },
  section: { marginBottom: 16, paddingHorizontal: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 8 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 110, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  inProgress: { backgroundColor: '#FFA726' },
  resolved: { backgroundColor: '#66BB6A' },
  change: { backgroundColor: '#2196F3' },
  label: { color: '#666', fontSize: 13, marginBottom: 6 },
  value: { fontSize: 16, color: '#222', marginBottom: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  modalOption: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 6, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  modalOptionText: { fontSize: 15, color: '#222' },
  modalOptionSelected: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  checkMark: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalCancelButton: { marginTop: 8, alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: '#FF3B30', fontWeight: '700' },
  severityBadge: { alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  severityText: { color: '#fff', fontWeight: '700' },
  viewLocationButton: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#2196F3', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, elevation: 2 },
  viewLocationButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  callButton: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#E53935', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, elevation: 2 },
  callButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  locationDetails: { marginTop: 8, padding: 10, backgroundColor: '#FFF', borderRadius: 8 },
  meta: { color: '#666', fontSize: 13 },
  evidenceScroll: { marginTop: 10 },
  evidenceThumb: { width: 96, height: 96, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: '92%', height: '78%' },
  viewerClose: { position: 'absolute', top: 36, left: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 },
  viewerCloseText: { color: '#fff', fontWeight: '700' },
});

export default PoachingAlertDetailsScreen;
