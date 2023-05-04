import { ConfigFileActions } from '@atlassian/forge-graphql';
import { findConfigAsCodeFileChanges, syncComponent } from '../../../services/sync-component-with-file';
import { isEventForTrackingBranch } from '../../../utils/push-event-utils';
import { ComponentSyncDetails, PushEvent } from '../../../types';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { unlinkComponentFromFile } from '../../../client/compass';
import { EXTERNAL_SOURCE } from '../../../constants';

export const handlePushEvent = async (event: PushEvent, groupToken: string, cloudId: string): Promise<void> => {
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

  const { componentsToCreate, componentsToUpdate, componentsToUnlink } = await findConfigAsCodeFileChanges(
    event,
    groupToken,
  );

  if (componentsToCreate.length === 0 && componentsToUpdate.length === 0 && componentsToUnlink.length === 0) {
    console.log('No config as code file updates in push event');
    return;
  }

  console.log({
    message: 'Performing config as code file updates',
    createdFiles: componentsToCreate.length,
    updatedFiles: componentsToUpdate.length,
    removedFiles: componentsToUnlink.length,
  });

  const componentSyncDetails: ComponentSyncDetails = {
    token: groupToken,
    event,
    trackingBranch,
    cloudId,
  };

  const creates = componentsToCreate.map((componentPayload) =>
    syncComponent(componentPayload, componentSyncDetails, {
      configFileAction: ConfigFileActions.CREATE,
      newPath: componentPayload.filePath,
    }),
  );
  const updates = componentsToUpdate.map((componentPayload) =>
    syncComponent(componentPayload, componentSyncDetails, {
      configFileAction: ConfigFileActions.UPDATE,
      newPath: componentPayload.filePath,
      oldPath: componentPayload.previousFilePath,
    }),
  );

  const removals = componentsToUnlink.map((componentToUnlink) =>
    unlinkComponentFromFile({
      cloudId,
      filePath: componentToUnlink.filePath,
      componentId: componentToUnlink.componentYaml.id,
      immutableLocalKeyPrefix: componentToUnlink.immutableLocalKeyPrefix,
      additionalExternalAliasesToRemove: [{ externalId: event.project.id.toString(), externalSource: EXTERNAL_SOURCE }],
    }),
  );
  await Promise.all([...creates, ...updates, ...removals]);
};
