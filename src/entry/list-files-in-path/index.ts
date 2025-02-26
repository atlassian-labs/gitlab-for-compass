import { storage } from '@forge/api';
import { ListFilesInPathPayload, ListFilesInPathResponse } from './types';
import { listFiles } from '../../client/gitlab';
import { STORAGE_SECRETS } from '../../constants';

export const listFilesInPath = async (payload: ListFilesInPathPayload): Promise<ListFilesInPathResponse> => {
  try {
    const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${payload.groupId}`);
    const projectFiles = await listFiles(
      groupToken,
      payload.projectId,
      payload.path,
      payload.ref,
      payload.pageToken,
      payload.pageSize,
      payload.recursive,
    );

    return {
      success: true,
      files: projectFiles,
      statusCode: 200,
    };
  } catch (error) {
    console.error({ message: 'Error performing listFilesInPath' });
    return {
      success: false,
      errorMessage: error.message,
      statusCode: 500,
    };
  }
};
