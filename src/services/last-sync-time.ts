import { storage } from '@forge/api';

import { STORAGE_KEYS } from '../constants';

export const setLastSyncTime = async (lastSyncTime: string = new Date().toISOString()): Promise<void> =>
  storage.set(STORAGE_KEYS.LAST_SYNC_TIME, lastSyncTime);

export const getLastSyncTime = async (): Promise<null | string> => {
  const lastSyncTime = await storage.get(STORAGE_KEYS.LAST_SYNC_TIME);

  return lastSyncTime || null;
};
