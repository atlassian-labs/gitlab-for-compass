/* eslint-disable import/first */
import { mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { DiffsByChangeType } from '../types';
import { createCommitFileDiff } from '../__tests__/helpers/gitlab-helper';
import { groupDiffsByChangeType } from './push-event-utils';

const validCompassYamlName = '/compass.yaml';
const invalidCompassYamlName = '/invalidName.yaml';

describe('groupDiffsByChangeType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should empty DiffsByChangeType if compass.yaml file not changed', () => {
    const filesDiffs = [createCommitFileDiff({ new_path: invalidCompassYamlName, old_path: invalidCompassYamlName })];
    const expectedResult: DiffsByChangeType = { added: [], modified: [], removed: [] };

    const result = groupDiffsByChangeType(filesDiffs);

    expect(result).toEqual(expectedResult);
  });

  it('should push diff to added type if compass.yaml added', () => {
    const filesDiffs = [createCommitFileDiff({ new_path: validCompassYamlName, new_file: true })];
    const expectedResult: DiffsByChangeType = { added: [filesDiffs[0]], modified: [], removed: [] };

    const result = groupDiffsByChangeType(filesDiffs);

    expect(result).toEqual(expectedResult);
  });

  it('should push diff to removed type if the compass.yaml deleted or renamed', () => {
    const filesDiffs = [
      createCommitFileDiff({ new_path: validCompassYamlName, deleted_file: true }),
      createCommitFileDiff({ new_path: invalidCompassYamlName, renamed_file: true, old_path: validCompassYamlName }),
    ];
    const expectedResult: DiffsByChangeType = { added: [], modified: [], removed: [...filesDiffs] };

    const result = groupDiffsByChangeType(filesDiffs);

    expect(result).toEqual(expectedResult);
  });

  it('should push diff to modified type if the compass.yaml changed', () => {
    const filesDiffs = [
      createCommitFileDiff({ diff: 'changed diff', old_path: validCompassYamlName }),
      createCommitFileDiff({ new_path: validCompassYamlName, renamed_file: true }),
    ];
    const expectedResult: DiffsByChangeType = { added: [], modified: [...filesDiffs], removed: [] };

    const result = groupDiffsByChangeType(filesDiffs);

    expect(result).toEqual(expectedResult);
  });
});
