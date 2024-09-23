/*  eslint-disable import/order, import/first */
import { mockForgeApi, mockForgeEvents } from '../__tests__/helpers/forge-helper';

mockForgeEvents();
mockForgeApi();

import { Queue } from '@forge/events';
import { storage } from '@forge/api';
import {
  ImportFailedError,
  importProjects,
  clearImportResult,
  getImportResult,
  getImportStatus,
  QUEUE_ONE_TIME_LIMIT,
} from './import-projects';
import { setLastSyncTime } from './last-sync-time';
import { mocked } from 'jest-mock';
import { ImportErrorTypes } from '../resolverTypes';
import { ALL_SETTLED_STATUS, getFormattedErrors } from '../utils/promise-allsettled-helpers';

const storageGetSuccess = jest.fn().mockReturnValue(['jobId1', 'jobId2']);
const storageGetEmptyArray = jest.fn().mockReturnValue([]);
const storageSetSuccess = jest.fn().mockImplementation(() => Promise.resolve());
const storageDeleteSuccess = jest.fn().mockImplementation(() => Promise.resolve());
const storageQuerySuccess = jest.fn().mockImplementation(() => {
  return {
    where: () => {
      return {
        getMany: async () => {
          return {
            results: [{ key: 'key', value: 'value' }],
          };
        },
      };
    },
  };
});

const queueMockPushSuccess = jest.fn().mockImplementation(() => Promise.resolve());
const queueMockGetJobSuccess = jest.fn().mockImplementation(() => {
  return {
    getStats: async () => {
      return {
        json: async () => {
          return { inProgress: 0, failed: 0, success: 0 };
        },
      };
    },
  };
});

const errorForClearImportProject = new Error('Failed to clear import projects result');
const errorForImportProject = new Error('Import projects failed.');
const errorForGetImportResult = new Error('Cannot get import result');
const errorForGetProgressStatus = new Error('Cannot get progress status');

const storageDeleteFailed = jest.fn().mockRejectedValue(errorForClearImportProject);
const storageQueryFailed = jest.fn().mockImplementation(() => {
  throw errorForClearImportProject;
});
const storageGetFailed = jest.fn().mockRejectedValue(errorForGetImportResult);

const setLastSyncTimeMockFailed = jest.fn().mockRejectedValue(errorForImportProject);
const queueMockGetJobFailed = jest.fn().mockRejectedValue(errorForGetProgressStatus);
const storageSetFailed = jest.fn().mockRejectedValue(errorForImportProject);
const queueMockPushFailed = jest.fn().mockRejectedValue(errorForImportProject);
const queueOneTimeLimitError = new ImportFailedError(
  ImportErrorTypes.ONE_TIME_IMPORT_LIMIT,
  `Sorry, unfortunately you can import maximum ${QUEUE_ONE_TIME_LIMIT} projects at one time.`,
);

jest.mock('./last-sync-time', () => {
  const module = jest.requireActual('./last-sync-time');
  return { ...module, setLastSyncTime: jest.fn() };
});

const setLastSyncTimeMock = mocked(setLastSyncTime);

const storageQueryFailedForGetImportResult = jest.fn().mockImplementation(() => {
  throw errorForGetImportResult;
});

describe('importProjects test cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('importProjects test case: success for less than 50 projects per one import', async () => {
    Queue.prototype.push = queueMockPushSuccess;
    storage.set = storageSetSuccess;

    await importProjects('', new Array(5).fill(''), 1234);

    expect(Queue.prototype.push).toHaveBeenCalledTimes(1);
  });

  it('importProjects test case: success for more than 50 projects per one import', async () => {
    Queue.prototype.push = queueMockPushSuccess;
    storage.set = storageSetSuccess;

    await importProjects('', new Array(60).fill(''), 1234);

    expect(Queue.prototype.push).toHaveBeenCalledTimes(2);
  });

  it('importProjects test case: request failed by reason 500 projects limitation', async () => {
    Queue.prototype.push = queueMockPushSuccess;
    storage.set = storageSetSuccess;

    await expect(importProjects('', new Array(QUEUE_ONE_TIME_LIMIT + 1).fill(''), 1234)).rejects.toThrow(
      queueOneTimeLimitError,
    );
  });

  it('importProjects test case: queue failed', async () => {
    Queue.prototype.push = queueMockPushFailed;

    await expect(importProjects('', new Array(5).fill(''), 1234)).rejects.toThrow(errorForImportProject);
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('importProjects test case: storage set failed', async () => {
    Queue.prototype.push = queueMockPushSuccess;
    storage.set = storageSetFailed;

    await expect(importProjects('', [], 1234)).rejects.toThrow(errorForImportProject);
  });

  it('importRepositories test case: set last sync time failed', async () => {
    Queue.prototype.push = queueMockPushSuccess;
    storage.set = storageSetSuccess;
    setLastSyncTimeMock.mockImplementation(setLastSyncTimeMockFailed);

    await expect(importProjects('', [], 1234)).rejects.toThrow(errorForImportProject);

    expect(storage.set).toHaveBeenCalledTimes(2);
  });
});

describe('clearImportResult test cases', () => {
  beforeEach(() => {
    storage.delete = storageDeleteFailed;
  });

  it('clearImportResult test case: success', async () => {
    storage.delete = storageDeleteSuccess;
    storage.query = storageQuerySuccess;

    await expect(clearImportResult()).resolves.not.toThrow();
  });

  it('clearImportResult test case: storage query failed', async () => {
    storage.query = storageQueryFailed;

    await expect(clearImportResult()).rejects.toThrow(errorForClearImportProject);

    expect(storage.query).toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('clearImportResult test case: storage delete failed', async () => {
    storage.query = storageQuerySuccess;

    const RejectedPromiseSettled: PromiseSettledResult<unknown>[] = [
      {
        status: ALL_SETTLED_STATUS.REJECTED,
        reason: errorForClearImportProject,
      },
      {
        status: ALL_SETTLED_STATUS.REJECTED,
        reason: errorForClearImportProject,
      },
    ];

    await expect(clearImportResult()).rejects.toThrow(
      `Error deleting key: ${getFormattedErrors(RejectedPromiseSettled)}`,
    );

    expect(storage.query).toHaveBeenCalled();
    expect(storage.delete).toHaveBeenCalled();
  });
});

describe('getImportResult test cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getImportResult test case: success', async () => {
    storage.query = storageQuerySuccess;
    storage.get = jest.fn().mockReturnValue(1);

    expect(await getImportResult()).toEqual({ failed: ['value'], total: 1 });
  });

  it('getImportResult test case: storage query failed', async () => {
    storage.query = storageQueryFailedForGetImportResult;

    await expect(getImportResult()).rejects.toThrow(errorForGetImportResult);

    expect(storage.query).toHaveBeenCalled();
    expect(storage.get).not.toHaveBeenCalled();
  });

  it('getImportResult test case: storage get failed', async () => {
    storage.query = storageQuerySuccess;
    storage.get = storageGetFailed;

    await expect(getImportResult()).rejects.toThrow(errorForGetImportResult);

    expect(storage.query).toHaveBeenCalled();
    expect(storage.get).toHaveBeenCalled();
  });
});

describe('getImportStatus test cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getImportStatus test case: success', async () => {
    storage.get = storageGetSuccess;
    Queue.prototype.getJob = queueMockGetJobSuccess;

    const result = await getImportStatus();

    expect(result).toEqual({ failed: 0, success: 0, inProgress: 0 });
    expect(queueMockGetJobSuccess).toHaveBeenCalledTimes(2);
  });

  it('getImportStatus test case: error empty jobIds array', async () => {
    storage.get = storageGetEmptyArray;
    Queue.prototype.getJob = queueMockGetJobSuccess;

    await expect(getImportStatus()).rejects.toThrow('No running job');
    expect(queueMockGetJobSuccess).not.toHaveBeenCalled();
  });

  it('getImportStatus test case: failed', async () => {
    storage.get = queueMockGetJobFailed;
    Queue.prototype.getJob = queueMockGetJobSuccess;

    await expect(getImportStatus()).rejects.toThrow(errorForGetProgressStatus);
    expect(queueMockGetJobSuccess).not.toHaveBeenCalled();
  });
});
