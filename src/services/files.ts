import { storage } from '@forge/api';
import { STORAGE_SECRETS } from '../constants';
import { fetchPaginatedData } from '../utils/fetchPaginatedData';
import { searchGroupFiles } from '../client/gitlab';

export const getAllGroupCaCFiles = async ({ groupId }: { groupId: number }) => {
  const searchQuery = 'file:compass.yml|compass.yaml';

  try {
    const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);

    const yamlFiles = await fetchPaginatedData(searchGroupFiles, { groupToken, groupId, search: searchQuery });

    return yamlFiles;
  } catch (e) {
    console.error(`Error while searching yaml files in the group: ${groupId}:`, e);

    throw e;
  }
};
