/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../../__tests__/helpers/forge-helper';

mockForgeApi();

import { generateEnvironmentEvent } from '../../__tests__/helpers/gitlab-helper';
import { getProjectEnvironments } from '../environment';
import { Deployment, EnvironmentTier } from '../../types';
import { getRecentDeployments, gitlabAPiDeploymentToCompassDataProviderDeploymentEvent } from '../deployment';
import { getDeploymentsForEnvironmentTiers } from './index';
import * as featureFlagService from '../feature-flags';

jest.mock('../environment');
jest.mock('../deployment');

const mockedGetProjectEnvironments = mocked(getProjectEnvironments);
const mockedGetRecentDeployments = mocked(getRecentDeployments);
const mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent = mocked(
  gitlabAPiDeploymentToCompassDataProviderDeploymentEvent,
);

const getMockDeployment = (id = 1, environmentName = 'production'): Deployment => ({
  id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deployable: {
    status: 'CREATED',
    finished_at: 'finished_at',
    pipeline: {
      id: 123,
      web_url: 'https://www.google.com/',
    },
  },
  environment: {
    name: environmentName,
    id: 123,
  },
  status: 'string',
});

describe('getDeploymentsForEnvironmentTiers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns deployment events for Production by default', async () => {
    mockedGetProjectEnvironments.mockResolvedValue([generateEnvironmentEvent()]);

    const mockDeployment = getMockDeployment();
    mockedGetRecentDeployments.mockResolvedValue([mockDeployment]);

    await getDeploymentsForEnvironmentTiers('groupToken', 1, 'projectName');

    expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).toHaveBeenCalledTimes(1);
    expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).toHaveBeenCalledWith(
      mockDeployment,
      'projectName',
      EnvironmentTier.PRODUCTION,
    );
  });

  it('ignores non-Production events', async () => {
    mockedGetProjectEnvironments.mockResolvedValue([generateEnvironmentEvent(EnvironmentTier.STAGING)]);

    await getDeploymentsForEnvironmentTiers('groupToken', 1, 'projectName');

    expect(mockedGetRecentDeployments).not.toHaveBeenCalled();
    expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).not.toHaveBeenCalled();
  });

  describe('when isSendStagingEventsEnabled', () => {
    beforeEach(() => {
      jest.spyOn(featureFlagService, 'isSendStagingEventsEnabled').mockReturnValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns deployment events for all provided environments', async () => {
      mockedGetProjectEnvironments.mockResolvedValue([
        generateEnvironmentEvent(EnvironmentTier.PRODUCTION, 'productionEnvName'),
        generateEnvironmentEvent(EnvironmentTier.STAGING, 'stagingEnvName'),
      ]);

      const mockDeployment1 = getMockDeployment(1, 'productionEnvName');
      const mockDeployment2 = getMockDeployment(2, 'stagingEnvName');
      const mockDeployment3 = getMockDeployment(3, 'stagingEnvName');

      mockedGetRecentDeployments.mockImplementation((groupToken, projectId, dateAfter, environmentName) => {
        if (environmentName === 'productionEnvName') {
          return new Promise((resolve) => {
            resolve([mockDeployment1]);
          });
        }
        if (environmentName === 'stagingEnvName') {
          return new Promise((resolve) => {
            resolve([mockDeployment2, mockDeployment3]);
          });
        }
        return null;
      });

      await getDeploymentsForEnvironmentTiers('groupToken', 1, 'projectName', [
        EnvironmentTier.PRODUCTION,
        EnvironmentTier.STAGING,
      ]);

      expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).toHaveBeenCalledTimes(3);
      expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent.mock.calls).toEqual([
        [mockDeployment1, 'projectName', EnvironmentTier.PRODUCTION],
        [mockDeployment2, 'projectName', EnvironmentTier.STAGING],
        [mockDeployment3, 'projectName', EnvironmentTier.STAGING],
      ]);
    });

    it('ignores deployments from environments that are not provided', async () => {
      mockedGetProjectEnvironments.mockResolvedValue([
        generateEnvironmentEvent(EnvironmentTier.TESTING, 'testingEnvName'),
        generateEnvironmentEvent(EnvironmentTier.DEVELOPMENT, 'developmentEnvName'),
        generateEnvironmentEvent(EnvironmentTier.OTHER, 'otherEnvName'),
      ]);

      await getDeploymentsForEnvironmentTiers('groupToken', 1, 'projectName', [
        EnvironmentTier.PRODUCTION,
        EnvironmentTier.STAGING,
      ]);

      expect(mockedGetRecentDeployments).not.toHaveBeenCalled();
      expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).not.toHaveBeenCalled();
    });
  });
});
