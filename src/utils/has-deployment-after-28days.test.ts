import { hasDeploymentAfter28Days } from './has-deployment-after-28days';
import * as gitlabClient from '../client/gitlab';
import * as timeUtils from './time-utils';
import * as constants from '../constants';
import * as deploymentService from '../services/deployment';

jest.mock('../client/gitlab');
jest.mock('./time-utils');
jest.mock('../constants');
jest.mock('../services/deployment');

describe('hasDeploymentAfter28Days', () => {
  const mockProjectId = 123;
  const mockGroupToken = 'token';
  const mockDateBefore = '2023-01-01T00:00:00Z';
  const mockDateAfter = '2022-12-01T00:00:00Z';

  beforeEach(() => {
    jest.clearAllMocks();
    (constants.DAYS_TO_CALC as unknown as number) = 28;
    (timeUtils.getDateInThePast as jest.Mock).mockReturnValue(mockDateBefore);
    (gitlabClient.getProjectById as jest.Mock).mockResolvedValue({ created_at: mockDateAfter });
  });

  it('calls dependencies with correct arguments', async () => {
    (deploymentService.getDeploymentAfter28Days as jest.Mock).mockResolvedValue([{}]);

    await hasDeploymentAfter28Days(mockProjectId, mockGroupToken);

    expect(timeUtils.getDateInThePast).toHaveBeenCalledWith(29);
    expect(gitlabClient.getProjectById).toHaveBeenCalledWith(mockGroupToken, mockProjectId);
    expect(deploymentService.getDeploymentAfter28Days).toHaveBeenCalledWith(
      mockGroupToken,
      mockProjectId,
      mockDateAfter,
      mockDateBefore,
    );
  });

  it('returns true if deployments are found', async () => {
    (deploymentService.getDeploymentAfter28Days as jest.Mock).mockResolvedValue([{ id: 1 }]);
    const result = await hasDeploymentAfter28Days(mockProjectId, mockGroupToken);
    expect(result).toBe(true);
  });

  it('returns false if no deployments are found', async () => {
    (deploymentService.getDeploymentAfter28Days as jest.Mock).mockResolvedValue([]);
    const result = await hasDeploymentAfter28Days(mockProjectId, mockGroupToken);
    expect(result).toBe(false);
  });

  it('throws if getProjectById throws', async () => {
    (gitlabClient.getProjectById as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(hasDeploymentAfter28Days(mockProjectId, mockGroupToken)).rejects.toThrow('fail');
  });

  it('throws if getDeploymentAfter28Days throws', async () => {
    (deploymentService.getDeploymentAfter28Days as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(hasDeploymentAfter28Days(mockProjectId, mockGroupToken)).rejects.toThrow('fail');
  });

  it('handles missing created_at in getProjectById result', async () => {
    (gitlabClient.getProjectById as jest.Mock).mockResolvedValue({});
    (deploymentService.getDeploymentAfter28Days as jest.Mock).mockResolvedValue([]);
    // Should pass created_at as undefined
    await hasDeploymentAfter28Days(mockProjectId, mockGroupToken);
    expect(deploymentService.getDeploymentAfter28Days).toHaveBeenCalledWith(
      mockGroupToken,
      mockProjectId,
      undefined,
      mockDateBefore,
    );
  });
});
