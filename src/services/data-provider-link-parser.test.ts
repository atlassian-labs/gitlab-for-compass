/* eslint-disable import/order, import/first */
import { storage, mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { mocked } from 'jest-mock';
import { generateGitlabProject } from '../__tests__/helpers/gitlab-helper';
import { getMaintainedProjectsBySearchCriteria } from '../client/gitlab';
import { extractProjectInformation, getProjectDataFromUrl } from './data-provider-link-parser';
import { getGroupIds } from '../utils/storage-utils';

jest.mock('../client/gitlab');
jest.mock('../utils/storage-utils');

const mockedGetOwnedProjectsBySearchCriteria = mocked(getMaintainedProjectsBySearchCriteria);
const mockedGetGroupIds = mocked(getGroupIds);

const mockProjectUrl = 'https://gitlab.com/test/repo-name?testParam=test';
const testToken1 = 'token1';
const testToken2 = 'token2';
const projectName1 = 'project1';
const projectName1Deleted = 'project1-deleted';
const projectName2 = 'project2';
const projectName3 = 'project3';
const projectName4 = 'project4';

describe('data-provider-link-parser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract project information from the url', () => {
    const result = extractProjectInformation(mockProjectUrl);

    const expectedResult = {
      projectName: 'repo-name',
      pathName: '/test/repo-name',
    };

    expect(result).toEqual(expectedResult);
  });

  it('should throw error if link is not a Gitlab url', () => {
    const mockWrongProjectUrl = 'https://bitbucket.org/test/repo-name?testParam=test';

    const funcWrapper = () => extractProjectInformation(mockWrongProjectUrl);

    const expectedError = new Error('Provided link is not Gitlab url');

    expect(funcWrapper).toThrow(expectedError);
  });

  it('should get project data from URL', async () => {
    const expectedProjectData = generateGitlabProject({ id: 4, name: projectName4, web_url: mockProjectUrl });

    mockedGetGroupIds.mockResolvedValue([1, 2]);

    storage.getSecret.mockResolvedValueOnce(testToken1);
    storage.getSecret.mockResolvedValueOnce(testToken2);

    mockedGetOwnedProjectsBySearchCriteria.mockResolvedValueOnce([
      generateGitlabProject({ id: 1, name: projectName1 }),
      generateGitlabProject({ id: 2, name: projectName2 }),
    ]);
    mockedGetOwnedProjectsBySearchCriteria.mockResolvedValueOnce([
      generateGitlabProject({ id: 3, name: projectName3 }),
      expectedProjectData,
    ]);

    const result = await getProjectDataFromUrl(mockProjectUrl);

    const expectedResult = { project: expectedProjectData, groupToken: testToken2 };

    expect(result).toEqual(expectedResult);
  });

  it('should match url on both path and name', async () => {
    const expectedProjectData = generateGitlabProject({
      id: 1,
      name: projectName1,
      web_url: 'https://gitlab.com/test/repo-name',
    });
    mockedGetGroupIds.mockResolvedValue([1]);
    storage.getSecret.mockResolvedValueOnce(testToken1);

    mockedGetOwnedProjectsBySearchCriteria.mockResolvedValueOnce([
      generateGitlabProject({ id: 2, name: projectName1Deleted, web_url: 'https://gitlab.com/test/repo-name-deleted' }),
      expectedProjectData,
    ]);

    const result = await getProjectDataFromUrl(mockProjectUrl);
    const expectedResult = { project: expectedProjectData, groupToken: testToken1 };
    expect(result).toEqual(expectedResult);
  });

  it('should return null if project not found', async () => {
    mockedGetGroupIds.mockResolvedValue([1, 2]);

    storage.getSecret.mockResolvedValueOnce(testToken1);
    storage.getSecret.mockResolvedValueOnce(testToken2);

    mockedGetOwnedProjectsBySearchCriteria.mockResolvedValueOnce([
      generateGitlabProject({ id: 1, name: projectName1 }),
      generateGitlabProject({ id: 2, name: projectName2 }),
    ]);
    mockedGetOwnedProjectsBySearchCriteria.mockResolvedValueOnce([
      generateGitlabProject({ id: 3, name: projectName3 }),
      generateGitlabProject({ id: 4, name: projectName4 }),
    ]);

    const result = await getProjectDataFromUrl(mockProjectUrl);

    expect(result).toBeNull();
  });

  it('should return null if groupToken not found', async () => {
    mockedGetGroupIds.mockResolvedValue([]);
    const result = await getProjectDataFromUrl(mockProjectUrl);

    expect(result).toBeNull();
  });
});
