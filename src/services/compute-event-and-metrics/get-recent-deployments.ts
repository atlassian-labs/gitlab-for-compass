import { DataProviderDeploymentEvent } from '@atlassian/forge-graphql';

import { Deployment, EnvironmentTier } from '../../types';
import { getRecentDeployments, gitlabAPiDeploymentToCompassDataProviderDeploymentEvent } from '../deployment';
import { getProjectEnvironments } from '../environment';
import { getDateInThePast } from '../../utils/time-utils';
import { isSendStagingEventsEnabled } from '../feature-flags';

const newGetDeploymentsForEnvironments = async (
  baseUrl: string,
  groupToken: string,
  projectId: number,
  projectName: string,
  environmentTiers: EnvironmentTier[],
): Promise<DataProviderDeploymentEvent[]> => {
  // get all project environments
  const projectEnvironments = await getProjectEnvironments(projectId, baseUrl, groupToken);

  // get deploymentEvents for each projectEnvironment that matches the requested environmentTiers
  const deploymentEvents = projectEnvironments
    .filter((projectEnv) => environmentTiers.includes(projectEnv.tier))
    .map(async (projectEnv) => {
      const recentDeployments = await getRecentDeployments(
        baseUrl,
        groupToken,
        projectId,
        getDateInThePast(),
        projectEnv.name,
      );
      const dataProviderDeploymentEvents = recentDeployments
        .map((deployment) =>
          gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(deployment, projectName, projectEnv.tier),
        )
        .filter((event) => event !== null);
      const unprocessedEvents = recentDeployments.length - dataProviderDeploymentEvents.length;
      if (unprocessedEvents > 0) {
        console.log(
          `unprocessed deployment events count: ${unprocessedEvents} for environment id ${projectEnv.id} tier ${projectEnv.tier}`,
        );
      }
      return dataProviderDeploymentEvents;
    });

  // combine results from multiple projectEnvironments into single array
  return Promise.all(deploymentEvents).then((results) => results.flat());
};

export const getDeploymentsForEnvironmentTiers = async (
  baseUrl: string,
  groupToken: string,
  projectId: number,
  projectName: string,
  environmentTiers?: EnvironmentTier[],
): Promise<DataProviderDeploymentEvent[]> => {
  if (isSendStagingEventsEnabled() && environmentTiers) {
    return newGetDeploymentsForEnvironments(baseUrl, groupToken, projectId, projectName, environmentTiers);
  }

  const environments = await getProjectEnvironments(projectId, baseUrl, groupToken);
  const getDeploymentsPromises = environments.reduce<Promise<Deployment[]>[]>(
    (deploymentsPromises, currentEnvironment) => {
      if (currentEnvironment.tier === EnvironmentTier.PRODUCTION) {
        deploymentsPromises.push(
          getRecentDeployments(baseUrl, groupToken, projectId, getDateInThePast(), currentEnvironment.name),
        );
      }

      return deploymentsPromises;
    },
    [],
  );

  const deployments = (await Promise.all(getDeploymentsPromises)).flat();
  const deploymentEvents = deployments
    .map((deployment) =>
      gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(deployment, projectName, EnvironmentTier.PRODUCTION),
    )
    .filter((event) => event !== null);
  const unprocessedEvents = deployments.length - deploymentEvents.length;
  if (unprocessedEvents > 0) {
    console.log(`unprocessed deployment events count: ${unprocessedEvents}`);
  }
  return deploymentEvents;
};
