import { getOpenMergeRequests } from '../mergeRequest';

export const getOpenMergeRequestsCount = async (
  groupToken: string,
  projectId: number,
  trackingBranch: string,
): Promise<number> => {
  const openMergeRequests = await getOpenMergeRequests(groupToken, projectId, trackingBranch);

  return openMergeRequests.length;
};
