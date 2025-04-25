/* eslint-disable import/order */
import { storage, mockForgeApi } from '../../__tests__/helpers/forge-helper';
/* eslint-disable import/first */
mockForgeApi();

import { findMatchingFiles } from './index';
import { listFiles } from '../../client/gitlab';
import { FindMatchingFilesPayload } from './types';
import * as featureFlagService from '../../services/feature-flags';
import { getGroupIds } from 'src/utils/storage-utils';
import { mocked } from 'jest-mock';
import { getProjectDataFromUrl } from '../../services/data-provider-link-parser';
import { generateGitlabProject } from '../../__tests__/helpers/gitlab-helper';

jest.mock('../../client/gitlab');
jest.mock('../../services/feature-flags');
jest.mock('../../services/data-provider-link-parser');

const mockedGetProjectDataFromUrl = mocked(getProjectDataFromUrl);

const mockPayload = {
  repoUrl:
    'https://gitlab.com/gitlab-com/partners/alliance/atlassian/shared-projects/compass-electromagnets-testing/shresta-test-group/first-project-test',
  fileName: {
    containsOneOf: ['file1'],
    equalsOneOf: ['file2'],
  },
} as FindMatchingFilesPayload;

const mockFilesResponse = [
  { id: '1', name: 'file1', type: 'blob', path: 'file/path/file1' },
  { id: '2', name: 'file2', type: 'blob', path: 'file/path/file2' },
  { id: '3', name: 'file3', type: 'blob', path: 'file/path/file3' },
  { id: '4', name: 'file4', type: 'blob', path: 'file/path/file4' },
];

describe('findMatchingFiles', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(featureFlagService, 'isPackageDependenciesM3Enabled').mockReturnValue(true);
    mockedGetProjectDataFromUrl.mockResolvedValue({
      project: generateGitlabProject({ id: 3, name: 'projectName' }),
      groupToken: 'mockToken',
      groupId: 1,
    });
    storage.getSecret.mockResolvedValue('mockToken');
    (listFiles as jest.Mock).mockResolvedValue(mockFilesResponse);
  });

  it('should only return files that match the file names given', async () => {
    const result = await findMatchingFiles(mockPayload);

    expect(result).toEqual({
      success: true,
      files: [
        { path: 'file/path/file1', metadata: {} },
        { path: 'file/path/file2', metadata: {} },
      ],
      statusCode: 200,
    });
  });

  it('should return a successful empty list of files if no files match the file names given', async () => {
    const result = await findMatchingFiles({
      repoUrl:
        'https://gitlab.com/gitlab-com/partners/alliance/atlassian/shared-projects/compass-electromagnets-testing/shresta-test-group/first-project-test',
      fileName: {
        containsOneOf: ['blahblahblah'],
        equalsOneOf: ['blahblahblah'],
      },
    } as FindMatchingFilesPayload);

    expect(result).toEqual({
      success: true,
      files: [],
      statusCode: 200,
    });
  });

  it('should return 400 if no file names are provided', async () => {
    const result = await findMatchingFiles({
      repoUrl: mockPayload.repoUrl,
      fileName: { containsOneOf: [], equalsOneOf: [] },
      context: {
        cloudId: 'cloudId',
        extensionId: 'extensionId',
      },
    });

    expect(result).toEqual({
      success: false,
      errorMessage: 'No file names provided.',
      statusCode: 400,
      files: [],
    });
  });

  it('should return 400 if the url is invalid', async () => {
    // This parsing function will catch the error and return null
    mockedGetProjectDataFromUrl.mockResolvedValue(null);

    const result = await findMatchingFiles({
      repoUrl: 'invalid-url',
      fileName: mockPayload.fileName,
      context: {
        cloudId: 'cloudId',
        extensionId: 'extensionId',
      },
    });

    expect(result).toEqual({
      success: false,
      errorMessage: 'Error parsing repository URL.',
      statusCode: 400,
      files: [],
    });
  });

  it('should return 405 if the feature is not enabled', async () => {
    jest.spyOn(featureFlagService, 'isPackageDependenciesM3Enabled').mockReturnValue(false);

    const result = await findMatchingFiles(mockPayload);

    expect(result).toEqual({
      success: false,
      errorMessage: 'Feature not implemented.',
      statusCode: 405,
      files: [],
    });
  });
});
