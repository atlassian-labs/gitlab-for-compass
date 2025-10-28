import { Queue } from '@forge/events';
import { storage } from '@forge/api';
import dataProviderBackfill, { CURRENT_BACKFILL_VERSION } from './data-provider-backfill';
import { isCompassPushEventEnabled } from '../../services/feature-flags';
import { STORAGE_KEYS } from '../../constants';

jest.mock('@forge/events');
jest.mock('@forge/api');
jest.mock('../../services/feature-flags');

const mockPush = jest.fn();
const mockQueueConstructor = jest.fn(() => ({
  push: mockPush,
}));

(Queue as unknown as jest.Mock).mockImplementation(mockQueueConstructor);

const mockGet = jest.fn();
(storage.get as jest.Mock) = mockGet;

const mockIsCompassPushEventEnabled = isCompassPushEventEnabled as jest.Mock;

const mockReq = {
  context: {
    cloudId: 'cloud-123',
  },
};

describe('dataProviderBackfill', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockQueueConstructor.mockClear();
    mockGet.mockClear();
    mockIsCompassPushEventEnabled.mockClear();
  });

  it('does nothing if Compass push event is not enabled', async () => {
    mockIsCompassPushEventEnabled.mockReturnValue(false);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await dataProviderBackfill(mockReq as any);

    expect(warnSpy).toHaveBeenCalledWith('Compass push event is not enabled');
    // The constructor is called, but push should not be
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('skips backfill if version is up to date', async () => {
    mockIsCompassPushEventEnabled.mockReturnValue(true);
    mockGet.mockResolvedValue(CURRENT_BACKFILL_VERSION);

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await dataProviderBackfill(mockReq as any);

    expect(mockGet).toHaveBeenCalledWith('backfill-push-data-provider');
    // The constructor is called, but push should not be
    expect(mockPush).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      `Skipping backfill as it already has the latest version (v${CURRENT_BACKFILL_VERSION})`,
    );
    logSpy.mockRestore();
  });

  it('enqueues a backfill job if version is outdated', async () => {
    mockIsCompassPushEventEnabled.mockReturnValue(true);
    mockGet.mockResolvedValue(0);

    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    await dataProviderBackfill(mockReq as any);

    expect(mockGet).toHaveBeenCalledWith(STORAGE_KEYS.BACKFILL_PUSH_DATA_PROVIDER_VERSION);
    expect(mockQueueConstructor).toHaveBeenCalledWith({ key: 'data-provider-backfill' });
    expect(mockPush).toHaveBeenCalledWith({ cloudId: 'cloud-123' }, { delayInSeconds: Math.floor(0.5 * 900) });

    (Math.random as jest.Mock).mockRestore?.();
  });

  it('enqueues a backfill job if version is missing', async () => {
    mockIsCompassPushEventEnabled.mockReturnValue(true);
    mockGet.mockResolvedValue(undefined);

    jest.spyOn(Math, 'random').mockReturnValue(0.1);

    await dataProviderBackfill(mockReq as any);

    expect(mockGet).toHaveBeenCalledWith(STORAGE_KEYS.BACKFILL_PUSH_DATA_PROVIDER_VERSION);
    expect(mockQueueConstructor).toHaveBeenCalledWith({ key: 'data-provider-backfill' });
    expect(mockPush).toHaveBeenCalledWith({ cloudId: 'cloud-123' }, { delayInSeconds: Math.floor(0.1 * 900) });

    (Math.random as jest.Mock).mockRestore?.();
  });

  it('uses 0 as version if storage returns falsy', async () => {
    mockIsCompassPushEventEnabled.mockReturnValue(true);
    mockGet.mockResolvedValue(0);

    jest.spyOn(Math, 'random').mockReturnValue(0.2);

    await dataProviderBackfill(mockReq as any);

    expect(mockGet).toHaveBeenCalledWith(STORAGE_KEYS.BACKFILL_PUSH_DATA_PROVIDER_VERSION);
    expect(mockQueueConstructor).toHaveBeenCalledWith({ key: 'data-provider-backfill' });
    expect(mockPush).toHaveBeenCalledWith({ cloudId: 'cloud-123' }, { delayInSeconds: Math.floor(0.2 * 900) });

    (Math.random as jest.Mock).mockRestore?.();
  });
});
