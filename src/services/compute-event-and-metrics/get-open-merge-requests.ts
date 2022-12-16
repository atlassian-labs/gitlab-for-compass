import { getOpenMergeRequests } from '../mergeRequest';

export const getOpenMergeRequestsCount = async (
  groupToken: string,
  projectId: number,
  trackingBranch: string,
): Promise<number> => {
  try {
    const openMergeRequests = await getOpenMergeRequests(groupToken, projectId, trackingBranch);

    return openMergeRequests.length;
  } catch (e) {
    console.error('Cannot calculate open merge requests count metric: ', e.message);

    return null;
  }
};
