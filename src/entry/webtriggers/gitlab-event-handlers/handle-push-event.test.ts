/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../../../__tests__/helpers/forge-helper';

mockForgeApi();
import { generatePushEvent } from '../../../__tests__/helpers/gitlab-helper';
import { handlePushEvent } from './handle-push-event';
import {
  findConfigAsCodeFileChanges,
  syncComponent,
  unlinkComponent,
} from '../../../services/sync-component-with-file';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { TEST_TOKEN } from '../../../__tests__/fixtures/gitlab-data';

jest.mock('../../../services/sync-component-with-file', () => {
  return {
    syncComponent: jest.fn(),
    unlinkComponent: jest.fn(),
    findConfigAsCodeFileChanges: jest.fn(),
  };
});

jest.mock('../../../services/get-tracking-branch');

describe('Gitlab push events', () => {
  const event = generatePushEvent();
  const eventWithIncorrectRef = generatePushEvent({
    ref: 'wrong',
  });
  const updates = mocked(syncComponent);
  const removals = mocked(unlinkComponent);
  const findConfigChanges = mocked(findConfigAsCodeFileChanges);
  const getNonDefaultBranchNameMock = mocked(getTrackingBranchName);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores event if the branch is not tracking', async () => {
    getNonDefaultBranchNameMock.mockResolvedValue(eventWithIncorrectRef.project.default_branch);

    await handlePushEvent(eventWithIncorrectRef, TEST_TOKEN);

    expect(updates).not.toBeCalled();
    expect(removals).not.toBeCalled();
  });

  it('ignores event if no config as code file updates present', async () => {
    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({ componentsToSync: [], componentsToUnlink: [] });
    await handlePushEvent(event, TEST_TOKEN);

    expect(updates).not.toBeCalled();
    expect(removals).not.toBeCalled();
  });

  it('performs config as code file updates for default branch', async () => {
    const mockComponentsToSync = [
      {
        componentYaml: { id: 'test1' },
        absoluteFilePath: 'path/fileName1.yaml',
      },
      {
        componentYaml: { id: 'test2' },
        absoluteFilePath: 'path/fileName2.yaml',
      },
    ];
    const mockComponentsToUnlink = [{ id: 'test1' }];

    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({
      componentsToSync: mockComponentsToSync,
      componentsToUnlink: mockComponentsToUnlink,
    });

    await handlePushEvent(event, TEST_TOKEN);

    expect(updates).toBeCalledWith(
      TEST_TOKEN,
      mockComponentsToSync[0].componentYaml,
      mockComponentsToSync[0].absoluteFilePath,
      expect.anything(),
      event.project.default_branch,
    );
    expect(updates).toBeCalledWith(
      TEST_TOKEN,
      mockComponentsToSync[1].componentYaml,
      mockComponentsToSync[1].absoluteFilePath,
      expect.anything(),
      event.project.default_branch,
    );
    expect(removals).toBeCalledWith(mockComponentsToUnlink[0].id, expect.anything());
  });

  it('performs config as code file updates for non-default branch which was set via project variable', async () => {
    const mockComponentsToSync = [
      {
        componentYaml: { id: 'test1' },
        absoluteFilePath: 'path/fileName1.yaml',
      },
      {
        componentYaml: { id: 'test2' },
        absoluteFilePath: 'path/fileName2.yaml',
      },
    ];
    const BRANCH_NAME = 'koko';
    const mockComponentsToUnlink = [{ id: 'test1' }];
    const pushEvent = generatePushEvent({ ref: `refs/heads/${BRANCH_NAME}` });

    getNonDefaultBranchNameMock.mockResolvedValue(BRANCH_NAME);
    findConfigChanges.mockResolvedValue({
      componentsToSync: mockComponentsToSync,
      componentsToUnlink: mockComponentsToUnlink,
    });

    await handlePushEvent(pushEvent, TEST_TOKEN);

    expect(updates).toBeCalledWith(
      TEST_TOKEN,
      mockComponentsToSync[0].componentYaml,
      mockComponentsToSync[0].absoluteFilePath,
      expect.anything(),
      BRANCH_NAME,
    );
    expect(updates).toBeCalledWith(
      TEST_TOKEN,
      mockComponentsToSync[1].componentYaml,
      mockComponentsToSync[1].absoluteFilePath,
      expect.anything(),
      BRANCH_NAME,
    );
    expect(removals).toBeCalledWith(mockComponentsToUnlink[0].id, expect.anything());
  });
});
