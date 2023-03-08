import {
  findConfigAsCodeFileChanges,
  syncComponent,
  unlinkComponent,
} from '../../../services/sync-component-with-file';
import { isEventForTrackingBranch } from '../../../utils/push-event-utils';
import { PushEvent } from '../../../types';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';

export const handlePushEvent = async (event: PushEvent, groupToken: string): Promise<void> => {
  const trackingBranch = await getTrackingBranchName(groupToken, event.project.id, event.project.default_branch);

  if (!isEventForTrackingBranch(event, trackingBranch)) {
    console.log({
      message: 'Received push event for non-tracking branch',
      ref: event.ref,
      trackingBranch,
    });
    return;
  }

  console.log('Received push event for tracking branch -', trackingBranch);

  const { componentsToSync, componentsToUnlink } = await findConfigAsCodeFileChanges(event, groupToken);

  if (componentsToSync.length === 0 && componentsToUnlink.length === 0) {
    console.log('No config as code file updates in push event');
    return;
  }

  console.log({
    message: 'Performing config as code file updates',
    updatedFiles: componentsToSync.length,
    removedFiles: componentsToUnlink.length,
  });

  const updates = componentsToSync.map((c) =>
    syncComponent(groupToken, c.componentYaml, c.absoluteFilePath, event, trackingBranch),
  );
  const removals = componentsToUnlink.map((componentYaml) =>
    unlinkComponent(componentYaml.id, event.project.id.toString()),
  );
  await Promise.all([...updates, ...removals]);
};
