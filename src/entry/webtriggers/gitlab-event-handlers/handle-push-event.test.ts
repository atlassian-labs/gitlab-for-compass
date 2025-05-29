/* eslint-disable import/first, import/order */
import {
  mockAgg,
  mockCreateEvent,
  mockResyncRepoFiles,
  mockUnlinkComponent,
} from '../../../__tests__/helpers/mock-agg';

mockAgg();

import { ConfigFileActions, UnLinkComponentInput } from '@atlassian/forge-graphql-types';
import { mocked } from 'jest-mock';
import { generatePushEvent } from '../../../__tests__/helpers/gitlab-helper';
import { handlePushEvent } from './handle-push-event';
import { findConfigAsCodeFileChanges, syncComponent } from '../../../services/sync-component-with-file';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { MOCK_CLOUD_ID, TEST_TOKEN } from '../../../__tests__/fixtures/gitlab-data';
import { ComponentSyncDetails } from '../../../types';
import { EXTERNAL_SOURCE } from '../../../constants';
import { ALL_SETTLED_STATUS, getFormattedErrors } from '../../../utils/promise-allsettled-helpers';
import * as featureFlagService from '../../../services/feature-flags';
import { getCommitDiff } from '../../../client/gitlab';

jest.mock('../../../services/sync-component-with-file', () => {
  return {
    syncComponent: jest.fn(),
    findConfigAsCodeFileChanges: jest.fn(),
  };
});

jest.mock('../../../client/gitlab', () => {
  return {
    getCommitDiff: jest.fn(),
  };
});

jest.mock('../../../services/get-tracking-branch');
jest.spyOn(global.console, 'error').mockImplementation(() => ({}));

const MOCK_ERROR = new Error('Unexpected Error');
const RejectedPromiseSettled: PromiseSettledResult<unknown> = {
  status: ALL_SETTLED_STATUS.REJECTED,
  reason: MOCK_ERROR,
};

describe('Gitlab push events', () => {
  const event = generatePushEvent();
  const eventWithIncorrectRef = generatePushEvent({
    ref: 'wrong',
  });
  const syncs = mocked(syncComponent);
  const removals = mockUnlinkComponent;
  const resyncRepoFiles = mockResyncRepoFiles;
  const createEvent = mockCreateEvent;
  const findConfigChanges = mocked(findConfigAsCodeFileChanges);
  const getNonDefaultBranchNameMock = mocked(getTrackingBranchName);
  const getCommitDiffMock = mocked(getCommitDiff);

  const mockComponentsToUnlink = [
    {
      componentYaml: { id: 'test2' },
      filePath: '/compass.yml',
      deduplicationId: '1',
      shouldRemoveExternalAlias: true,
    },
  ];

  const mockComponentsToUnlinkWithoutExternalAliasesToRemove = [
    {
      componentYaml: { id: 'test2' },
      filePath: '/compass.yml',
      deduplicationId: '1',
      shouldRemoveExternalAlias: false,
    },
  ];

  const mockUnlinkComponentData = [
    {
      componentId: 'test2',
      cloudId: MOCK_CLOUD_ID,
      filePath: `/compass.yml`,
      deduplicationId: '1',
      additionalExternalAliasesToRemove: [
        {
          externalId: '1',
          externalSource: EXTERNAL_SOURCE,
        },
      ],
    },
  ];

  const mockUnlinkComponentDataWithoutExternalAliasesToRemove: UnLinkComponentInput[] = [
    {
      componentId: 'test2',
      cloudId: MOCK_CLOUD_ID,
      filePath: `/compass.yml`,
      deduplicationId: '1',
      additionalExternalAliasesToRemove: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores event if the branch is not tracking', async () => {
    getNonDefaultBranchNameMock.mockResolvedValue(eventWithIncorrectRef.project.default_branch);

    await handlePushEvent(eventWithIncorrectRef, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(syncs).not.toBeCalled();
    expect(removals).not.toBeCalled();
    expect(resyncRepoFiles).not.toBeCalled();
  });

  it('ignores event if no config as code file updates present', async () => {
    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({ componentsToCreate: [], componentsToUpdate: [], componentsToUnlink: [] });
    getCommitDiffMock.mockResolvedValue([]);

    await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(syncs).not.toBeCalled();
    expect(removals).not.toBeCalled();
    expect(resyncRepoFiles).not.toBeCalled();
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

    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({
      componentsToCreate: mockComponentsToCreate,
      componentsToUpdate: mockComponentsToUpdate,
      componentsToUnlink: mockComponentsToUnlink,
    });
    getCommitDiffMock.mockResolvedValue([]);

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
      deduplicationId: '1',
    });
    expect(syncs).toBeCalledWith(mockComponentsToUpdate[0], expectedComponentSyncDetails, {
      configFileAction: ConfigFileActions.UPDATE,
      newPath: mockComponentsToUpdate[0].filePath,
      oldPath: mockComponentsToUpdate[0].previousFilePath,
      deduplicationId: '1',
    });
    expect(removals).toBeCalledWith(mockUnlinkComponentData[0]);
    expect(resyncRepoFiles).not.toBeCalled();
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
    const BRANCH_NAME = 'koko';
    const pushEvent = generatePushEvent({ ref: `refs/heads/${BRANCH_NAME}` });

    getNonDefaultBranchNameMock.mockResolvedValue(BRANCH_NAME);
    findConfigChanges.mockResolvedValue({
      componentsToCreate: mockComponentsToCreate,
      componentsToUpdate: mockComponentsToUpdate,
      componentsToUnlink: mockComponentsToUnlink,
    });
    getCommitDiffMock.mockResolvedValue([]);
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
      deduplicationId: '1',
    });
    expect(syncs).toBeCalledWith(mockComponentsToUpdate[0], expectedComponentSyncDetails, {
      configFileAction: ConfigFileActions.UPDATE,
      newPath: mockComponentsToUpdate[0].filePath,
      oldPath: mockComponentsToUpdate[0].previousFilePath,
      deduplicationId: '1',
    });
    expect(removals).toBeCalledWith(mockUnlinkComponentData[0]);
    expect(resyncRepoFiles).not.toBeCalled();
  });

  it('does not delete externalAlias for the current component', async () => {
    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({
      componentsToCreate: [],
      componentsToUpdate: [],
      componentsToUnlink: mockComponentsToUnlinkWithoutExternalAliasesToRemove,
    });
    getCommitDiffMock.mockResolvedValue([]);

    await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(removals).toBeCalledWith(mockUnlinkComponentDataWithoutExternalAliasesToRemove[0]);
  });

  it('failed handling push event ', async () => {
    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({
      componentsToCreate: [],
      componentsToUpdate: [],
      componentsToUnlink: mockComponentsToUnlinkWithoutExternalAliasesToRemove,
    });

    removals.mockRejectedValue(MOCK_ERROR);

    await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(console.error).toBeCalledWith(
      'Error while handling push event',
      new Error(`Error removing components: ${getFormattedErrors([RejectedPromiseSettled])}`),
    );
  });

  it('sends push event to compass when pushEvent FF is true', async () => {
    jest.spyOn(featureFlagService, 'isCompassPushEventEnabled').mockReturnValue(true);

    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({ componentsToCreate: [], componentsToUpdate: [], componentsToUnlink: [] });
    await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(createEvent).toBeCalledWith([
      {
        cloudId: MOCK_CLOUD_ID,
        event: {
          push: {
            pushEventProperties: {
              id: event.commits[0].id,
              branchName: 'main',
              author: {
                name: event.commits[0].author.name,
                email: event.commits[0].author.email,
              },
            },
            externalEventSourceId: event.project.id.toString(),
            updateSequenceNumber: 1,
            displayName: 'Commit on branch main',
            url: event.commits[0].url,
            description: event.commits[0].message,
            lastUpdated: event.commits[0].timestamp,
          },
        },
      },
    ]);
  });

  it('does not send push event to compass when pushEvent FF is false', async () => {
    jest.spyOn(featureFlagService, 'isCompassPushEventEnabled').mockReturnValue(false);

    getNonDefaultBranchNameMock.mockResolvedValue(event.project.default_branch);
    findConfigChanges.mockResolvedValue({ componentsToCreate: [], componentsToUpdate: [], componentsToUnlink: [] });
    await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(createEvent).not.toBeCalled();
  });

  describe('resync repo files', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('does not attempt to resync repo files when FF is off', async () => {
      jest.spyOn(featureFlagService, 'isPackageDependenciesM3Enabled').mockReturnValue(false);

      await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

      expect(resyncRepoFiles).not.toBeCalled();
    });

    it('does not resync repo files when there are no changes', async () => {
      getCommitDiffMock.mockResolvedValue([]);

      await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

      expect(resyncRepoFiles).not.toBeCalled();
    });

    it('resyncs repo files when there are changes', async () => {
      jest.spyOn(featureFlagService, 'isPackageDependenciesM3Enabled').mockReturnValue(true);
      const mockCommitDiffs = [
        {
          diff: '@@ -71,6 +71,8 @@\n sudo -u git -H bundle exec rake migrate_\n+\n ```\n \n ### 6. Update config files',
          new_path: 'doc/update/5.4-to-6.0.md',
          old_path: 'doc/update/5.4-to-6.0.md',
          new_file: false,
          renamed_file: false,
          deleted_file: false,
        },
        {
          diff: 'another diff \n ### 6. Update package dependencies file',
          new_path: 'app/ui/home/package-lock.json',
          old_path: 'app/ui/home/package-lock.json',
          new_file: false,
          renamed_file: false,
          deleted_file: false,
        },
        {
          diff: 'another diff \n ### 6. Delete package dependencies file',
          new_path: 'app/service/package-lock.json',
          old_path: 'app/service/package-lock.json',
          new_file: false,
          renamed_file: false,
          deleted_file: true,
        },
        {
          diff: 'another diff \n ### 6. Rename package dependencies file',
          new_path: 'app/src/whatever/package-lock.json',
          old_path: 'app/src/whatever/package-lock-2.json',
          new_file: false,
          renamed_file: true,
          deleted_file: false,
        },
        {
          diff: 'another diff \n ### 6. Add package dependencies file',
          new_path: 'app/main/package-lock.json',
          old_path: 'app/main/package-lock.json',
          new_file: true,
          renamed_file: false,
          deleted_file: false,
        },
      ];

      getCommitDiffMock.mockResolvedValue(mockCommitDiffs);

      await handlePushEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

      expect(resyncRepoFiles).toBeCalledWith({
        cloudId: MOCK_CLOUD_ID,
        repoId: event.project.id.toString(),
        baseRepoUrl: event.project.web_url,
        changedFiles: [
          {
            currentFilePath: {
              fullFilePath:
                `${event.project.web_url}/blob/` +
                `${event.project.default_branch}/` +
                `${mockCommitDiffs[0].new_path}`,
              localFilePath: mockCommitDiffs[0].new_path,
            },
            oldFilePath: undefined,
            action: 'UPDATED',
          },
          {
            currentFilePath: {
              fullFilePath:
                `${event.project.web_url}/blob/` +
                `${event.project.default_branch}/` +
                `${mockCommitDiffs[1].new_path}`,
              localFilePath: mockCommitDiffs[1].new_path,
            },
            oldFilePath: undefined,
            action: 'UPDATED',
          },
          {
            currentFilePath: {
              fullFilePath:
                `${event.project.web_url}/blob/` +
                `${event.project.default_branch}/` +
                `${mockCommitDiffs[2].new_path}`,
              localFilePath: mockCommitDiffs[2].new_path,
            },
            oldFilePath: {
              fullFilePath:
                `${event.project.web_url}/blob/` +
                `${event.project.default_branch}/` +
                `${mockCommitDiffs[2].old_path}`,
              localFilePath: mockCommitDiffs[2].old_path,
            },
            action: 'DELETED',
          },
          {
            currentFilePath: {
              fullFilePath:
                `${event.project.web_url}/blob/` +
                `${event.project.default_branch}/` +
                `${mockCommitDiffs[3].new_path}`,
              localFilePath: mockCommitDiffs[3].new_path,
            },
            oldFilePath: {
              fullFilePath:
                `${event.project.web_url}/blob/` +
                `${event.project.default_branch}/` +
                `${mockCommitDiffs[3].old_path}`,
              localFilePath: mockCommitDiffs[3].old_path,
            },
            action: 'UPDATED',
          },
          {
            currentFilePath: {
              fullFilePath:
                `${event.project.web_url}/blob/` +
                `${event.project.default_branch}/` +
                `${mockCommitDiffs[4].new_path}`,
              localFilePath: mockCommitDiffs[4].new_path,
            },
            oldFilePath: {
              fullFilePath:
                `${event.project.web_url}/blob/` +
                `${event.project.default_branch}/` +
                `${mockCommitDiffs[4].old_path}`,
              localFilePath: mockCommitDiffs[4].old_path,
            },
            action: 'CREATED',
          },
        ],
      });
    });
  });
});
