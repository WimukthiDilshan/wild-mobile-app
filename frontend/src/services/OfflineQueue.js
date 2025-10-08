import RNFS from 'react-native-fs';
import ApiService from './ApiService';
import { AppState } from 'react-native';

const QUEUE_FILE = `${RNFS.DocumentDirectoryPath}/pending_poaching_reports.json`;
let interval = null;

const readQueueFile = async () => {
  try {
    const exists = await RNFS.exists(QUEUE_FILE);
    if (!exists) return [];
    const txt = await RNFS.readFile(QUEUE_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (e) {
    console.warn('OfflineQueue: read error', e);
    return [];
  }
};

const writeQueueFile = async (items) => {
  try {
    await RNFS.writeFile(QUEUE_FILE, JSON.stringify(items || []), 'utf8');
  } catch (e) {
    console.warn('OfflineQueue: write error', e);
  }
};

const enqueueIncident = async (incident) => {
  try {
    const list = await readQueueFile();
    const item = { ...incident, _localId: Date.now() };
    list.push(item);
    await writeQueueFile(list);
    return true;
  } catch (e) {
    console.warn('OfflineQueue: enqueue failed', e);
    return false;
  }
};

const flushQueue = async () => {
  try {
    const list = await readQueueFile();
    if (!Array.isArray(list) || list.length === 0) return;

    const remaining = [];
    for (const item of list) {
      try {
        // Attempt to send to server
        await ApiService.reportPoachingIncident(item);
        // success -> skip
      } catch (err) {
        // keep the item for later retry
        console.warn('OfflineQueue: failed to send item, will retry later', err && err.message);
        remaining.push(item);
      }
    }

    // write remaining back
    await writeQueueFile(remaining);
  } catch (e) {
    console.warn('OfflineQueue: flush error', e);
  }
};

const start = (opts = {}) => {
  const intervalMs = opts.intervalMs || 60 * 1000; // default 60s

  // flush immediately once
  flushQueue();

  // periodic flush
  if (!interval) interval = setInterval(() => flushQueue(), intervalMs);

  // flush when app comes to foreground
  AppState.addEventListener('change', _handleAppState);
};

const stop = () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  try {
    AppState.removeEventListener('change', _handleAppState);
  } catch (e) {
    // ignore
  }
};

const _handleAppState = (next) => {
  if (next === 'active') {
    flushQueue();
  }
};

export default {
  enqueueIncident,
  flushQueue,
  start,
  stop,
};
