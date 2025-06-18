import { storage } from '@forge/api';
import { STORAGE_SECRETS } from '../constants';
import { GitLabHeaders, searchGroupFiles } from '../client/gitlab';

export const getGroupCaCFiles = async ({
  groupId,
  page,
  perPage,
}: {
  groupId: number;
  page: number;
  perPage: number;
}) => {
  const searchQuery = 'file:compass.yml|compass.yaml';

  try {
    const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);

    const { data, headers } = await searchGroupFiles({
      groupToken,
      groupId,
      page,
      perPage,
      search: searchQuery,
    });

    const hasNextPage = headers.get(GitLabHeaders.PAGINATION_NEXT_PAGE) !== undefined;

    return {
      data,
      hasNextPage,
    };
  } catch (e) {
    console.error(`Error while searching yaml files in the group: ${groupId}:`, e);

    throw e;
  }
};
