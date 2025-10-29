/* eslint-disable import/order */
import { mockForgeApi } from '../../__tests__/helpers/forge-helper';
/* eslint-disable import/first */
mockForgeApi();

import { getRepoDetails } from './index';
import { getProjectDataFromUrl } from '../../services/data-provider-link-parser';
import { getProjectTrackingBranch } from '../../services/get-tracking-branch';

jest.mock('../../services/data-provider-link-parser');
jest.mock('../../services/get-tracking-branch');

describe('getRepoDetails', () => {
  const mockPayload = {
    projectUrl: 'https://gitlab.com/group/project',
  };

  it('returns project details for a successful request', async () => {
    (getProjectDataFromUrl as jest.Mock).mockResolvedValue({
      project: { id: 1, default_branch: 'main' },
      groupToken: 'mockToken',
      groupId: 123,
    });
    (getProjectTrackingBranch as jest.Mock).mockResolvedValue({
      name: 'main',
      commit: { id: 'commit123' },
    });

    const result = await getRepoDetails(mockPayload);
    expect(result).toEqual({
      success: true,
      project: {
        projectId: 1,
        groupId: 123,
        defaultBranch: 'main',
        shaOnDefaultBranch: 'commit123',
      },
      statusCode: 200,
    });
  });

  it('returns an error message if project data is not found', async () => {
    (getProjectDataFromUrl as jest.Mock).mockResolvedValue(null);

    const result = await getRepoDetails(mockPayload);
    expect(result).toEqual({
      success: false,
      errorMessage: 'project not found',
      statusCode: 404,
    });
  });

  it('returns an error message if branch data is not found', async () => {
    (getProjectDataFromUrl as jest.Mock).mockResolvedValue({
      project: { id: 1, default_branch: 'main' },
      groupToken: 'mockToken',
      groupId: 123,
    });
    (getProjectTrackingBranch as jest.Mock).mockResolvedValue(null);

    const result = await getRepoDetails(mockPayload);
    expect(result).toEqual({
      success: false,
      errorMessage: 'branch not found',
      statusCode: 404,
    });
  });

  it('returns a 500 error message if an unhandled exception is thrown', async () => {
    (getProjectDataFromUrl as jest.Mock).mockRejectedValue(new Error('Request failed'));

    const result = await getRepoDetails(mockPayload);
    expect(result).toEqual({
      success: false,
      errorMessage: 'Request failed',
      statusCode: 500,
    });
  });
});
