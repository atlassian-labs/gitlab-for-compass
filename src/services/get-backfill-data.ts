import { DataProviderBuildEvent, DataProviderDeploymentEvent } from '@atlassian/forge-graphql';
import {
  getDeploymentsForProductionEnvironments,
  getMRCycleTime,
  getOpenMergeRequestsCount,
  getProjectBuildsFor28Days,
} from './compute-event-and-metrics';
import { hasDeploymentAfter28Days } from '../utils/has-deployment-after-28days';

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
    getDeploymentsForProductionEnvironments(groupToken, projectId, projectName),
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
