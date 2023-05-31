import { ComponentChanges, ComponentSyncPayload, ComponentUnlinkPayload, ModifiedFilePayload } from '../../types';

const isFileIdentifierChanged = (oldFile: ComponentUnlinkPayload, newFile: ComponentSyncPayload): boolean => {
  const { id: oldId, name: oldName } = oldFile.componentYaml;
  const { id: newId, name: newName } = newFile.componentYaml;

  const isIdChanged = oldId !== newId;
  const isNameFileIdentifier = oldId === undefined && newId === undefined;
  const isIdAdded = oldId === undefined && newId !== undefined;

  const isFileMovedAsGitlabRename = newFile.filePath !== newFile.previousFilePath;
  const isNameChangedWithFileMove = isNameFileIdentifier && isFileMovedAsGitlabRename && oldName !== newName;
  const isIdFileIdentifierChanged = isIdChanged && !isIdAdded;

  return isNameChangedWithFileMove || isIdFileIdentifierChanged;
};

export const detectMovedFilesAndUpdateComponentChanges = (changes: ComponentChanges): ComponentChanges => {
  let creates = [...changes.componentsToCreate];
  const updates = [...changes.componentsToUpdate];
  let unlinks = [...changes.componentsToUnlink];

  creates.forEach(({ componentYaml, absoluteFilePath, filePath }) => {
    const { id: createId, name: createName } = componentYaml;

    let isMovedById = false;
    let isMovedByName = false;
    let isMovedByIdentifierTransition = false;

    const movedFile = unlinks.find(({ componentYaml: { id: removeId, name: removeName } }) => {
      const isCreateId = Boolean(createId);
      const isCreateName = Boolean(createName);
      const isRemoveId = Boolean(removeId);
      const isRemoveName = Boolean(removeName);

      const isIdFileIdentifier = isCreateId && isRemoveId;
      const isNameFileIdentifier = !isCreateId && !isRemoveId && isCreateName && isRemoveName;
      const isTransitionFromNameToId = createName === removeName && !isRemoveId && isCreateId;

      isMovedById = isIdFileIdentifier && createId === removeId;
      isMovedByName = isNameFileIdentifier && createName === removeName;
      isMovedByIdentifierTransition = isTransitionFromNameToId;

      return isMovedById || isMovedByName || isMovedByIdentifierTransition;
    });

    if (movedFile) {
      updates.push({
        componentYaml,
        absoluteFilePath,
        filePath,
        previousFilePath: movedFile.filePath,
      });
    }

    if (movedFile && isMovedById) {
      creates = creates.filter((createItem) => createItem.componentYaml.id !== createId);
      unlinks = unlinks.filter((unlinkItem) => unlinkItem.componentYaml.id !== createId);
    }

    if (movedFile && isMovedByName) {
      creates = creates.filter((createItem) => createItem.componentYaml.name !== createName);
      unlinks = unlinks.filter((unlinkItem) => unlinkItem.componentYaml.name !== createName);
    }

    if (movedFile && isMovedByIdentifierTransition) {
      creates = creates.filter((createItem) => createItem.componentYaml.id !== createId);
      unlinks = unlinks.filter((unlinkItem) => unlinkItem.componentYaml.name !== createName);
    }
  });

  return { componentsToCreate: creates, componentsToUpdate: updates, componentsToUnlink: unlinks };
};

export const handleModifiedFilesAndUpdateComponentChanges =
  (modifiedFiles: ModifiedFilePayload[]) =>
  (changes: ComponentChanges): ComponentChanges => {
    const creates = [...changes.componentsToCreate];
    const updates = [...changes.componentsToUpdate];
    const unlinks = [...changes.componentsToUnlink];

    for (const { oldFile, newFile } of modifiedFiles) {
      if (isFileIdentifierChanged(oldFile, newFile)) {
        unlinks.push(oldFile);
        creates.push(newFile);
      } else {
        updates.push(newFile);
      }
    }

    return { componentsToCreate: creates, componentsToUpdate: updates, componentsToUnlink: unlinks };
  };
