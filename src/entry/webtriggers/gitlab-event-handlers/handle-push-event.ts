import {
  CompassResyncRepoFileInput,
  CompassResyncRepoFilesInput,
  ConfigFileActions,
} from '@atlassian/forge-graphql-types';
import { getCommitDiff } from '../../../client/gitlab';
import { findConfigAsCodeFileChanges, syncComponent } from '../../../services/sync-component-with-file';
import { isEventForTrackingBranch } from '../../../utils/push-event-utils';
import { CommitFileDiff, ComponentSyncDetails, PushEvent } from '../../../types';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { unlinkComponentFromFile, resyncRepoFiles } from '../../../client/compass';
import { EXTERNAL_SOURCE } from '../../../constants';
import { hasRejections, getFormattedErrors } from '../../../utils/promise-allsettled-helpers';
import { sendPushEventToCompass } from '../../../services/send-compass-events';
import { isCompassPushEventEnabled, isPackageDependenciesM3Enabled } from '../../../services/feature-flags';

export const handlePushEvent = async (event: PushEvent, groupToken: string, cloudId: string): Promise<void> => {
  try {
    const trackingBranch = await getTrackingBranchName(groupToken, event.project.id, event.project.default_branch);

    if (!isEventForTrackingBranch(event, trackingBranch)) {
      console.log('Received push event for non-tracking branch. Ignoring event');
      return;
    }

    console.log('Received push event for tracking branch. Processing event');

    let commitDiffs: CommitFileDiff[] = [];
    try {
      commitDiffs = await getCommitDiff(groupToken, event.project.id, event.checkout_sha);
    } catch (e) {
      console.error({
        message: 'Error with commits diff request',
        error: e,
      });
      throw e;
    }

    const { componentsToCreate, componentsToUpdate, componentsToUnlink } = await findConfigAsCodeFileChanges(
      event,
      groupToken,
      commitDiffs,
    );

    if (componentsToCreate.length === 0 && componentsToUpdate.length === 0 && componentsToUnlink.length === 0) {
      console.log('No config as code file updates in push event');
    } else {
      console.log('Performing config as code file updates', {
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
          deduplicationId: event.project.id.toString(),
        }),
      );
      const updates = componentsToUpdate.map((componentPayload) =>
        syncComponent(componentPayload, componentSyncDetails, {
          configFileAction: ConfigFileActions.UPDATE,
          newPath: componentPayload.filePath,
          oldPath: componentPayload.previousFilePath,
          deduplicationId: event.project.id.toString(),
        }),
      );

      const creationAndUpdateResults = await Promise.allSettled([...creates, ...updates]);

      if (hasRejections(creationAndUpdateResults)) {
        throw new Error(`Error creating or updating components: ${getFormattedErrors(creationAndUpdateResults)}`);
      }

      const removals = componentsToUnlink.map((componentToUnlink) =>
        unlinkComponentFromFile({
          cloudId,
          filePath: componentToUnlink.filePath,
          componentId: componentToUnlink.componentYaml.id,
          deduplicationId: componentToUnlink.deduplicationId,
          additionalExternalAliasesToRemove: componentToUnlink.shouldRemoveExternalAlias
            ? [{ externalId: event.project.id.toString(), externalSource: EXTERNAL_SOURCE }]
            : [],
        }),
      );

      const removalResults = await Promise.allSettled(removals);

      if (hasRejections(removalResults)) {
        throw new Error(`Error removing components: ${getFormattedErrors(removalResults)}`);
      }
    }

    if (isCompassPushEventEnabled()) {
      await sendPushEventToCompass(event, cloudId);
    }

    if (isPackageDependenciesM3Enabled()) {
      if (commitDiffs.length === 0) {
        console.log('No changes in commit, skipping resync of repo files');
      } else {
        const changedFiles = commitDiffs.map((diff) => {
          // deleted_file -> DELETED, new_file -> CREATED, renamed_file -> UPDATED
          let action: string;
          if (diff.deleted_file) {
            action = 'DELETED';
          } else if (diff.new_file) {
            action = 'CREATED';
          } else {
            action = 'UPDATED';
          }

          const currentFilePath = {
            fullFilePath: `${event.project.web_url}/blob/${event.project.default_branch}/${diff.new_path}`,
            localFilePath: diff.new_path,
          };

          const oldFilePath = {
            fullFilePath: `${event.project.web_url}/blob/${event.project.default_branch}/${diff.old_path}`,
            localFilePath: diff.old_path,
          };

          return {
            currentFilePath,
            // Don't set on an UPDATED action unless it was renamed
            oldFilePath: action === 'UPDATED' && !diff.renamed_file ? undefined : oldFilePath,
            action,
          } as CompassResyncRepoFileInput;
        });

        const resyncRepoFilesInput: CompassResyncRepoFilesInput = {
          cloudId,
          repoId: event.project.id.toString(),
          baseRepoUrl: event.project.web_url,
          changedFiles,
        };

        await resyncRepoFiles(resyncRepoFilesInput);
      }
    }
  } catch (e) {
    console.error('Error while handling push event', e);
  }
};
