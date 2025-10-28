import { storage } from '@forge/api';
import { setLastSyncTime, getLastSyncTime } from './last-sync-time';
import { STORAGE_KEYS } from '../constants';

jest.mock('@forge/api', () => ({
  storage: {
    set: jest.fn(),
    get: jest.fn(),
  },
}));

describe('lastSyncTime utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setLastSyncTime', () => {
    it('sets the provided lastSyncTime', async () => {
      const time = '2025-10-27T12:34:56.789Z';
      await setLastSyncTime(time);
      expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.LAST_SYNC_TIME, time);
    });
  });

  describe('getLastSyncTime', () => {
    it('returns the stored lastSyncTime if present', async () => {
      (storage.get as jest.Mock).mockResolvedValue('2025-10-27T12:34:56.789Z');
      const result = await getLastSyncTime();
      expect(storage.get).toHaveBeenCalledWith(STORAGE_KEYS.LAST_SYNC_TIME);
      expect(result).toBe('2025-10-27T12:34:56.789Z');
    });

    it('returns null if no lastSyncTime is stored', async () => {
      (storage.get as jest.Mock).mockResolvedValue(undefined);
      const result = await getLastSyncTime();
      expect(storage.get).toHaveBeenCalledWith(STORAGE_KEYS.LAST_SYNC_TIME);
      expect(result).toBeNull();
    });

    it('returns null if lastSyncTime is null', async () => {
      (storage.get as jest.Mock).mockResolvedValue(null);
      const result = await getLastSyncTime();
      expect(storage.get).toHaveBeenCalledWith(STORAGE_KEYS.LAST_SYNC_TIME);
      expect(result).toBeNull();
    });
  });
});
