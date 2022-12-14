import { mergeRequestCycleTime } from '../metric-calculations/merge-request-cycle-time';
import { getLastMergedMergeRequests } from '../mergeRequest';

export const getMRCycleTime = async (
  groupToken: string,
  projectId: number,
  trackingBranch: string,
): Promise<number> => {
  try {
    const mergeRequests = await getLastMergedMergeRequests(groupToken, projectId, trackingBranch);

    return mergeRequestCycleTime(mergeRequests);
  } catch (e) {
    console.error('Cannot calculate merge requests cycle time metric: ', e.message);

    return 0;
  }
};
