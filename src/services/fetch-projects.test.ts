/* eslint-disable import/order, import/first */
import { storage, mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { mocked } from 'jest-mock';

import { getMergeRequests, getProjects, GitLabHeaders } from '../client/gitlab';
import { getGroupProjects, sortProjects } from './fetch-projects';
import { getComponentByExternalAlias } from '../client/compass';
import { getProjectLabels } from './get-labels';
import {
  generateComponent,
  generateProjectsWithStatuses,
  unsortedProjects,
  sortedProjects,
} from '../__tests__/helpers/gitlab-helper';
import { MergeRequest } from '../types';

jest.mock('../client/gitlab');
jest.mock('../client/compass');
jest.mock('./get-labels');

const mockGetProjects = mocked(getProjects);
const mockGetProjectLabels = mocked(getProjectLabels);
const mockGetComponentByExternalAlias = mocked(getComponentByExternalAlias);
const mockGetMergeRequests = mocked(getMergeRequests);

const MOCK_CLOUD_ID = '0a44684d-52c3-4c0c-99f8-9d89ec294759';
const MOCK_GROUP_ID = 12443;
const MOCK_PROJECT_TOPICS = ['topic-1', 'topic-2'];
const MOCK_GET_PROJECTS_RESPONSE = {
  data: [
    {
      id: 1,
      name: 'koko',
      description: 'description',
      default_branch: 'default_branch',
      topics: MOCK_PROJECT_TOPICS,
      web_url: 'web_url',
      namespace: {
        id: 1,
        full_path: 'path/group/koko',
        path: 'group/koko',
        name: 'group/koko',
      },
      created_at: expect.anything(),
    },
  ],
  headers: {
    get: jest.fn().mockResolvedValue(GitLabHeaders.PAGINATION_TOTAL),
  } as unknown as Headers,
};

const MOCK_GET_PROJECT_LABELS = [...MOCK_PROJECT_TOPICS, 'language:javascript'];
const mergeRequestMock: MergeRequest[] = [
  {
    merged_at: null,
    created_at: new Date().toString(),
  },
];

describe('Fetch Projects Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProjects.mockResolvedValue(MOCK_GET_PROJECTS_RESPONSE);
    mockGetProjectLabels.mockResolvedValue(MOCK_GET_PROJECT_LABELS);
    mockGetMergeRequests.mockResolvedValue({ data: [], headers: {} as Headers });
    storage.get.mockResolvedValue('token');
  });

  it('returns group projects data with isManaged and hasComponent true', async () => {
    mockGetComponentByExternalAlias.mockResolvedValue(
      generateComponent({ dataManager: { externalSourceURL: 'https://gitlab.com/blob/koko/compass.yml' } }),
    );

    const result = await getGroupProjects(MOCK_CLOUD_ID, MOCK_GROUP_ID, 1, 1);

    expect(result).toStrictEqual({
      projects: generateProjectsWithStatuses(true, true, { labels: MOCK_GET_PROJECT_LABELS }),
      total: expect.anything(),
    });
  });

  it('returns group projects data with isManaged and hasComponent false', async () => {
    mockGetComponentByExternalAlias.mockResolvedValue({ component: null });

    const result = await getGroupProjects(MOCK_CLOUD_ID, MOCK_GROUP_ID, 1, 1);

    expect(result).toStrictEqual({
      projects: generateProjectsWithStatuses(false, false, {
        componentId: undefined,
        labels: MOCK_GET_PROJECT_LABELS,
        componentType: undefined,
      }),
      total: expect.anything(),
    });
  });

  it('returns group projects data with isManaged false and hasComponent true', async () => {
    mockGetComponentByExternalAlias.mockResolvedValue(generateComponent());

    const result = await getGroupProjects(MOCK_CLOUD_ID, MOCK_GROUP_ID, 1, 1);

    expect(result).toStrictEqual({
      projects: generateProjectsWithStatuses(true, false, { labels: MOCK_GET_PROJECT_LABELS }),
      total: expect.anything(),
    });
  });

  it('returns group projects data with isCompassFilePrOpened true and hasComponent true', async () => {
    mockGetComponentByExternalAlias.mockResolvedValue(generateComponent());
    mockGetMergeRequests.mockResolvedValue({ data: mergeRequestMock, headers: {} as Headers });

    const result = await getGroupProjects(MOCK_CLOUD_ID, MOCK_GROUP_ID, 1, 1);

    expect(result).toStrictEqual({
      projects: generateProjectsWithStatuses(true, false, {
        labels: MOCK_GET_PROJECT_LABELS,
        isCompassFilePrOpened: true,
      }),

      total: expect.anything(),
    });
  });

  it('returns error in case when fetchAllProjects fails', async () => {
    mockGetProjects.mockRejectedValue(undefined);

    await expect(getGroupProjects(MOCK_CLOUD_ID, MOCK_GROUP_ID, 1, 1)).rejects.toThrow(
      new Error('Error while fetching group projects from Gitlab!'),
    );
  });

  it('returns error in case when getComponentByExternalAlias fails', async () => {
    mockGetComponentByExternalAlias.mockRejectedValue(undefined);

    await expect(getGroupProjects(MOCK_CLOUD_ID, MOCK_GROUP_ID, 1, 1)).rejects.toThrow(
      new Error('Error: Error while getting repository additional fields.'),
    );
  });

  it('returns sorted projects', () => {
    expect(sortProjects(unsortedProjects)).toEqual(sortedProjects);
  });
});
