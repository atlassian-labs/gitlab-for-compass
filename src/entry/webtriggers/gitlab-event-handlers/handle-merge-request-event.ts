import { BuiltinMetricDefinitions } from '@atlassian/forge-graphql';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { MergeRequestEvent } from '../../../types';
import { insertMetricValues } from '../../../services/insert-metric-values';
import { getMRCycleTime, getOpenMergeRequestsCount } from '../../../services/compute-event-and-metrics';
import { ALL_SETTLED_STATUS, getFormattedErrors } from '../../../utils/promise-allsettled-helpers';

export const handleMergeRequestEvent = async (
  event: MergeRequestEvent,
  groupToken: string,
  cloudId: string,
): Promise<void> => {
  console.log('Merge request event received');
  const {
    project: { id, default_branch: defaultBranch },
    object_attributes: { target_branch: targetBranch },
  } = event;
  try {
    const trackingBranch = await getTrackingBranchName(groupToken, id, defaultBranch);

    if (trackingBranch === targetBranch) {
      const [cycleTimeResult, openMergeRequestsCountResult] = await Promise.allSettled([
        getMRCycleTime(groupToken, id, trackingBranch),
        getOpenMergeRequestsCount(groupToken, id, trackingBranch),
      ]);

      if (
        cycleTimeResult.status === ALL_SETTLED_STATUS.REJECTED ||
        openMergeRequestsCountResult.status === ALL_SETTLED_STATUS.REJECTED
      ) {
        throw new Error(
          `Failed to get merge request cycle time or open merge request count: ${getFormattedErrors([
            cycleTimeResult,
            openMergeRequestsCountResult,
          ])}`,
        );
      }

      const cycleTime = cycleTimeResult.value;
      const openMergeRequestsCount = openMergeRequestsCountResult.value;

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
  } catch (e) {
    console.error('Error while inserting merge requests metric values', e);
  }
};
