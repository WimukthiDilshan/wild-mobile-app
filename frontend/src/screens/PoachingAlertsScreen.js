import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import ApiService from '../services/ApiService';

const statusColor = (status) => {
  const s = (status || '').toString().toLowerCase();
  // in-progress / investigating -> orange
  if (s === 'in progress' || s === 'investigating') return '#FFA726';
  if (s === 'resolved') return '#66BB6A';
  // pending or unknown -> red
  if (s === 'pending' || !s) return '#EF5350';
  // fallback
  return '#616161';
};

// Map status -> emoji symbol
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

const PoachingAlertsScreen = ({ navigation }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiService.fetchPoachingIncidents();
      // Expecting an array of incidents. Sort by timestamp (newest first)
      const arr = Array.isArray(data) ? data : [];
      const getIncidentTs = (it) => {
        try {
          if (!it) return 0;
          if (it.reportedAt) {
            const t = new Date(it.reportedAt).getTime();
            if (!isNaN(t)) return t;
          }
          if (it.createdAt && it.createdAt.seconds) {
            return (Number(it.createdAt.seconds) * 1000) + (Number(it.createdAt.nanoseconds || 0) / 1e6);
          }
          if (it.date) {
            const d = String(it.date);
            if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
              const [y, m, day] = d.split('-').map(Number);
              return new Date(y, m - 1, day).getTime();
            }
            const t = new Date(d).getTime();
            if (!isNaN(t)) return t;
          }
          return 0;
        } catch (e) {
          return 0;
        }
      };

      arr.sort((a, b) => getIncidentTs(b) - getIncidentTs(a));
      setIncidents(arr);
    } catch (err) {
      console.error('Failed to load poaching incidents', err);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const severityOptions = ['All', 'High', 'Medium', 'Low'];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await ApiService.fetchPoachingIncidents();
      const arr = Array.isArray(data) ? data : [];
      const getIncidentTs = (it) => {
        try {
          if (!it) return 0;
          if (it.reportedAt) {
            const t = new Date(it.reportedAt).getTime();
            if (!isNaN(t)) return t;
          }
          if (it.createdAt && it.createdAt.seconds) {
            return (Number(it.createdAt.seconds) * 1000) + (Number(it.createdAt.nanoseconds || 0) / 1e6);
          }
          if (it.date) {
            const d = String(it.date);
            if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
              const [y, m, day] = d.split('-').map(Number);
              return new Date(y, m - 1, day).getTime();
            }
            const t = new Date(d).getTime();
            if (!isNaN(t)) return t;
          }
          return 0;
        } catch (e) {
          return 0;
        }
      };
      arr.sort((a, b) => getIncidentTs(b) - getIncidentTs(a));
      setIncidents(arr);
    } catch (err) {
      console.error('Refresh failed', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderItem = ({ item }) => {
    // Prefer reportedAt (ISO string) or createdAt (Firestore Timestamp) if available.
    // If `date` is a date-only string (YYYY-MM-DD) we show only the date (no time)
    // because `new Date('YYYY-MM-DD')` is parsed as UTC midnight and will be
    // displayed in local time (e.g. 05:30 AM for UTC+5:30), which looks odd.
    let dateObj = null;
    let dateText = '';
        let dateIsDateOnly = false;
    if (item.reportedAt) {
      dateObj = new Date(item.reportedAt);
      dateText = isNaN(dateObj.getTime()) ? String(item.reportedAt) : dateObj.toLocaleString();
    } else if (item.createdAt && item.createdAt.seconds) {
      // Firestore Timestamp serialization: { seconds, nanoseconds }
      dateObj = new Date(item.createdAt.seconds * 1000);
      dateText = dateObj.toLocaleString();
    } else if (item.date) {
      const d = String(item.date);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        // date-only -> show local date without time
        const [y, m, day] = d.split('-').map(Number);
        const localDate = new Date(y, m - 1, day);
            dateText = localDate.toLocaleDateString();
            dateIsDateOnly = true;
      } else {
        dateObj = new Date(d);
        dateText = isNaN(dateObj.getTime()) ? d : dateObj.toLocaleString();
      }
    }
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('PoachingAlertDetails', { incident: item })}
      >
        <View style={styles.item}>
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.severity ? (
                    <>
                      <Text style={styles.severityEmoji}>⚠️</Text>
                      <View style={[styles.severityBadgeSmall, { backgroundColor: severityColor(item.severity), marginLeft: 8 }]}> 
                        <Text style={styles.severityTextSmall}>{String(item.severity).toUpperCase()}</Text>
                      </View>
                    </>
                  ) : null}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status || item.state || item.investigationStatus) }]}>
                  <Text style={styles.statusText}>{`${statusSymbol(item.status || item.state || item.investigationStatus)}  ${((item.status || item.state || item.investigationStatus) || 'pending').toUpperCase()}`}</Text>
                </View>
              </View>
              <Text style={styles.speciesText}>{'🐾 ' + (item.species || item.description || 'Unknown')}</Text>
            </View>
          </View>
              <Text style={styles.meta}>{'📍 ' + (item.location || formatLatLng(item))}</Text>
              {dateText ? <Text style={styles.meta}>{(dateIsDateOnly ? '📅 ' : '🕒 ') + dateText}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  // Helper to show lat,lng when location is an object
  const formatLatLng = (item) => {
    if (!item) return 'Location unknown';
    if (typeof item.location === 'string') return item.location;
    if (item.latitude && item.longitude) return `${item.latitude}, ${item.longitude}`;
    if (item.lat && item.lng) return `${item.lat}, ${item.lng}`;
    return 'Location unknown';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>⏳ Loading poaching alerts...</Text>
      </View>
    );
  }

  const filteredIncidents = selectedSeverity === 'All'
    ? incidents
    : incidents.filter(i => {
      const sev = (i.severity || '').toString().toLowerCase();
      return sev === selectedSeverity.toLowerCase();
    });

  return (
    <View style={styles.container}>
      {/* Severity filter bar */}
      <View style={styles.filterRow}>
        {severityOptions.map(opt => {
          const active = selectedSeverity === opt;
          const label = opt === 'All' ? '🔎 All' : (opt === 'High' ? '🔴 High' : (opt === 'Medium' ? '🟠 Medium' : '🟢 Low'));
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.filterButton, active ? styles.filterButtonActive : null]}
              onPress={() => setSelectedSeverity(opt)}
            >
              <Text style={[styles.filterButtonText, active ? styles.filterButtonActiveText : null]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <FlatList
        data={filteredIncidents}
        keyExtractor={(item) => item.id || item._id || `${item.date}-${Math.random()}`}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={incidents.length ? styles.listContainer : styles.emptyContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No poaching alerts found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F3',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  speciesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  // severityEmoji removed here; defined later with spacing
  severityTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#616161',
  },
  meta: {
    color: '#666',
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  severityBadgeSmall: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minHeight: 32,
    minWidth: 88,
  },
  severityTextSmall: { color: '#fff', fontSize: 12, fontWeight: '700' },
  severityEmoji: { fontSize: 16, marginRight: 6 },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  filterButtonActiveText: {
    color: '#fff',
  },
});

export default PoachingAlertsScreen;
