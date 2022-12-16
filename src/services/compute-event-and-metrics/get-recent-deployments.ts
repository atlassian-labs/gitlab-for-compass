import { DataProviderDeploymentEvent } from '@atlassian/forge-graphql';

import { Deployment, Environment, EnvironmentTier } from '../../types';
import { getRecentDeployments, gitlabAPiDeploymentToCompassDataProviderDeploymentEvent } from '../deployment';
import { getProjectEnvironments } from '../environment';
import { getDateInThePast } from '../../utils/time-utils';

export const getDeploymentsForProductionEnvironments = async (
  groupToken: string,
  projectId: number,
  projectName: string,
  projectEnvironments?: Environment[],
): Promise<DataProviderDeploymentEvent[]> => {
  const environments = projectEnvironments || (await getProjectEnvironments(projectId, groupToken));
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
    gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(deployment, projectName),
  );
};
