import {
  getDeploymentsForEnvironmentTiers,
  getMRCycleTime,
  getOpenMergeRequestsCount,
  getProjectBuildsFor28Days,
} from './compute-event-and-metrics';
import { hasDeploymentAfter28Days } from '../utils/has-deployment-after-28days';
import { BackfillData, EnvironmentTier } from '../types';
import { isSendStagingEventsEnabled } from './feature-flags';
import { getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';

export const getBackfillData = async (
  groupToken: string,
  projectId: number,
  projectName: string,
  branchName: string,
): Promise<BackfillData> => {
  try {
    const backfillResults = await Promise.allSettled([
      getProjectBuildsFor28Days(groupToken, projectId, projectName, branchName),
      getMRCycleTime(groupToken, projectId, branchName),
      getDeploymentsForEnvironmentTiers(
        groupToken,
        projectId,
        projectName,
        isSendStagingEventsEnabled ? [EnvironmentTier.PRODUCTION, EnvironmentTier.STAGING] : undefined,
      ),
      getOpenMergeRequestsCount(groupToken, projectId, branchName),
      hasDeploymentAfter28Days(projectId, groupToken),
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
