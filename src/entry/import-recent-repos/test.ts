/* eslint-disable import/first */
import { Component } from '@atlassian/forge-graphql/dist/src/compound-types';
import { internalMetrics } from '@forge/metrics';
import { mockForgeApi, storage } from '../../__tests__/helpers/forge-helper';

mockForgeApi();
import { importRecentRepos } from '../..';
import { getProjects } from '../../client/gitlab';
import { compareProjectWithExistingComponent } from '../../services/fetch-projects';
import { createComponent, createComponentSlug } from '../../client/compass';
import { GitlabAPIGroup, GitlabAPIProject } from '../../types';
import { getConnectedGroups } from '../../services/group';

// Mock the dependencies
jest.mock('../../services/group');
jest.mock('../../client/gitlab');
jest.mock('../../services/fetch-projects');
jest.mock('../../client/compass');

const mockedIncr = jest.fn();
jest.mock('@forge/metrics', () => ({
  internalMetrics: {
    counter: jest.fn(() => ({
      incr: mockedIncr,
    })),
  },
}));

// Define mock implementations
const mockStorageGet = jest.mocked(storage.getSecret);
const mockCreateComponent = jest.mocked(createComponent);
const mockCreateComponentSlug = jest.mocked(createComponentSlug);

// Define constants and mock data
const MOCK_GROUP_TOKEN = 'mock-group-token';
const MOCK_CLOUD_ID = 'cloud-id';
const MOCK_GROUP_ID_1 = 12345;

const MOCK_CONNECTED_GROUP_1 = {
  full_name: 'full name',
  name: 'mock-group-name-1',
  id: MOCK_GROUP_ID_1,
  path: 'mock-group-path-1',
} as GitlabAPIGroup;

const MOCK_CONNECTED_GROUP_2 = {
  full_name: 'full name',
  name: 'mock-group-name-2',
  id: MOCK_GROUP_ID_1,
  path: 'mock-group-path-2',
} as GitlabAPIGroup;

const MOCK_THREE_PROJECTS = [
  {
    id: 1,
    description: 'desc',
    name: 'repo1',
    topics: [],
    default_branch: 'main',
    web_url: 'url-1',
    namespace: {
      id: MOCK_GROUP_ID_1,
      full_path: MOCK_CONNECTED_GROUP_1.path,
      name: MOCK_CONNECTED_GROUP_1.name,
      path: MOCK_CONNECTED_GROUP_1.path,
    },
    created_at: '2025-01-27',
  },
  {
    id: 2,
    description: 'desc',
    name: 'repo2',
    topics: [],
    default_branch: 'main',
    web_url: 'url-2',
    namespace: {
      id: MOCK_GROUP_ID_1,
      full_path: MOCK_CONNECTED_GROUP_1.path,
      name: MOCK_CONNECTED_GROUP_1.name,
      path: MOCK_CONNECTED_GROUP_1.path,
    },
    created_at: '2025-01-27',
  },
  {
    id: 3,
    description: 'desc',
    name: 'repo3',
    topics: [],
    default_branch: 'main',
    web_url: 'url-3',
    namespace: {
      id: MOCK_GROUP_ID_1,
      full_path: MOCK_CONNECTED_GROUP_1.path,
      name: MOCK_CONNECTED_GROUP_1.name,
    },
    created_at: '2025-01-27',
  },
] as GitlabAPIProject[];

describe('importRecentRepos module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateComponentSlug.mockResolvedValue(undefined);
  });

  it('should import recent projects successfully with only one connected group', async () => {
    (getConnectedGroups as jest.Mock).mockResolvedValue([MOCK_CONNECTED_GROUP_1]);
    mockStorageGet.mockResolvedValue(MOCK_GROUP_TOKEN);

    (getProjects as jest.Mock).mockResolvedValue({ data: MOCK_THREE_PROJECTS });
    (compareProjectWithExistingComponent as jest.Mock).mockResolvedValue({ hasComponent: false });
    mockCreateComponent.mockResolvedValueOnce({ id: 1, name: 'repo1' } as unknown as Component);
    mockCreateComponent.mockResolvedValueOnce({ id: 2, name: 'repo2' } as unknown as Component);
    mockCreateComponent.mockResolvedValueOnce({ id: 3, name: 'repo3' } as unknown as Component);

    const result = await importRecentRepos({ cloudId: MOCK_CLOUD_ID, numRepos: 3 });
    expect(getProjects).toHaveBeenCalledWith(MOCK_GROUP_TOKEN, MOCK_GROUP_ID_1, 1, 3, undefined, 'last_activity_at');

    expect(mockCreateComponent).toHaveBeenCalledTimes(3);
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo1' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo2' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo3' }));
    expect(mockCreateComponentSlug).toHaveBeenCalledTimes(3);

    expect(internalMetrics.counter).toHaveBeenCalledTimes(3);
    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.success');
    expect(mockedIncr).toHaveBeenCalledTimes(3);

    expect(result.success).toBe(true);
    expect(result.response.numReposImported).toBe(3);
  });

  it('should import recent projects successfully with multiple connected groups', async () => {
    (getConnectedGroups as jest.Mock).mockResolvedValue([MOCK_CONNECTED_GROUP_1, MOCK_CONNECTED_GROUP_2]);
    mockStorageGet.mockResolvedValue(MOCK_GROUP_TOKEN);

    (getProjects as jest.Mock).mockResolvedValue({ data: MOCK_THREE_PROJECTS });
    (compareProjectWithExistingComponent as jest.Mock).mockResolvedValue({ hasComponent: false });
    mockCreateComponent.mockResolvedValueOnce({ id: 1, name: 'repo1' } as unknown as Component);
    mockCreateComponent.mockResolvedValueOnce({ id: 2, name: 'repo2' } as unknown as Component);
    mockCreateComponent.mockResolvedValueOnce({ id: 3, name: 'repo3' } as unknown as Component);

    const result = await importRecentRepos({ cloudId: MOCK_CLOUD_ID, numRepos: 3 });
    expect(getProjects).toHaveBeenCalledWith(MOCK_GROUP_TOKEN, MOCK_GROUP_ID_1, 1, 3, undefined, 'last_activity_at');

    expect(mockCreateComponent).toHaveBeenCalledTimes(3);
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo1' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo2' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo3' }));
    expect(mockCreateComponentSlug).toHaveBeenCalledTimes(3);

    expect(internalMetrics.counter).toHaveBeenCalledTimes(3);
    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.success');
    expect(mockedIncr).toHaveBeenCalledTimes(3);

    expect(result.success).toBe(true);
    expect(result.response.numReposImported).toBe(3);
  });

  it('should only import projects that are not already imported', async () => {
    (getConnectedGroups as jest.Mock).mockResolvedValue([MOCK_CONNECTED_GROUP_1]);
    mockStorageGet.mockResolvedValue(MOCK_GROUP_TOKEN);

    (getProjects as jest.Mock).mockResolvedValue({ data: MOCK_THREE_PROJECTS });
    (compareProjectWithExistingComponent as jest.Mock).mockResolvedValueOnce({ hasComponent: false });
    (compareProjectWithExistingComponent as jest.Mock).mockResolvedValueOnce({ hasComponent: false });
    (compareProjectWithExistingComponent as jest.Mock).mockResolvedValueOnce({ hasComponent: true });

    mockCreateComponent.mockResolvedValueOnce({ id: 1, name: 'repo1' } as unknown as Component);
    mockCreateComponent.mockResolvedValueOnce({ id: 2, name: 'repo2' } as unknown as Component);

    const result = await importRecentRepos({ cloudId: MOCK_CLOUD_ID, numRepos: 3 });

    expect(getProjects).toHaveBeenCalledWith(MOCK_GROUP_TOKEN, MOCK_GROUP_ID_1, 1, 3, undefined, 'last_activity_at');

    expect(mockCreateComponent).toHaveBeenCalledTimes(2);
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo1' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo2' }));
    expect(mockCreateComponent).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ name: 'repo3' }),
    );
    expect(mockCreateComponentSlug).toHaveBeenCalledTimes(2);

    expect(internalMetrics.counter).toHaveBeenCalledTimes(2);
    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.success');
    expect(mockedIncr).toHaveBeenCalledTimes(2);

    expect(result.success).toBe(true);
    expect(result.response.numReposImported).toBe(2);
  });

  it('should still return success if all projects are already imported', async () => {
    (getConnectedGroups as jest.Mock).mockResolvedValue([MOCK_CONNECTED_GROUP_1]);
    mockStorageGet.mockResolvedValue(MOCK_GROUP_TOKEN);

    (getProjects as jest.Mock).mockResolvedValue({ data: MOCK_THREE_PROJECTS });
    (compareProjectWithExistingComponent as jest.Mock).mockResolvedValue({ hasComponent: true });

    const result = await importRecentRepos({ cloudId: MOCK_CLOUD_ID, numRepos: 3 });

    expect(getProjects).toHaveBeenCalledWith(MOCK_GROUP_TOKEN, MOCK_GROUP_ID_1, 1, 3, undefined, 'last_activity_at');

    expect(mockCreateComponent).toHaveBeenCalledTimes(0);

    expect(internalMetrics.counter).toHaveBeenCalledTimes(0);
    expect(mockedIncr).toHaveBeenCalledTimes(0);

    expect(result.success).toBe(true);
    expect(result.response.numReposImported).toBe(0);
  });

  it('should return error if no orgs are connected', async () => {
    (getConnectedGroups as jest.Mock).mockResolvedValue([]);

    const result = await importRecentRepos({ cloudId: MOCK_CLOUD_ID, numRepos: 3 });
    expect(result.success).toBe(false);
    expect(result.errors).toBe('No connected Gitlab groups');
  });

  it('should return error if getProjects fails', async () => {
    (getConnectedGroups as jest.Mock).mockResolvedValue([MOCK_CONNECTED_GROUP_1]);
    mockStorageGet.mockResolvedValue(MOCK_GROUP_TOKEN);

    (getProjects as jest.Mock).mockRejectedValue(new Error('Search failed'));
    const result = await importRecentRepos({ cloudId: MOCK_CLOUD_ID, numRepos: 3 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Search failed');
  });

  it('should return error if some projects fail to import', async () => {
    (getConnectedGroups as jest.Mock).mockResolvedValue([MOCK_CONNECTED_GROUP_1]);
    mockStorageGet.mockResolvedValue(MOCK_GROUP_TOKEN);

    (getProjects as jest.Mock).mockResolvedValue({ data: MOCK_THREE_PROJECTS });
    (compareProjectWithExistingComponent as jest.Mock).mockResolvedValue({ hasComponent: false });

    mockCreateComponent.mockResolvedValueOnce({ id: 1, name: 'repo1' } as unknown as Component);
    mockCreateComponent.mockResolvedValueOnce({ id: 2, name: 'repo2' } as unknown as Component);
    mockCreateComponent.mockRejectedValueOnce(new Error('Import failed for repo3'));

    const result = await importRecentRepos({ cloudId: MOCK_CLOUD_ID, numRepos: 3 });

    expect(getProjects).toHaveBeenCalledWith(MOCK_GROUP_TOKEN, MOCK_GROUP_ID_1, 1, 3, undefined, 'last_activity_at');

    expect(mockCreateComponent).toHaveBeenCalledTimes(4);
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo1' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo2' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo3' }));

    expect(internalMetrics.counter).toHaveBeenCalledTimes(3);
    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.success');
    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.fail');
    expect(mockedIncr).toHaveBeenCalledTimes(3);

    expect(result.success).toBe(false);
    expect(result.response.numReposImported).toBe(2);
  });

  it('should return error if all projects fail to import', async () => {
    (getConnectedGroups as jest.Mock).mockResolvedValue([MOCK_CONNECTED_GROUP_1]);
    mockStorageGet.mockResolvedValue(MOCK_GROUP_TOKEN);

    (getProjects as jest.Mock).mockResolvedValue({ data: MOCK_THREE_PROJECTS });
    (compareProjectWithExistingComponent as jest.Mock).mockResolvedValue({ hasComponent: false });

    mockCreateComponent.mockRejectedValueOnce(new Error('Import failed for repo1'));
    mockCreateComponent.mockRejectedValueOnce(new Error('Import failed for repo2'));
    mockCreateComponent.mockRejectedValueOnce(new Error('Import failed for repo3'));

    const result = await importRecentRepos({ cloudId: MOCK_CLOUD_ID, numRepos: 3 });

    expect(getProjects).toHaveBeenCalledWith(MOCK_GROUP_TOKEN, MOCK_GROUP_ID_1, 1, 3, undefined, 'last_activity_at');

    expect(mockCreateComponent).toHaveBeenCalledTimes(6);
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo1' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo2' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo3' }));

    expect(internalMetrics.counter).toHaveBeenCalledTimes(3);
    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.fail');
    expect(internalMetrics.counter).not.toHaveBeenCalledWith('compass.gitlab.import.end.success');
    expect(mockedIncr).toHaveBeenCalledTimes(3);

    expect(result.success).toBe(false);
    expect(result.response.numReposImported).toBe(0);
  });

  it('should return success if there are less than the numRepos passed in', async () => {
    (getConnectedGroups as jest.Mock).mockResolvedValue([MOCK_CONNECTED_GROUP_1]);
    mockStorageGet.mockResolvedValue(MOCK_GROUP_TOKEN);

    (getProjects as jest.Mock).mockResolvedValue({ data: MOCK_THREE_PROJECTS });
    (compareProjectWithExistingComponent as jest.Mock).mockResolvedValue({ hasComponent: false });

    mockCreateComponent.mockResolvedValueOnce({ id: 1, name: 'repo1' } as unknown as Component);
    mockCreateComponent.mockResolvedValueOnce({ id: 2, name: 'repo2' } as unknown as Component);
    mockCreateComponent.mockResolvedValueOnce({ id: 3, name: 'repo3' } as unknown as Component);

    const result = await importRecentRepos({ cloudId: MOCK_CLOUD_ID, numRepos: 5 });

    expect(getProjects).toHaveBeenCalledWith(MOCK_GROUP_TOKEN, MOCK_GROUP_ID_1, 1, 5, undefined, 'last_activity_at');

    expect(mockCreateComponent).toHaveBeenCalledTimes(3);
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo1' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo2' }));
    expect(mockCreateComponent).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ name: 'repo3' }));

    expect(internalMetrics.counter).toHaveBeenCalledTimes(3);
    expect(internalMetrics.counter).toHaveBeenCalledWith('compass.gitlab.import.end.success');
    expect(mockedIncr).toHaveBeenCalledTimes(3);

    expect(result.success).toBe(true);
    expect(result.response.numReposImported).toBe(3);
  });
});
