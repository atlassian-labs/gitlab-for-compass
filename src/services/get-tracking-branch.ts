import { getProjectBranch, getProjectVariable } from '../client/gitlab';
import { NON_DEFAULT_BRANCH_VARIABLE_KEY } from '../constants';

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
    console.log('Non-default branch not found.', e.message);
    return defaultBranch;
  }
};
