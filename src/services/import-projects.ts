// eslint-disable-next-line max-classes-per-file
import { storage } from '@forge/api';
import { Queue } from '@forge/events';
import { Payload } from '@forge/events/out/types';
import { chunk } from 'lodash';

import { CLEAR_STORAGE_CHUNK_SIZE, CLEAR_STORAGE_DELAY, STORAGE_KEYS } from '../constants';
import { Queues, ImportableProject, ProjectImportResult, ImportStatus } from '../types';
import { ImportErrorTypes } from '../resolverTypes';
import { setLastSyncTime } from './last-sync-time';
import { deleteKeysFromStorageByChunks } from '../utils/storage-utils';
import { getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';
import { getFailedProjects, ImportFailedError } from '../resolvers/shared-resolvers';

export const QUEUE_ONE_TIME_LIMIT = 500;
const QUEUE_PUSH_EVENTS_LIMIT = 50;

class OneTimeLimitImportError extends Error {}

export const importProjects = async (
  cloudId: string,
  projectsReadyToImport: ImportableProject[],
  groupId: number,
): Promise<void> => {
  try {
    const queueOneTimeLimit = process.env.QUEUE_ONE_TIME_LIMIT || QUEUE_ONE_TIME_LIMIT;

    const queue = new Queue({ key: Queues.IMPORT });

    if (projectsReadyToImport.length > Number(queueOneTimeLimit)) {
      throw new OneTimeLimitImportError(
        `Sorry, unfortunately you can import maximum ${QUEUE_ONE_TIME_LIMIT} projects at one time.`,
      );
    }

    const projectsData: Payload[] = projectsReadyToImport.map((project) => {
      return {
        createProjectData: JSON.stringify({
          cloudId,
          project,
          groupId,
        }),
      };
    });

    const jobIds = [];
    const projectChunks = chunk(projectsData, QUEUE_PUSH_EVENTS_LIMIT);

    for (const projectChunk of projectChunks) {
      const jobId = await queue.push(projectChunk, { delayInSeconds: 2 });
      jobIds.push(jobId);
    }

    await storage.set(STORAGE_KEYS.CURRENT_IMPORT_TOTAL_PROJECTS, projectsReadyToImport.length);
    await storage.set(STORAGE_KEYS.CURRENT_IMPORT_QUEUE_JOB_IDS, jobIds);

    await setLastSyncTime();
  } catch (e) {
    console.error(e.message);
    if (e instanceof OneTimeLimitImportError) {
      throw new ImportFailedError(ImportErrorTypes.ONE_TIME_IMPORT_LIMIT, e.message);
    }

    throw new ImportFailedError(ImportErrorTypes.UNEXPECTED_ERROR, e.message);
  }
};

export const getImportStatus = async (): Promise<ImportStatus> => {
  try {
    const jobIds = await storage.get(STORAGE_KEYS.CURRENT_IMPORT_QUEUE_JOB_IDS);
    if (!jobIds.length) {
      throw new Error('No running job');
    }
    const queue = new Queue({ key: Queues.IMPORT });
    const jobStatusesResult = await Promise.allSettled(
      jobIds.map((id: string) => {
        const job = queue.getJob(id);
        return job.getStats().then((s) => s.json());
      }),
    );

    if (hasRejections(jobStatusesResult)) {
      throw new Error(`Error getting job statuses: ${getFormattedErrors(jobStatusesResult)}`);
    }

    const jobStatuses = jobStatusesResult.map(
      (jobStatusResult) => (jobStatusResult as PromiseFulfilledResult<ImportStatus>).value,
    );

    return jobStatuses.reduce<ImportStatus>(
      (acc: ImportStatus, importStatus: ImportStatus) => {
        return {
          inProgress: acc.inProgress + importStatus.inProgress,
          success: acc.success + importStatus.success,
          failed: acc.failed + importStatus.failed,
        };
      },
      { inProgress: 0, success: 0, failed: 0 },
    );
  } catch (err) {
    throw new ImportFailedError(ImportErrorTypes.CANNOT_GET_PROGRESS_STATUS, err.message);
  }
};

export const getImportResult = async (): Promise<ProjectImportResult> => {
  return getImportResult();
};

export const clearImportResult = async (): Promise<void | never> => {
  try {
    const failedProjects = await getFailedProjects();
    const deleteFailedProjects = failedProjects.results.map(({ key }) => key);
    await deleteKeysFromStorageByChunks(
      [...deleteFailedProjects, STORAGE_KEYS.CURRENT_IMPORT_TOTAL_PROJECTS],
      CLEAR_STORAGE_CHUNK_SIZE,
      CLEAR_STORAGE_DELAY,
    );
  } catch (err) {
    throw new ImportFailedError(ImportErrorTypes.FAILED_CLEAR_IMPORT_RESULT, err.message);
  }
};
