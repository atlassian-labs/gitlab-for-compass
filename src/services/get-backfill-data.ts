import { CompassEventType } from '@atlassian/forge-graphql';
import {
  getDeploymentsForEnvironmentTiers,
  getMRCycleTime,
  getOpenMergeRequestsCount,
  getProjectBuildsFor28Days,
} from './compute-event-and-metrics';
import { BackfillData, EnvironmentTier } from '../types';
import { isSendStagingEventsEnabled } from './feature-flags';
import { getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';

export const shouldBackfillType = (eventType: CompassEventType, requestedTypes?: CompassEventType[]): boolean => {
  return requestedTypes === null || requestedTypes === undefined || requestedTypes?.includes(eventType);
};

export const getBackfillData = async (
  groupToken: string,
  projectId: number,
  projectName: string,
  branchName: string,
  eventTypes?: CompassEventType[],
): Promise<BackfillData> => {
  try {
    const backfillResults = await Promise.allSettled([
      shouldBackfillType(CompassEventType.Build, eventTypes)
        ? getProjectBuildsFor28Days(groupToken, projectId, projectName, branchName)
        : [],
      shouldBackfillType(CompassEventType.PullRequest, eventTypes)
        ? getMRCycleTime(groupToken, projectId, branchName)
        : null,
      shouldBackfillType(CompassEventType.Deployment, eventTypes)
        ? getDeploymentsForEnvironmentTiers(
            groupToken,
            projectId,
            projectName,
            isSendStagingEventsEnabled ? [EnvironmentTier.PRODUCTION, EnvironmentTier.STAGING] : undefined,
          )
        : [],
      shouldBackfillType(CompassEventType.PullRequest, eventTypes)
        ? getOpenMergeRequestsCount(groupToken, projectId, branchName)
        : null,
    ]);

    if (hasRejections(backfillResults)) {
      throw new Error(`Error getting backfill data ${getFormattedErrors(backfillResults)}`);
    }

    const [allBuildsFor28Days, mrCycleTime, deployments, openMergeRequestsCount] = backfillResults.map(
      (backfillResult) => (backfillResult as PromiseFulfilledResult<any>).value,
    );

    return {
      builds: allBuildsFor28Days,
      deployments,
      metrics: {
        mrCycleTime,
        openMergeRequestsCount,
      },
    };
  } catch (e) {
    throw new Error(`Error while getting backfill data: ${e}`);
  }
};
