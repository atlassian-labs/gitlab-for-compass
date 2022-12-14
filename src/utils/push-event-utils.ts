import { CommitFileDiff, DiffsByChangeType, PushEvent } from '../types';

const CONFIG_AS_CODE_FILE_REGEX = /(\/compass\.yml$)|^compass\.yml$|(\/compass\.yaml$)|^compass\.yaml$/;

const isCompassYamlFile = (diff: CommitFileDiff) =>
  diff.new_path.match(CONFIG_AS_CODE_FILE_REGEX) || diff.old_path?.match(CONFIG_AS_CODE_FILE_REGEX);

const isDestructiveRename = (diff: CommitFileDiff) =>
  diff.renamed_file && CONFIG_AS_CODE_FILE_REGEX.test(diff.old_path) && !CONFIG_AS_CODE_FILE_REGEX.test(diff.new_path);

const isRemovedFile = (diff: CommitFileDiff) => diff.deleted_file || isDestructiveRename(diff);

const isModifiedFile = (diff: CommitFileDiff) =>
  (diff.diff.length > 0 && !diff.deleted_file && !diff.new_file) ||
  (diff.renamed_file && CONFIG_AS_CODE_FILE_REGEX.test(diff.new_path));

export const groupDiffsByChangeType = (filesDiffs: CommitFileDiff[]) => {
  return filesDiffs.reduce<DiffsByChangeType>(
    (result, diff) => {
      // only grab compass.yml files
      if (isCompassYamlFile(diff)) {
        if (diff.new_file) {
          result.added.push(diff);
          return result;
        }
        if (isRemovedFile(diff)) {
          result.removed.push(diff);
          return result;
        }
        if (isModifiedFile(diff)) {
          result.modified.push(diff);
          return result;
        }
      }
      return result;
    },
    { added: [], modified: [], removed: [] },
  );
};

export const isEventForTrackingBranch = (event: PushEvent, trackingBranch: string): boolean => {
  const trackingBranchRef = `refs/heads/${trackingBranch}`;

  return event.ref === trackingBranchRef;
};
