import { flow } from 'lodash/fp';
import {
  CommitFileDiff,
  CompassYaml,
  ComponentChanges,
  ComponentSyncPayload,
  ComponentUnlinkPayload,
  ModifiedFilePayload,
  PushEvent,
} from '../../types';
import { getCommitDiff, getFileContent } from '../../client/gitlab';
import { groupDiffsByChangeType } from '../../utils/push-event-utils';
import {
  detectMovedFilesAndUpdateComponentChanges,
  handleModifiedFilesAndUpdateComponentChanges,
} from './config-file-changes-transformer';

const getRemovedFiles = async (
  baseUrl: string,
  token: string,
  compassYmlFilesDiffs: CommitFileDiff[],
  event: PushEvent,
): Promise<ComponentUnlinkPayload[]> => {
  const settledPromises = await Promise.allSettled(
    compassYmlFilesDiffs.map((diff: CommitFileDiff) => {
      return getFileContent(baseUrl, token, event.project.id, diff.old_path, event.before)
        .then((componentYaml) => ({
          componentYaml,
          filePath: `/${diff.new_path}`,
          deduplicationId: event.project.id.toString(),
        }))
        .catch((err) => {
          console.error(`Unable to get removed file. Error: ${err}`);
          throw err;
        });
    }),
  );
  return settledPromises
    .filter((result) => result.status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<ComponentUnlinkPayload>).value);
};

const getAddedFiles = async (
  baseUrl: string,
  token: string,
  compassYmlFilesDiffs: CommitFileDiff[],
  event: PushEvent,
): Promise<ComponentSyncPayload[]> => {
  const settledPromises = await Promise.allSettled(
    compassYmlFilesDiffs.map((diff: CommitFileDiff) =>
      getFileContent(baseUrl, token, event.project.id, diff.new_path, event.after)
        .then((componentYaml) => ({
          componentYaml,
          absoluteFilePath: diff.new_path,
          filePath: `/${diff.new_path}`,
        }))
        .catch((err) => {
          console.error(`Unable to get added file. Error: ${err}`);
          throw err;
        }),
    ),
  );
  return settledPromises
    .filter((result) => result.status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<ComponentSyncPayload>).value);
};

const getModifiedFiles = async (
  baseUrl: string,
  token: string,
  compassYmlFilesDiffs: CommitFileDiff[],
  event: PushEvent,
): Promise<ModifiedFilePayload[]> => {
  const settledPromises = await Promise.allSettled(
    compassYmlFilesDiffs.map(async (diff) => {
      const oldFilePromise = getFileContent(baseUrl, token, event.project.id, diff.old_path, event.before);
      const newFilePromise = getFileContent(baseUrl, token, event.project.id, diff.new_path, event.after);

      const [oldFileSettled, newFileSettled] = await Promise.allSettled([oldFilePromise, newFilePromise]);
      let oldFileContents: CompassYaml;
      let newFileContents: CompassYaml;

      if (oldFileSettled.status === 'fulfilled') {
        oldFileContents = oldFileSettled.value;
      } else {
        console.error(`Could not retrieve oldFile for ${oldFileSettled.reason}`);
        oldFileContents = {};
      }
      if (newFileSettled.status === 'fulfilled') {
        newFileContents = newFileSettled.value;
      } else {
        console.error(`Could not retrieve oldFile for ${newFileSettled.reason}`);
        newFileContents = {};
      }

      const componentSyncPayload: ComponentSyncPayload = {
        componentYaml: newFileContents,
        absoluteFilePath: diff.new_path,
        filePath: `/${diff.new_path}`,
        previousFilePath: `/${diff.old_path}`,
      };

      return {
        oldFile: {
          componentYaml: oldFileContents,
          filePath: `/${diff.old_path}`,
          deduplicationId: event.project.id.toString(),
        },
        newFile: componentSyncPayload,
      };
    }),
  );
  return settledPromises
    .filter((result) => result.status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<ModifiedFilePayload>).value);
};

export const findConfigAsCodeFileChanges = async (
  event: PushEvent,
  baseUrl: string,
  token: string,
): Promise<ComponentChanges> => {
  let filesDiffs: CommitFileDiff[] = [];
  try {
    filesDiffs = await getCommitDiff(baseUrl, token, event.project.id, event.checkout_sha);
  } catch (e) {
    console.error({
      message: 'Error with commits diff request',
      error: e,
    });
    throw e;
  }

  const { added, removed, modified } = groupDiffsByChangeType(filesDiffs);

  if (added.length === 0 && removed.length === 0 && modified.length === 0) {
    console.log('No file changes in push event. Returning.');
    return {
      componentsToCreate: [],
      componentsToUpdate: [],
      componentsToUnlink: [],
    };
  }
  console.log(
    `Found ${added.length} added diffs, ${removed.length} removed diffs, and ${modified.length} modified diffs in push event. Now processing what files might have been moved or renamed.`,
  );

  const [createPayload, unlinkPayload, modifiedFiles] = await Promise.all([
    getAddedFiles(baseUrl, token, added, event),
    getRemovedFiles(baseUrl, token, removed, event),
    getModifiedFiles(baseUrl, token, modified, event),
  ]);

  const componentChanges: ComponentChanges = {
    componentsToCreate: createPayload,
    componentsToUpdate: [],
    componentsToUnlink: unlinkPayload,
  };

  const modifiedComponentChanges = flow([
    detectMovedFilesAndUpdateComponentChanges,
    handleModifiedFilesAndUpdateComponentChanges(modifiedFiles),
  ])(componentChanges);

  return modifiedComponentChanges;
};
