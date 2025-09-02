import { PipelineEvent } from '../../../types';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { sendEventToCompass } from '../../../services/send-compass-events';
import { webhookPipelineEventToCompassBuildEvent } from '../../../services/builds';

export const isEventForTrackingBranch = (event: PipelineEvent, trackingBranch: string): boolean => {
  return event.object_attributes.ref === trackingBranch;
};

export const handlePipelineEvent = async (event: PipelineEvent, groupToken: string, cloudId: string): Promise<void> => {
  const {
    project: { id: projectId, default_branch: defaultBranch },
    object_attributes: { ref },
  } = event;
  try {
    const trackingBranch = await getTrackingBranchName(groupToken, projectId, defaultBranch);

    if (!isEventForTrackingBranch(event, trackingBranch)) {
      // eslint-disable-next-line no-console
      console.log({
        message: 'Received push event for non-tracking branch. Ignoring event',
      });
      return;
    }

    await sendEventToCompass(webhookPipelineEventToCompassBuildEvent(event, cloudId));
    // eslint-disable-next-line no-console
    console.log('Build event sent for pipeline.');
  } catch (e) {
    console.error('Error while sending pipeline event to Compass', e);
  }
};
