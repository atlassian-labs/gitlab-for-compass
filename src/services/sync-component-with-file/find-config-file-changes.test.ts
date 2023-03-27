/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../../__tests__/helpers/forge-helper';

mockForgeApi();

import { groupDiffsByChangeType } from '../../utils/push-event-utils';
import { getCommitDiff, getFileContent } from '../../client/gitlab';
import { findConfigAsCodeFileChanges } from './find-config-file-changes';
import { generatePushEvent } from '../../__tests__/helpers/gitlab-helper';
import { CommitFileDiff, CompassYaml, ComponentChanges } from '../../types';

jest.mock('../../client/gitlab', () => ({
  getCommitDiff: jest.fn(),
  getFileContent: jest.fn(),
}));
jest.mock('../../utils/push-event-utils', () => {
  const module = jest.requireActual('../../utils/push-event-utils');
  return {
    ...module,
    groupDiffsByChangeType: jest.fn(),
  };
});

const getCommitDiffMock = mocked(getCommitDiff);
const groupDiffsByChangeTypeMock = mocked(groupDiffsByChangeType);
const getFileContentMock = mocked(getFileContent);

const createCommitFileDiffMock = (
  mockFileContents: CompassYaml[],
  overrideCommitFileDiff: Partial<CommitFileDiff> = {},
): CommitFileDiff => {
  mockFileContents.forEach((fileContent) => getFileContentMock.mockResolvedValueOnce(fileContent));

  return {
    diff: 'diff',
    new_path: 'new/path',
    old_path: 'old/path',
    new_file: false,
    renamed_file: false,
    deleted_file: false,
    ...overrideCommitFileDiff,
  };
};

describe('findConfigAsCodeFileChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCommitDiffMock.mockResolvedValue([
      {
        diff: 'string',
        old_path: 'string',
        new_path: 'string',
        new_file: true,
        renamed_file: false,
        deleted_file: false,
      },
    ]);
  });

  it('returns empty componentsToSync and componentsToUnlink arrays if no changes present', async () => {
    const event = generatePushEvent();
    groupDiffsByChangeTypeMock.mockReturnValue({ added: [], modified: [], removed: [] });
    const expectedResult: ComponentChanges = {
      componentsToSync: [],
      componentsToUnlink: [],
    };

    const result = await findConfigAsCodeFileChanges(event, 'token');
    expect(result).toEqual(expectedResult);
  });

  it('returns correct componentsToSync and componentsToUnlink', async () => {
    const event = generatePushEvent();

    const removedMock = [
      createCommitFileDiffMock([{ id: 'removed1' }], { deleted_file: true }),
      createCommitFileDiffMock([{ id: 'removed2' }], { deleted_file: true }),
    ];

    const addedMock = [
      createCommitFileDiffMock([{ id: 'added1' }], { new_path: 'path/to/name1.yml', new_file: true }),
      createCommitFileDiffMock([{ id: 'added2' }], { new_path: 'path/to/name2.yml', new_file: true }),
    ];

    const modifiedMock = [
      createCommitFileDiffMock([{ id: 'modifiedBefore1' }, { id: 'modifiedAfter1' }], { new_path: 'path/name3.yaml' }),
      createCommitFileDiffMock([{ id: 'modifiedBefore2' }, { id: 'modifiedAfter2' }], { new_path: 'path/name4.yaml' }),
    ];

    groupDiffsByChangeTypeMock.mockReturnValue({
      added: addedMock,
      modified: modifiedMock,
      removed: removedMock,
    });
    const expectedResult: ComponentChanges = {
      componentsToSync: [
        { componentYaml: { id: 'added1' }, absoluteFilePath: 'path/to/name1.yml' },
        { componentYaml: { id: 'added2' }, absoluteFilePath: 'path/to/name2.yml' },
        { componentYaml: { id: 'modifiedAfter1' }, absoluteFilePath: 'path/name3.yaml' },
        { componentYaml: { id: 'modifiedAfter2' }, absoluteFilePath: 'path/name4.yaml' },
      ],
      componentsToUnlink: [
        { id: 'removed1' },
        { id: 'removed2' },
        { id: 'modifiedBefore1' },
        { id: 'modifiedBefore2' },
      ],
    };

    const result = await findConfigAsCodeFileChanges(event, 'token');

    expect(result).toEqual(expectedResult);
  });

  it('unlinks component when the file ID changed to immutableLocalKey', async () => {
    const event = generatePushEvent();
    const modifiedMock = [
      createCommitFileDiffMock([{ id: 'modifiedBefore1' }, { immutableLocalKey: 'modifiedAfter1' }]),
    ];

    groupDiffsByChangeTypeMock.mockReturnValue({
      added: [],
      modified: modifiedMock,
      removed: [],
    });
    const expectedResult: ComponentChanges = {
      componentsToSync: [{ componentYaml: { immutableLocalKey: 'modifiedAfter1' }, absoluteFilePath: 'new/path' }],
      componentsToUnlink: [{ id: 'modifiedBefore1' }],
    };

    const result = await findConfigAsCodeFileChanges(event, 'token');

    expect(result).toEqual(expectedResult);
  });

  it('unlinks component when the file immutableLocalKey changed', async () => {
    const event = generatePushEvent();
    const modifiedMock = [
      createCommitFileDiffMock([{ immutableLocalKey: 'modifiedBefore1' }, { immutableLocalKey: 'modifiedAfter1' }]),
    ];

    groupDiffsByChangeTypeMock.mockReturnValue({
      added: [],
      modified: modifiedMock,
      removed: [],
    });
    const expectedResult: ComponentChanges = {
      componentsToSync: [{ componentYaml: { immutableLocalKey: 'modifiedAfter1' }, absoluteFilePath: 'new/path' }],
      componentsToUnlink: [{ immutableLocalKey: 'modifiedBefore1' }],
    };

    const result = await findConfigAsCodeFileChanges(event, 'token');

    expect(result).toEqual(expectedResult);
  });
});
