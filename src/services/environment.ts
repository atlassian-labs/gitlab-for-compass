import { getEnvironments } from '../client/gitlab';
import { Environment, EnvironmentTier } from '../types';

export const getProjectEnvironments = (projectId: number, groupToken: string): Promise<Environment[]> => {
  return getEnvironments(projectId, groupToken);
};

export const getEnvironmentTier = async (
  environments: Environment[],
  environmentName: string,
): Promise<EnvironmentTier> => {
  const foundEnvironment = environments.find((environment) => environment.name === environmentName);

  if (!foundEnvironment) {
    throw new Error("Environment not found");
  }

  return foundEnvironment.tier;
};
