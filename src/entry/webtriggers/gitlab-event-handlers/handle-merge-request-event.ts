import { BuiltinMetricDefinitions } from '@atlassian/forge-graphql';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { MergeRequestEvent } from '../../../types';
import { insertMetricValues } from '../../../services/insert-metric-values';
import { getMRCycleTime, getOpenMergeRequestsCount } from '../../../services/compute-event-and-metrics';

export const handleMergeRequestEvent = async (
  event: MergeRequestEvent,
  baseUrl: string,
  groupToken: string,
  cloudId: string,
): Promise<void> => {
  console.log('Merge request event received');
  const {
    project: { id, default_branch: defaultBranch },
    object_attributes: { target_branch: targetBranch },
  } = event;
  const trackingBranch = await getTrackingBranchName(baseUrl, groupToken, id, defaultBranch);

  if (trackingBranch === targetBranch) {
    const [cycleTime, openMergeRequestsCount] = await Promise.all([
      getMRCycleTime(baseUrl, groupToken, id, trackingBranch),
      getOpenMergeRequestsCount(baseUrl, groupToken, id, trackingBranch),
    ]);

    const metricInput = {
      projectID: id.toString(),
      metrics: [
        {
          metricAri: BuiltinMetricDefinitions.PULL_REQUEST_CYCLE_TIME_AVG_LAST_10,
          value: cycleTime,
          timestamp: new Date().toISOString(),
        },
        {
          metricAri: BuiltinMetricDefinitions.OPEN_PULL_REQUESTS,
          value: openMergeRequestsCount,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    await insertMetricValues(metricInput, cloudId);
  }
};
