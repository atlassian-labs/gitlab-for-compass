import { ListResult, startsWith, storage } from '@forge/api';
import { chunk } from 'lodash';

import { sleep } from './time-utils';
import { STORAGE_KEYS } from '../constants';
import { getFormattedErrors, hasRejections } from './promise-allsettled-helpers';

export const deleteKeysFromStorageByChunks = async (
  keys: string[],
  chunkSize: number,
  delay: number,
): Promise<void> => {
  const keyChunks = chunk(keys, chunkSize);

  for (const keyChunk of keyChunks) {
    const settledResult = await Promise.allSettled(keyChunk.map((key: string) => storage.delete(key)));

    if (hasRejections(settledResult)) {
      throw new Error(`Error deleting key: ${getFormattedErrors(settledResult)}`);
    }
    await sleep(delay);
  }
};

export const getGroupIds = async (): Promise<number[]> => {
  const groupsKeys: ListResult = await storage
    .query()
    .where('key', startsWith(STORAGE_KEYS.GROUP_NAME_KEY_PREFIX))
    .getMany();

  return groupsKeys.results.map(({ key }) => Number(key.replace(STORAGE_KEYS.GROUP_NAME_KEY_PREFIX, '')));
};
