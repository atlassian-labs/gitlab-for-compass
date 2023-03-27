import { CommitFileDiff, CompassYaml, ComponentChanges, ComponentSyncPayload, PushEvent } from '../../types';
import { getCommitDiff, getFileContent } from '../../client/gitlab';
import { groupDiffsByChangeType } from '../../utils/push-event-utils';

const getRemovedFiles = async (
  token: string,
  compassYmlFilesDiffs: CommitFileDiff[],
  event: PushEvent,
): Promise<CompassYaml[]> => {
  return Promise.all(
    compassYmlFilesDiffs.map((diff: CommitFileDiff) => {
      return getFileContent(token, event.project.id, diff.old_path, event.before);
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
      })),
    ),
  );
};

const getModifiedFiles = async (
  token: string,
  compassYmlFilesDiffs: CommitFileDiff[],
  event: PushEvent,
): Promise<{ componentsToSync: ComponentSyncPayload[]; componentsToUnlink: CompassYaml[] }> => {
  const changes = await Promise.all(
    compassYmlFilesDiffs.map(async (diff) => {
      const oldFilePromise = getFileContent(token, event.project.id, diff.old_path, event.before);
      const newFilePromise = getFileContent(token, event.project.id, diff.new_path, event.after);

      const [oldFile, newFile] = await Promise.all([oldFilePromise, newFilePromise]);

      const componentSyncPayload: ComponentSyncPayload = {
        componentYaml: newFile,
        absoluteFilePath: diff.new_path,
      };

      return {
        oldFile,
        newFile: componentSyncPayload,
      };
    }),
  );

  return changes.reduce<{ componentsToSync: ComponentSyncPayload[]; componentsToUnlink: CompassYaml[] }>(
    (result, { oldFile, newFile }) => {
      if (
        oldFile.id !== newFile.componentYaml.id ||
        oldFile.immutableLocalKey !== newFile.componentYaml.immutableLocalKey
      ) {
        result.componentsToUnlink.push(oldFile);
      }
      result.componentsToSync.push(newFile);

      return result;
    },
    { componentsToSync: [], componentsToUnlink: [] },
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
      componentsToSync: [],
      componentsToUnlink: [],
    };
  }

  const [removedComponents, addedComponents, modifiedComponents] = await Promise.all([
    getRemovedFiles(token, removed, event),
    getAddedFiles(token, added, event),
    getModifiedFiles(token, modified, event),
  ]);

  const componentsToSync = [...addedComponents, ...modifiedComponents.componentsToSync];
  const componentsToUnlink = [...removedComponents, ...modifiedComponents.componentsToUnlink];

  console.log(
    'Identifiers of files to sync',
    componentsToSync.map((c) => c.componentYaml.id || c.componentYaml.immutableLocalKey),
  );
  console.log(
    'Identifiers of files to remove',
    componentsToUnlink.map((c) => c.id || c.immutableLocalKey),
  );

  return {
    componentsToSync,
    componentsToUnlink,
  };
};
