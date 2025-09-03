import { storage, ListResult, startsWith } from '@forge/api';
import { CLEAR_STORAGE_CHUNK_SIZE, CLEAR_STORAGE_DELAY, STORAGE_KEYS, STORAGE_SECRETS } from '../constants';
import { deleteKeysFromStorageByChunks } from '../utils/storage-utils';
import { getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';

const getLastFailedProjectsKeys = async (): Promise<string[]> => {
  const lastFailedProjects: ListResult = await storage
    .query()
    .where('key', startsWith(STORAGE_KEYS.CURRENT_IMPORT_FAILED_PROJECT_PREFIX))
    .getMany();

  return lastFailedProjects.results.map(({ key }) => key);
};

const clearStorageSecretsForGroup = async (groupId: string): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log('Clearing storage secrets start');
  await storage.deleteSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);
  // eslint-disable-next-line no-console
  console.log('Clearing storage secrets end');
};

const clearStorageEntriesForGroup = async (groupId: string): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log('Clearing storage entries start');

  const groupKeys = [
    `${STORAGE_KEYS.GROUP_NAME_KEY_PREFIX}${groupId}`,
    `${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${groupId}`,
    `${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`,
    `${STORAGE_KEYS.WEBHOOK_SIGNATURE_PREFIX}${groupId}`,
    `${STORAGE_KEYS.WEBHOOK_SETUP_IN_PROGRESS}${groupId}`,
  ];

  await deleteKeysFromStorageByChunks(groupKeys, CLEAR_STORAGE_CHUNK_SIZE, CLEAR_STORAGE_DELAY);
  // eslint-disable-next-line no-console
  console.log('Clearing storage entries end');
};

export const clearImportKeys = async (): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log('Clearing storage import keys start');

  const importKeys = [
    STORAGE_KEYS.LAST_SYNC_TIME,
    STORAGE_KEYS.CURRENT_IMPORT_QUEUE_JOB_IDS,
    STORAGE_KEYS.CURRENT_IMPORT_TOTAL_PROJECTS,
    ...(await getLastFailedProjectsKeys()),
  ];

  await deleteKeysFromStorageByChunks(importKeys, CLEAR_STORAGE_CHUNK_SIZE, CLEAR_STORAGE_DELAY);
  // eslint-disable-next-line no-console
  console.log('Clearing storage import keys end');
};

export const deleteGroupDataFromStorage = async (groupId: string): Promise<void> => {
  const deleteGroupDataResult = await Promise.allSettled([
    clearStorageSecretsForGroup(groupId),
    clearStorageEntriesForGroup(groupId),
    clearImportKeys(),
  ]);

  if (hasRejections(deleteGroupDataResult)) {
    throw new Error(`Error deleting group data: ${getFormattedErrors(deleteGroupDataResult)}`);
  }
};
