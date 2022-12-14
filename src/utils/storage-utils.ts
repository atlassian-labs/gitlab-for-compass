import { ListResult, startsWith, storage } from '@forge/api';
import { chunk } from 'lodash';

import { sleep } from './time-utils';
import { STORAGE_KEYS } from '../constants';

export const deleteKeysFromStorageByChunks = async (
  keys: string[],
  chunkSize: number,
  delay: number,
): Promise<void> => {
  const keyChunks = chunk(keys, chunkSize);

  for (const keyChunk of keyChunks) {
    await Promise.all(keyChunk.map((key: string) => storage.delete(key)));
    await sleep(delay);
  }
};

export const getGroupIds = async (): Promise<number[]> => {
  const groupsKeys: ListResult = await storage
    .query()
    .where('key', startsWith(STORAGE_KEYS.GROUP_KEY_PREFIX))
    .getMany();

  return groupsKeys.results.map(({ key }) => Number(key.replace(STORAGE_KEYS.GROUP_KEY_PREFIX, '')));
};
