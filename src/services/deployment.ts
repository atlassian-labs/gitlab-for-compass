import {
  CompassCreateEventInput,
  CompassDeploymentEventEnvironmentCategory,
  CompassDeploymentEventState,
  DataProviderDeploymentEvent,
} from '@atlassian/forge-graphql';

import { getProjectDeploymentById, getProjectRecentDeployments } from '../client/gitlab';
import { Deployment, DeploymentEvent, EnvironmentTier } from '../types';
import { fetchPaginatedData } from '../utils/fetchPaginatedData';
import { getProjectEnvironments } from './environment';
import { isSendStagingEventsEnabled } from './feature-flags';

export const gitLabStateToCompassFormat = (state: string): CompassDeploymentEventState => {
  switch (state) {
    case 'CREATED':
    case 'BLOCKED':
      return CompassDeploymentEventState.Pending;
    case 'SUCCESS':
      return CompassDeploymentEventState.Successful;
    case 'RUNNING':
      return CompassDeploymentEventState.InProgress;
    case 'FAILED':
      return CompassDeploymentEventState.Failed;
    case 'CANCELED':
      return CompassDeploymentEventState.Cancelled;
    default:
      return CompassDeploymentEventState.Unknown;
  }
};

export const mapEnvTierToCompassDeploymentEnv = (env: EnvironmentTier): CompassDeploymentEventEnvironmentCategory => {
  switch (env) {
    case EnvironmentTier.PRODUCTION:
      return CompassDeploymentEventEnvironmentCategory.Production;
    case EnvironmentTier.STAGING:
      return CompassDeploymentEventEnvironmentCategory.Staging;
    case EnvironmentTier.TESTING:
      return CompassDeploymentEventEnvironmentCategory.Testing;
    case EnvironmentTier.DEVELOPMENT:
      return CompassDeploymentEventEnvironmentCategory.Development;
    case EnvironmentTier.OTHER:
    default:
      return CompassDeploymentEventEnvironmentCategory.Unmapped;
  }
};

const isCompletedDeployment = (state: CompassDeploymentEventState) => {
  return state === CompassDeploymentEventState.Failed || state === CompassDeploymentEventState.Successful;
};

export const DESCRIPTION_TRUNCATION_LENGTH = 255;

export const truncateProjectNameString = (beforeString: string, projectName: string, afterString: string) => {
  // Spaces need to be included in `beforeString` and `afterString` so they can be considered in string length
  let truncatedProjectName = projectName;
  if (beforeString.length + projectName.length + afterString.length > DESCRIPTION_TRUNCATION_LENGTH) {
    const projectNameLen = DESCRIPTION_TRUNCATION_LENGTH - beforeString.length - afterString.length;
    truncatedProjectName = projectName.slice(0, projectNameLen);
  }
  return `${beforeString}${truncatedProjectName}${afterString}`;
};

export const gitlabApiDeploymentToCompassDeploymentEvent = (
  deployment: Deployment,
  projectId: number,
  projectName: string,
  environmentTier: EnvironmentTier,
  cloudId: string,
): CompassCreateEventInput => {
  const deploymentState = gitLabStateToCompassFormat(deployment.deployable.status.toUpperCase());
  return {
    cloudId,
    event: {
      deployment: {
        description: `${projectName} deployment`,
        externalEventSourceId: projectId.toString(),
        updateSequenceNumber: new Date(deployment.updated_at).getTime(),
        displayName: `${projectName} deployment ${deployment.id}`,
        url: deployment.deployable.pipeline.web_url,
        lastUpdated: new Date(deployment.updated_at).toISOString(),
        deploymentProperties: {
          startedAt: new Date(deployment.created_at).toISOString(),
          completedAt: isCompletedDeployment(deploymentState) ? new Date(deployment.updated_at).toISOString() : null,
          environment: {
            category: mapEnvTierToCompassDeploymentEnv(environmentTier),
            displayName: deployment.environment.name,
            environmentId: deployment.environment.id.toString(),
          },
          pipeline: {
            pipelineId: deployment.deployable.pipeline.id.toString(),
            url: deployment.deployable.pipeline.web_url,
            displayName: `${projectName} pipeline`,
          },
          state: deploymentState,
          sequenceNumber: deployment.id,
        },
      },
    },
  };
};

export const getDeployment = async (
  event: DeploymentEvent,
  groupToken: string,
  environmentTier: EnvironmentTier,
  cloudId: string,
): Promise<CompassCreateEventInput> => {
  const deployment = await getProjectDeploymentById(event.project.id, event.deployment_id, groupToken);

  return gitlabApiDeploymentToCompassDeploymentEvent(
    deployment as Deployment,
    event.project.id,
    event.project.name,
    environmentTier,
    cloudId,
  );
};

export const getRecentDeployments = async (
  groupToken: string,
  projectId: number,
  dateAfter: string,
  environmentName: string,
) => {
  try {
    return fetchPaginatedData(getProjectRecentDeployments, { groupToken, projectId, dateAfter, environmentName });
  } catch (err) {
    const ERROR_MESSAGE = 'Error while fetching recent deployments from Gitlab!';

    console.error(ERROR_MESSAGE, err);
    return [];
  }
};

export const getDeploymentAfter28Days = async (
  groupToken: string,
  projectId: number,
  dateAfter: string,
  dateBefore: string,
): Promise<Deployment[]> => {
  const PAGE = 1;
  const PER_PAGE = 1;
  const environments = await getProjectEnvironments(projectId, groupToken);
  const getDeploymentsPromises = environments.reduce<Promise<{ data: Deployment[]; headers: Headers }>[]>(
    (deploymentsPromises, currentEnvironment) => {
      if (
        currentEnvironment.tier === EnvironmentTier.PRODUCTION ||
        (isSendStagingEventsEnabled() && currentEnvironment.tier === EnvironmentTier.STAGING)
      ) {
        deploymentsPromises.push(
          getProjectRecentDeployments(PAGE, PER_PAGE, {
            groupToken,
            projectId,
            environmentName: currentEnvironment.name,
            dateAfter,
            dateBefore,
          }),
        );
      }

      return deploymentsPromises;
    },
    [],
  );

  const promisesResponse = await Promise.all(getDeploymentsPromises);

  return promisesResponse ? promisesResponse.map((deployment) => deployment.data).flat() : [];
};

export const gitlabAPiDeploymentToCompassDataProviderDeploymentEvent = (
  deployment: Deployment,
  projectName: string,
  environmentTier: EnvironmentTier,
): DataProviderDeploymentEvent | null => {
  try {
    const { environment, deployable } = deployment;

    const deploymentEvent = {
      environment: {
        category: mapEnvTierToCompassDeploymentEnv(environmentTier),
        displayName: environment.name,
        environmentId: environment.id.toString(),
      },
      pipeline: {
        displayName: `${projectName} pipeline`,
        pipelineId: deployable.pipeline.id.toString(),
        url: deployable.pipeline.web_url,
      },
      sequenceNumber: deployment.id,
      state: gitLabStateToCompassFormat(deployable.status.toUpperCase()),
      description: `${projectName} deployment`,
      displayName: `${projectName} deployment ${deployment.id}`,
      lastUpdated: new Date(deployment.updated_at).toISOString(),
      updateSequenceNumber: new Date(deployment.updated_at).getTime(),
      url: deployable.pipeline.web_url,
    };
    return deploymentEvent;
  } catch (err) {
    console.error(`There was an error mapping the gitlab API deployment: ${err.message}`);
    return null;
  }
};
