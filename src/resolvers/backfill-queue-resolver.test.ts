import graphqlGateway from '@atlassian/forge-graphql';
import { storage } from '@forge/api';
import { STORAGE_KEYS } from '../constants';
import { CURRENT_BACKFILL_VERSION } from '../entry/scheduled-triggers/data-provider-backfill';
import handler from './backfill-queue-resolver';

jest.mock('@atlassian/forge-graphql', () => ({
  compass: {
    asApp: jest.fn(),
  },
}));
jest.mock('@forge/api', () => ({
  storage: {
    set: jest.fn(),
  },
}));

const mockSynchronizeLinkAssociations = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (graphqlGateway.compass.asApp as jest.Mock).mockReturnValue({
    synchronizeLinkAssociations: mockSynchronizeLinkAssociations,
  });
});

describe('dataProviderBackfill resolver', () => {
  const cloudId = 'cloud-123';
  const payload = { cloudId };

  it('calls synchronizeLinkAssociations and sets storage on success', async () => {
    mockSynchronizeLinkAssociations.mockResolvedValue({ success: true });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await handler({
      call: {
        functionKey: 'dataProviderBackfill',
        payload,
      },
      context: {
        cloudId,
      },
    });

    expect(graphqlGateway.compass.asApp).toHaveBeenCalled();
    expect(mockSynchronizeLinkAssociations).toHaveBeenCalledWith({
      cloudId,
      forgeAppId: process.env.FORGE_APP_ID,
      options: { eventTypes: ['PUSH'] },
    });
    expect(storage.set).toHaveBeenCalledWith(
      STORAGE_KEYS.BACKFILL_PUSH_DATA_PROVIDER_VERSION,
      CURRENT_BACKFILL_VERSION,
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'BACKFILL: dataProviderBackfill queue invocation',
        cloudId,
      }),
    );
    expect(logSpy).toHaveBeenCalledWith('BACKFILL: synchronize link associations success');
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('logs error if synchronizeLinkAssociations fails', async () => {
    mockSynchronizeLinkAssociations.mockResolvedValue({ success: false, errors: ['err1'] });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await await handler({
      call: {
        functionKey: 'dataProviderBackfill',
        payload,
      },
      context: {
        cloudId,
      },
    });

    expect(graphqlGateway.compass.asApp).toHaveBeenCalled();
    expect(mockSynchronizeLinkAssociations).toHaveBeenCalledWith({
      cloudId,
      forgeAppId: process.env.FORGE_APP_ID,
      options: { eventTypes: ['PUSH'] },
    });
    expect(storage.set).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('BACKFILL: synchronize link associations failure', ['err1']);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'BACKFILL: dataProviderBackfill queue invocation',
        cloudId,
      }),
    );
    expect(logSpy).not.toHaveBeenCalledWith('BACKFILL: synchronize link associations success');

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
