import { storage } from '@forge/api';
import { GetFileContentsPayload, GetFileContentsResponse } from './types';
import { getRawFileContent } from '../../client/gitlab';
import { STORAGE_SECRETS } from '../../constants';
import { GitlabHttpMethodError } from '../../models/errors';

export const getFileContent = async (payload: GetFileContentsPayload): Promise<GetFileContentsResponse> => {
  try {
    const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${payload.groupId}`);
    const contents = await getRawFileContent(groupToken, payload.projectId, payload.filePath, payload.ref);

    return {
      success: true,
      file: {
        contents,
      },
      statusCode: 200,
    };
  } catch (error) {
    if (error instanceof GitlabHttpMethodError) {
      return {
        success: false,
        errorMessage: error.statusText,
        statusCode: error.status,
      };
    }
    console.error({ message: 'Error performing getFileContents' });
    return {
      success: false,
      errorMessage: error.message,
      statusCode: 500,
    };
  }
};
