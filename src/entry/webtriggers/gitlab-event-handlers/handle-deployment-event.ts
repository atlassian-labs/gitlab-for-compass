import { DeploymentEvent, EnvironmentTier } from '../../../types';
import { getDeployment } from '../../../services/deployment';
import { getEnvironmentTier, getProjectEnvironments } from '../../../services/environment';
import { sendEventToCompass } from '../../../services/send-compass-events';
import { isSendStagingEventsEnabled } from '../../../services/feature-flags';

export const handleDeploymentEvent = async (
  event: DeploymentEvent,
  baseUrl: string,
  groupToken: string,
  cloudId: string,
): Promise<void> => {
  const {
    environment,
    project: { id: projectId },
  } = event;
  const environments = await getProjectEnvironments(projectId, baseUrl, groupToken);

  const environmentTier = await getEnvironmentTier(environments, environment);

  if (
    environmentTier === EnvironmentTier.PRODUCTION ||
    (isSendStagingEventsEnabled() && environmentTier === EnvironmentTier.STAGING)
  ) {
    const deployment = await getDeployment(event, baseUrl, groupToken, environmentTier, cloudId);
    await sendEventToCompass(deployment);
  }
};
