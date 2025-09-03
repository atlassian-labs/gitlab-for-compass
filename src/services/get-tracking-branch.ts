import { getProjectBranch, getProjectVariable } from '../client/gitlab';
import { NON_DEFAULT_BRANCH_VARIABLE_KEY } from '../constants';
import { ProjectBranch } from '../types';

export const getTrackingBranchName = async (
  groupToken: string,
  projectId: number,
  defaultBranch: string,
): Promise<string> => {
  try {
    const branchName = await getProjectVariable(groupToken, projectId, NON_DEFAULT_BRANCH_VARIABLE_KEY);
    await getProjectBranch(groupToken, projectId, branchName);

    return branchName;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Non-default branch not found.', e.message);
    return defaultBranch;
  }
};

export const getProjectTrackingBranch = async (
  groupToken: string,
  projectId: number,
  defaultBranch: string,
): Promise<ProjectBranch | null> => {
  let branchName: string;
  try {
    branchName = await getProjectVariable(groupToken, projectId, NON_DEFAULT_BRANCH_VARIABLE_KEY);
  } catch (e) {
    branchName = defaultBranch;
  }

  try {
    return await getProjectBranch(groupToken, projectId, branchName);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('branch not found.', e.message);
    return null;
  }
};
