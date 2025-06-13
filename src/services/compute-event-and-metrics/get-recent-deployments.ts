import { DataProviderDeploymentEvent } from '@atlassian/forge-graphql-types';

import { Deployment, EnvironmentTier } from '../../types';
import { getRecentDeployments, gitlabAPiDeploymentToCompassDataProviderDeploymentEvent } from '../deployment';
import { getProjectEnvironments } from '../environment';
import { getDateInThePast } from '../../utils/time-utils';
import { getFormattedErrors, hasRejections } from '../../utils/promise-allsettled-helpers';

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
  const settledResults = await Promise.allSettled(deploymentEvents);

  if (hasRejections(settledResults)) {
    throw new Error(`Error getting deployment: ${getFormattedErrors(settledResults)}`);
  }

  const result = settledResults.map(
    (settledResult) => (settledResult as PromiseFulfilledResult<DataProviderDeploymentEvent[]>).value,
  );

  return result.flat();
};

export const getDeploymentsForEnvironmentTiers = async (
  groupToken: string,
  projectId: number,
  projectName: string,
  environmentTiers?: EnvironmentTier[],
): Promise<DataProviderDeploymentEvent[]> => {
  if (environmentTiers) {
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

  const deploymentsResult = await Promise.allSettled(getDeploymentsPromises);

  if (hasRejections(deploymentsResult)) {
    throw new Error(`Error getting deployments: ${getFormattedErrors(deploymentsResult)}`);
  }

  const deploymentsValues = deploymentsResult.map(
    (deploymentResult) => (deploymentResult as PromiseFulfilledResult<Deployment[]>).value,
  );

  const deployments = deploymentsValues.flat();

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
