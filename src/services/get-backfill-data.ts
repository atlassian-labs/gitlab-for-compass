import { DataProviderBuildEvent, DataProviderDeploymentEvent } from '@atlassian/forge-graphql';
import {
  getDeploymentsForEnvironmentTiers,
  getMRCycleTime,
  getOpenMergeRequestsCount,
  getProjectBuildsFor28Days,
} from './compute-event-and-metrics';
import { hasDeploymentAfter28Days } from '../utils/has-deployment-after-28days';
import { EnvironmentTier } from '../types';
import { isSendStagingEventsEnabled } from './feature-flags';

export const getBackfillData = async (
  groupToken: string,
  projectId: number,
  projectName: string,
  branchName: string,
): Promise<{
  builds: DataProviderBuildEvent[];
  deployments: DataProviderDeploymentEvent[];
  metrics: {
    mrCycleTime: number;
    openMergeRequestsCount: number;
  };
}> => {
  const [allBuildsFor28Days, mrCycleTime, deployments, openMergeRequestsCount] = await Promise.all([
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

  return {
    builds: allBuildsFor28Days,
    deployments,
    metrics: {
      mrCycleTime,
      openMergeRequestsCount,
    },
  };
};
