import { flow } from 'lodash/fp';
import {
  CommitFileDiff,
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
  token: string,
  compassYmlFilesDiffs: CommitFileDiff[],
  event: PushEvent,
): Promise<ComponentUnlinkPayload[]> => {
  return Promise.all(
    compassYmlFilesDiffs.map((diff: CommitFileDiff) => {
      return getFileContent(token, event.project.id, diff.old_path, event.before).then((componentYaml) => ({
        componentYaml,
        filePath: `/${diff.new_path}`,
      }));
    }),
  );
};

const getAddedFiles = async (
  token: string,
  compassYmlFilesDiffs: CommitFileDiff[],
  event: PushEvent,
): Promise<ComponentSyncPayload[]> => {
  return Promise.all(
    compassYmlFilesDiffs.map((diff: CommitFileDiff) =>
      getFileContent(token, event.project.id, diff.new_path, event.after).then((componentYaml) => ({
        componentYaml,
        absoluteFilePath: diff.new_path,
        filePath: `/${diff.new_path}`,
      })),
    ),
  );
};

const getModifiedFiles = async (
  token: string,
  compassYmlFilesDiffs: CommitFileDiff[],
  event: PushEvent,
): Promise<ModifiedFilePayload[]> => {
  return Promise.all(
    compassYmlFilesDiffs.map(async (diff) => {
      const oldFilePromise = getFileContent(token, event.project.id, diff.old_path, event.before);
      const newFilePromise = getFileContent(token, event.project.id, diff.new_path, event.after);

      const [oldFile, newFile] = await Promise.all([oldFilePromise, newFilePromise]);

      const componentSyncPayload: ComponentSyncPayload = {
        componentYaml: newFile,
        absoluteFilePath: diff.new_path,
        filePath: `/${diff.new_path}`,
        previousFilePath: `/${diff.old_path}`,
      };

      return {
        oldFile: { componentYaml: oldFile },
        newFile: componentSyncPayload,
      };
    }),
  );
};

export const findConfigAsCodeFileChanges = async (event: PushEvent, token: string): Promise<ComponentChanges> => {
  let filesDiffs: CommitFileDiff[] = [];
  try {
    filesDiffs = await getCommitDiff(token, event.project.id, event.checkout_sha);
  } catch (e) {
    console.error({
      message: 'Error with commits diff request',
      error: e,
    });
    throw e;
  }

  const { added, removed, modified } = groupDiffsByChangeType(filesDiffs);

  if (added.length === 0 && removed.length === 0 && modified.length === 0) {
    return {
      componentsToCreate: [],
      componentsToUpdate: [],
      componentsToUnlink: [],
    };
  }

  const [createPayload, unlinkPayload, modifiedFiles] = await Promise.all([
    getAddedFiles(token, added, event),
    getRemovedFiles(token, removed, event),
    getModifiedFiles(token, modified, event),
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
