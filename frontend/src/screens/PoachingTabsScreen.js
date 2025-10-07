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

const ReportedList = ({ navigation }) => {
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
      // Sort by reportedAt descending
      filtered = filtered.sort((a, b) => {
        const ta = a.reportedAt ? new Date(a.reportedAt).getTime() : 0;
        const tb = b.reportedAt ? new Date(b.reportedAt).getTime() : 0;
        return tb - ta;
      });
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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PoachingAlertDetails', { incident: item })}
    >
      <View style={styles.cardRow}>
        <Text style={styles.species}>{item.species || 'Unknown species'}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityTextSmall}>{(item.severity || 'Medium').toString()}</Text>
        </View>
      </View>
      <Text style={styles.location}>{item.location || item.name || '—'}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>{item.date ? new Date(item.date).toLocaleDateString() : ''}</Text>
        <Text style={styles.status}>{item.status || 'reported'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <FlatList
      data={incidents}
      keyExtractor={(i) => i.id || `${i.reportedAt || ''}-${Math.random()}`}
      renderItem={renderItem}
      contentContainerStyle={incidents.length === 0 && styles.emptyContainer}
      ListEmptyComponent={<Text style={styles.emptyText}>You haven't reported any incidents yet.</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
};

const PoachingTabsScreen = ({ navigation }) => {
  const [active, setActive] = useState('form'); // start on form by default

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
          onPress={() => setActive('list')}
          style={[styles.tabButton, active === 'list' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, active === 'list' && styles.tabTextActive]}>Reported</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActive('form')}
          style={[styles.tabButton, active === 'form' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, active === 'form' && styles.tabTextActive]}>Report Poaching</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {active === 'list' ? (
          <ReportedList navigation={navigation} />
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
  severity: { backgroundColor: '#FF9800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, color: 'white', fontWeight: '700' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  severityTextSmall: { color: 'white', fontWeight: '700', textTransform: 'capitalize' },
  location: { color: '#666', marginTop: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  date: { color: '#888' },
  status: { color: '#2E7D32', fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', marginTop: 20 },
});

export default PoachingTabsScreen;
