/* eslint-disable import/first, import/order */
import { mockAgg, mockUpdateComponentDataManager } from '../../__tests__/helpers/mock-agg';

mockAgg();

import { ComponentSyncEventStatus } from '@atlassian/forge-graphql';
import { AggClientError, InvalidConfigFileError } from '../../models/errors';
import { reportSyncError } from './report-sync-error';

describe('reportSyncError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should build lastSyncError with UserError status in case of InvalidConfigFileError', async () => {
    const error = new InvalidConfigFileError(['error1'], 'error');
    await reportSyncError(error, 'id', 'externalSourceURL');

    expect(mockUpdateComponentDataManager).toBeCalledWith(
      expect.objectContaining({
        lastSyncEvent: {
          status: ComponentSyncEventStatus.UserError,
          lastSyncErrors: error.errors,
        },
      }),
    );
  });

  it('should build lastSyncError with UserError status in case of AggClientError', async () => {
    const error = new AggClientError(['error2']);
    await reportSyncError(error, 'id', 'externalSourceURL');

    expect(mockUpdateComponentDataManager).toBeCalledWith(
      expect.objectContaining({
        lastSyncEvent: {
          status: ComponentSyncEventStatus.UserError,
          lastSyncErrors: error.errors,
        },
      }),
    );
  });

  it('should build lastSyncError with ServerError status in case of other errors', async () => {
    const error = new Error('message');
    await reportSyncError(error, 'id', 'externalSourceURL');

    expect(mockUpdateComponentDataManager).toBeCalledWith(
      expect.objectContaining({
        lastSyncEvent: {
          status: ComponentSyncEventStatus.ServerError,
          lastSyncErrors: [error.message],
        },
      }),
    );
  });
});
