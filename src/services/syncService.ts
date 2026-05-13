import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import {DatabaseService} from './database';
import {useAppStore} from '../store/appStore';

const API_BASE = 'http://192.168.1.100:3000/api';

export const SyncService = {
  async checkConnectivity(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  },

  async syncAll(): Promise<void> {
    const isOnline = await this.checkConnectivity();
    const store = useAppStore.getState();
    store.setIsOnline(isOnline);

    if (!isOnline) {
      console.log('[Sync] Offline - skipping sync');
      return;
    }

    const queue = await DatabaseService.getSyncQueue();
    store.setPendingSyncCount(queue.length);

    for (const item of queue) {
      try {
        await axios.post(
          `${API_BASE}/sync`,
          {
            table: item.table_name,
            recordId: item.record_id,
            action: item.action,
            payload: JSON.parse(item.payload),
          },
          {timeout: 5000},
        );
        await DatabaseService.deleteSyncQueueItem(item.id);
      } catch (e) {
        console.warn('[Sync] Failed item:', item.id, e);
      }
    }

    const remaining = await DatabaseService.getSyncQueue();
    store.setPendingSyncCount(remaining.length);
  },

  startAutoSync(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      this.syncAll().catch(console.warn);
    }, intervalMs);

    const unsubscribe = NetInfo.addEventListener(async state => {
      const store = useAppStore.getState();
      const online = state.isConnected === true;
      store.setIsOnline(online);
      if (online) {
        await this.syncAll();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  },
};
