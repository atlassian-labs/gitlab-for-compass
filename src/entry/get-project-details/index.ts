import { GetProjectDetailsPayload, GetProjectDetailsResponse } from './types';
import { getProjectDataFromUrl } from '../../services/data-provider-link-parser';
import { getProjectTrackingBranch } from '../../services/get-tracking-branch';
import { GitlabAPIProject } from '../../types';

export const getProjectDetails = async (payload: GetProjectDetailsPayload): Promise<GetProjectDetailsResponse> => {
  try {
    let projectDataResult;
    try {
      projectDataResult = await getProjectDataFromUrl(payload.projectUrl);
    } catch (e) {
      console.warn('Cannot get GitLab project data from provided url.');
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
