import { DeploymentEvent } from '../../../types';
import { getDeployment } from '../../../services/deployment';
import { getEnvironmentTier, getProjectEnvironments } from '../../../services/environment';
import { sendEventToCompass } from '../../../services/send-compass-events';

export const handleDeploymentEvent = async (
  event: DeploymentEvent,
  groupToken: string,
  cloudId: string,
): Promise<void> => {
  const {
    environment,
    project: { id: projectId },
  } = event;
  try {
    const environments = await getProjectEnvironments(projectId, groupToken);

    const environmentTier = await getEnvironmentTier(environments, environment);

    const deployment = await getDeployment(event, groupToken, environmentTier, cloudId);
    await sendEventToCompass(deployment);
  } catch (e) {
    console.error('Error while sending deployment event to Compass', e);
  }
};
