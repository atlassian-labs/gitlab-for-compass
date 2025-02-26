import { GetRepoDetailsPayload, GetRepoDetailsResponse } from './types';
import { getProjectDataFromUrl } from '../../services/data-provider-link-parser';
import { getProjectTrackingBranch } from '../../services/get-tracking-branch';

export const getRepoDetails = async (payload: GetRepoDetailsPayload): Promise<GetRepoDetailsResponse> => {
  try {
    const projectDataResult = await getProjectDataFromUrl(payload.projectUrl);
    if (!projectDataResult) {
      console.warn('GitLab project not found.');
      return {
        success: false,
        errorMessage: 'project not found',
        statusCode: 404,
      };
    }

    const {
      project: { id: projectId, default_branch: defaultBranch },
      groupToken,
      groupId,
    } = projectDataResult;

    const branchResult = await getProjectTrackingBranch(groupToken, projectId, defaultBranch);
    if (!branchResult) {
      console.warn('Cannot get GitLab project branch data. Branch not found.');
      return {
        success: false,
        errorMessage: 'branch not found',
        statusCode: 404,
      };
    }
    const {
      name,
      commit: { id: commitId },
    } = branchResult;

    return {
      success: true,
      project: {
        projectId,
        groupId,
        defaultBranch: name,
        shaOnDefaultBranch: commitId,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error({ message: 'Error performing getProjectDetails' });
    return {
      success: false,
      errorMessage: error.message,
      statusCode: 500,
    };
  }
};
