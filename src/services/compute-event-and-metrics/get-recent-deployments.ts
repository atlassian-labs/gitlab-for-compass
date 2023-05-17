import { DataProviderDeploymentEvent } from '@atlassian/forge-graphql';

import { Deployment, EnvironmentTier } from '../../types';
import { getRecentDeployments, gitlabAPiDeploymentToCompassDataProviderDeploymentEvent } from '../deployment';
import { getProjectEnvironments } from '../environment';
import { getDateInThePast } from '../../utils/time-utils';
import { isSendStagingEventsEnabled } from '../feature-flags';

const newGetDeploymentsForEnvironments = async (
  groupToken: string,
  projectId: number,
  projectName: string,
  environmentTiers: EnvironmentTier[],
): Promise<DataProviderDeploymentEvent[]> => {
  // get all project environments
  const projectEnvironments = await getProjectEnvironments(projectId, groupToken);

  // get deploymentEvents for each projectEnvironment that matches the requested environmentTiers
  const deploymentEvents = projectEnvironments
    .filter((projectEnv) => environmentTiers.includes(projectEnv.tier))
    .map(async (projectEnv) => {
      const recentDeployments = await getRecentDeployments(groupToken, projectId, getDateInThePast(), projectEnv.name);
      return recentDeployments
        .map((deployment) =>
          gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(deployment, projectName, projectEnv.tier),
        )
        .filter((event) => event !== null);
    });

  // combine results from multiple projectEnvironments into single array
  return Promise.all(deploymentEvents).then((results) => results.flat());
};

export const getDeploymentsForEnvironmentTiers = async (
  groupToken: string,
  projectId: number,
  projectName: string,
  environmentTiers?: EnvironmentTier[],
): Promise<DataProviderDeploymentEvent[]> => {
  if (isSendStagingEventsEnabled() && environmentTiers) {
    return newGetDeploymentsForEnvironments(groupToken, projectId, projectName, environmentTiers);
  }

  const environments = await getProjectEnvironments(projectId, groupToken);
  const getDeploymentsPromises = environments.reduce<Promise<Deployment[]>[]>(
    (deploymentsPromises, currentEnvironment) => {
      if (currentEnvironment.tier === EnvironmentTier.PRODUCTION) {
        deploymentsPromises.push(
          getRecentDeployments(groupToken, projectId, getDateInThePast(), currentEnvironment.name),
        );
      }

      return deploymentsPromises;
    },
    [],
  );

  const deployments = (await Promise.all(getDeploymentsPromises)).flat();
  return deployments
    .map((deployment) =>
      gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(deployment, projectName, EnvironmentTier.PRODUCTION),
    )
    .filter((event) => event !== null);
};
