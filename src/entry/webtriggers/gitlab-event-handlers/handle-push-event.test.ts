/* eslint-disable import/first, import/order */
import { mockForgeApi } from '../../../__tests__/helpers/forge-helper';

mockForgeApi();
import { ConfigFileActions } from '@atlassian/forge-graphql';
import { mocked } from 'jest-mock';
import { generatePushEvent } from '../../../__tests__/helpers/gitlab-helper';
import { handlePushEvent } from './handle-push-event';
import {
  findConfigAsCodeFileChanges,
  syncComponent,
  unlinkComponent,
} from '../../../services/sync-component-with-file';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { MOCK_CLOUD_ID, TEST_TOKEN } from '../../../__tests__/fixtures/gitlab-data';
import { ComponentSyncDetails } from '../../../types';

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
  const syncs = mocked(syncComponent);
  const removals = mocked(unlinkComponent);
  const findConfigChanges = mocked(findConfigAsCodeFileChanges);
  const getNonDefaultBranchNameMock = mocked(getTrackingBranchName);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores event if the branch is not tracking', async () => {
    getNonDefaultBranchNameMock.mockResolvedValue(eventWithIncorrectRef.project.default_branch);

    await handlePushEvent(eventWithIncorrectRef, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(syncs).not.toBeCalled();
    expect(removals).not.toBeCalled();
  });

  it('ignores event if no config as code file updates present', async () => {
    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({ componentsToCreate: [], componentsToUpdate: [], componentsToUnlink: [] });
    await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(syncs).not.toBeCalled();
    expect(removals).not.toBeCalled();
  });

  it('performs config as code file updates for default branch', async () => {
    const mockComponentsToCreate = [
      {
        componentYaml: { id: 'test1' },
        absoluteFilePath: 'path/fileName1.yaml',
        filePath: '/path/fileName1.yaml',
      },
    ];
    const mockComponentsToUpdate = [
      {
        componentYaml: { id: 'test2' },
        absoluteFilePath: 'path/fileName2.yaml',
        filePath: '/path/fileName2.yaml',
        previousFilePath: '/previousPath/fileName2.yaml',
      },
    ];
    const mockComponentsToUnlink = [{ componentYaml: { id: 'test3' } }];

    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({
      componentsToCreate: mockComponentsToCreate,
      componentsToUpdate: mockComponentsToUpdate,
      componentsToUnlink: mockComponentsToUnlink,
    });

    await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

    const expectedComponentSyncDetails: ComponentSyncDetails = {
      token: TEST_TOKEN,
      event,
      trackingBranch: event.project.default_branch,
      cloudId: MOCK_CLOUD_ID,
    };

    expect(syncs).toBeCalledWith(mockComponentsToCreate[0], expectedComponentSyncDetails, {
      configFileAction: ConfigFileActions.CREATE,
      newPath: mockComponentsToCreate[0].filePath,
    });
    expect(syncs).toBeCalledWith(mockComponentsToUpdate[0], expectedComponentSyncDetails, {
      configFileAction: ConfigFileActions.UPDATE,
      newPath: mockComponentsToUpdate[0].filePath,
      oldPath: mockComponentsToUpdate[0].previousFilePath,
    });
    expect(removals).toBeCalledWith(mockComponentsToUnlink[0].componentYaml.id, expect.anything());
  });

  it('performs config as code file updates for non-default branch which was set via project variable', async () => {
    const mockComponentsToCreate = [
      {
        componentYaml: { id: 'test1' },
        absoluteFilePath: 'path/fileName1.yaml',
        filePath: '/path/fileName1.yaml',
      },
    ];
    const mockComponentsToUpdate = [
      {
        componentYaml: { id: 'test2' },
        absoluteFilePath: 'path/fileName2.yaml',
        filePath: '/path/fileName2.yaml',
        previousFilePath: '/previousPath/fileName2.yaml',
      },
    ];
    const mockComponentsToUnlink = [{ componentYaml: { id: 'test3' } }];
    const BRANCH_NAME = 'koko';
    const pushEvent = generatePushEvent({ ref: `refs/heads/${BRANCH_NAME}` });

    getNonDefaultBranchNameMock.mockResolvedValue(BRANCH_NAME);
    findConfigChanges.mockResolvedValue({
      componentsToCreate: mockComponentsToCreate,
      componentsToUpdate: mockComponentsToUpdate,
      componentsToUnlink: mockComponentsToUnlink,
    });

    await handlePushEvent(pushEvent, TEST_TOKEN, MOCK_CLOUD_ID);

    const expectedComponentSyncDetails: ComponentSyncDetails = {
      token: TEST_TOKEN,
      event: pushEvent,
      trackingBranch: BRANCH_NAME,
      cloudId: MOCK_CLOUD_ID,
    };

    expect(syncs).toBeCalledWith(mockComponentsToCreate[0], expectedComponentSyncDetails, {
      configFileAction: ConfigFileActions.CREATE,
      newPath: mockComponentsToCreate[0].filePath,
    });
    expect(syncs).toBeCalledWith(mockComponentsToUpdate[0], expectedComponentSyncDetails, {
      configFileAction: ConfigFileActions.UPDATE,
      newPath: mockComponentsToUpdate[0].filePath,
      oldPath: mockComponentsToUpdate[0].previousFilePath,
    });
    expect(removals).toBeCalledWith(mockComponentsToUnlink[0].componentYaml.id, expect.anything());
  });
});
