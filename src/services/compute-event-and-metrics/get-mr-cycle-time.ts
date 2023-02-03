import { mergeRequestCycleTime } from '../metric-calculations/merge-request-cycle-time';
import { getLastMergedMergeRequests } from '../mergeRequest';

export const getMRCycleTime = async (
  groupToken: string,
  projectId: number,
  trackingBranch: string,
): Promise<number> => {
  const mergeRequests = await getLastMergedMergeRequests(groupToken, projectId, trackingBranch);

  return mergeRequestCycleTime(mergeRequests);
};
