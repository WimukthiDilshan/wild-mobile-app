import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import ApiService from '../services/ApiService';
import { useAuth } from '../contexts/AuthContext';
import AddPoachingScreen from './AddPoachingScreen';

const { width } = Dimensions.get('window');

const ReportedList = ({ navigation, selectedSeverity = 'All' }) => {
  const { userData } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      let data = await ApiService.fetchPoachingIncidents();
      if (!Array.isArray(data)) data = [];
      // Filter incidents reported by the current user if uid available
      const myUid = userData?.uid;
      let filtered = myUid ? data.filter(i => i.reportedByUserId === myUid) : data;

      // Helper to get a best-effort timestamp for sorting
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

      // Sort newest first
      filtered.sort((a, b) => getIncidentTs(b) - getIncidentTs(a));
      setIncidents(filtered || []);
    } catch (e) {
      console.error('Failed to load incidents', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncidents();
    setRefreshing(false);
  };

  const getSeverityColor = (sev) => {
    if (!sev) return '#FF9800';
    const s = (sev || '').toString().toLowerCase();
    if (s === 'high') return '#F44336';
    if (s === 'low') return '#4CAF50';
    return '#FF9800';
  };

  const getSeverityEmoji = (sev) => {
    const s = (sev || '').toString().toLowerCase();
    if (s === 'high') return '🔴';
    if (s === 'medium') return '🟠';
    if (s === 'low') return '🟢';
    return '⚪';
  };

  const getStatusEmoji = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s === 'pending') return '🕒';
    if (s === 'in progress' || s === 'investigating') return '🔄';
    if (s === 'resolved') return '✅';
    return '📣';
  };

  const statusColor = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s === 'pending' || !s) return '#EF5350';
    if (s === 'in progress' || s === 'investigating') return '#FFA726';
    if (s === 'resolved') return '#66BB6A';
    return '#616161';
  };

  const renderItem = ({ item }) => {
    const parkName = item.park && (item.park.name || item.park.parkName) ? (item.park.name || item.park.parkName) : null;
    const locationStr = item.location || item.name || formatIncidentDateTime(item) ? item.location || item.name : 'Location unknown';
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('PoachingAlertDetails', { incident: item })}
      >
        <View style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.severity ? (
                  <>
                    <Text style={styles.severityEmoji}>⚠️</Text>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity), marginLeft: 8 }]}> 
                      <Text style={styles.severityTextSmall}>{String(item.severity).toUpperCase()}</Text>
                    </View>
                  </>
                ) : null}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
                <Text style={styles.statusText}>{`${getStatusEmoji(item.status)}  ${((item.status) || 'pending').toUpperCase()}`}</Text>
              </View>
            </View>
            <Text style={styles.species}>🐾 {item.species || item.description || 'Unknown'}</Text>
          </View>
        </View>
        {parkName ? <Text style={[styles.meta, styles.parkName]}>🏞️ {parkName}</Text> : null}
        <Text style={styles.meta}>📍 {item.location || item.name || '—'}</Text>
        <Text style={styles.meta}>{'🕒 ' + formatIncidentDateTime(item)}</Text>
      </TouchableOpacity>
    );
  };

  // Format date/time for display: prefer reportedAt, then createdAt, then date
  const formatIncidentDateTime = (it) => {
    try {
      if (!it) return '';
      if (it.reportedAt) {
        const d = new Date(it.reportedAt);
        if (!isNaN(d.getTime())) return d.toLocaleString();
        return String(it.reportedAt);
      }
      if (it.createdAt && it.createdAt.seconds) {
        const ms = (Number(it.createdAt.seconds) * 1000) + (Number(it.createdAt.nanoseconds || 0) / 1e6);
        const d = new Date(ms);
        return isNaN(d.getTime()) ? '' : d.toLocaleString();
      }
      if (it.date) {
        const dstr = String(it.date);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dstr)) {
          const [y, m, day] = dstr.split('-').map(Number);
          return new Date(y, m - 1, day).toLocaleDateString();
        }
        const d = new Date(dstr);
        return isNaN(d.getTime()) ? dstr : d.toLocaleString();
      }
      return '';
    } catch (e) {
      return '';
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;
  // Apply severity filter
  const filteredIncidents = selectedSeverity === 'All'
    ? incidents
    : incidents.filter(i => ((i.severity || '').toString().toLowerCase()) === selectedSeverity.toLowerCase());

  return (
    <FlatList
      data={filteredIncidents}
      keyExtractor={(i) => i.id || `${i.reportedAt || ''}-${Math.random()}`}
      renderItem={renderItem}
      contentContainerStyle={filteredIncidents.length === 0 && styles.emptyContainer}
      ListEmptyComponent={<Text style={styles.emptyText}>You haven't reported any incidents yet.</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
};

const PoachingTabsScreen = ({ navigation }) => {
  const [active, setActive] = useState('form'); // start on form by default
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  const getSeverityColor = (sev) => {
    if (!sev) return '#FF9800';
    const s = (sev || '').toString().toLowerCase();
    if (s === 'high') return '#F44336';
    if (s === 'low') return '#4CAF50';
    return '#FF9800';
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActive('form')}
          style={[styles.tabButton, active === 'form' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, active === 'form' && styles.tabTextActive]}>🚨 Report Poaching</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActive('list')}
          style={[styles.tabButton, active === 'list' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, active === 'list' && styles.tabTextActive]}>📌 Reported</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {active === 'list' ? (
          <>
            <View style={styles.filterRow}>
              {['All','High','Medium','Low'].map(opt => {
                const activeOpt = selectedSeverity === opt;
                const label = opt === 'All' ? '🔎 All' : (opt === 'High' ? '🔴 High' : (opt === 'Medium' ? '🟠 Medium' : '🟢 Low'));
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.filterButton, activeOpt ? styles.filterButtonActive : null]}
                    onPress={() => setSelectedSeverity(opt)}
                  >
                    <Text style={[styles.filterButtonText, activeOpt ? styles.filterButtonActiveText : null]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <ReportedList navigation={navigation} selectedSeverity={selectedSeverity} />
          </>
        ) : (
          // Render the existing AddPoachingScreen form inline
          <AddPoachingScreen navigation={navigation} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabBar: { flexDirection: 'row', padding: 8, backgroundColor: 'white', elevation: 2 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#E8F5E8' },
  tabText: { color: '#444', fontWeight: '600' },
  tabTextActive: { color: '#2E7D32' },
  content: { flex: 1 },
  card: { backgroundColor: 'white', margin: 12, padding: 12, borderRadius: 10, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  species: { fontSize: 16, fontWeight: '700', color: '#222' },
  severity: { backgroundColor: '#FF9800', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, color: 'white', fontWeight: '700' },
  // Match the form severity button sizing: padding, borderRadius and minimum height
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 36,
    minWidth: 84,
    justifyContent: 'center',
    alignItems: 'center'
  },
  severityTextSmall: { color: 'white', fontWeight: '700', textTransform: 'capitalize', fontSize: 13, lineHeight: 16 },
  location: { color: '#666', marginTop: 6 },
  // Item styles (match PoachingAlertsScreen look)
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 12,
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
  species: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 4 },
  meta: { color: '#666', fontSize: 13 },
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
  severityEmoji: { fontSize: 16, marginRight: 6 },
  parkName: { color: '#222', fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  date: { color: '#888' },
  status: { color: '#2E7D32', fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', marginTop: 20 },
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

export default PoachingTabsScreen;
