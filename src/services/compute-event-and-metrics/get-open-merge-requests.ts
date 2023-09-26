import { getOpenMergeRequests } from '../mergeRequest';

export const getOpenMergeRequestsCount = async (
  baseUrl: string,
  groupToken: string,
  projectId: number,
  trackingBranch: string,
): Promise<number> => {
  const openMergeRequests = await getOpenMergeRequests(baseUrl, groupToken, projectId, trackingBranch);

  return openMergeRequests.length;
};
