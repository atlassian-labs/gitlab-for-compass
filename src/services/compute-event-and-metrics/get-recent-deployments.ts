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

  const deploymentEventsByEnvironmentTier = environmentTiers.map(async (environmentTier) => {
    // get a list of deployments for each project environment belonging to the environmentTier
    const getDeploymentsPromises = projectEnvironments.reduce<Promise<Deployment[]>[]>(
      (deploymentsPromises, projectEnvironment) => {
        if (projectEnvironment.tier === environmentTier) {
          deploymentsPromises.push(
            getRecentDeployments(groupToken, projectId, getDateInThePast(), projectEnvironment.name),
          );
        }

        return deploymentsPromises;
      },
      [],
    );

    // flatten all deployments to a single array
    const deployments = (await Promise.all(getDeploymentsPromises)).flat();

    return deployments.map((deployment) =>
      gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(deployment, projectName, environmentTier),
    );
  });

  // combine results for multiple environmentTiers into single array
  return Promise.all(deploymentEventsByEnvironmentTier).then((results) => results.flat());
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

  return deployments.map((deployment) =>
    gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(deployment, projectName, EnvironmentTier.PRODUCTION),
  );
};
