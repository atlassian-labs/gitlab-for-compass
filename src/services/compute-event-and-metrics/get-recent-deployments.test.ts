/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { CompassDeploymentEventEnvironmentCategory, CompassDeploymentEventState } from '@atlassian/forge-graphql';
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

const mockDeploymentWithoutDeployable = () => ({
  id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  environment: {
    name: 'production',
    id: 123,
  },
  status: 'string',
});

describe('getDeploymentsForEnvironmentTiers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns deployment events for Production by default', async () => {
    const mockDeployment = getMockDeployment();
    const { deployable, environment, id, updated_at: updatedAt } = mockDeployment;
    const expectedResult = {
      environment: {
        category: CompassDeploymentEventEnvironmentCategory.Production,
        displayName: environment.name,
        environmentId: environment.id.toString(),
      },
      pipeline: {
        displayName: `projectName pipeline`,
        pipelineId: deployable.pipeline.id.toString(),
        url: deployable.pipeline.web_url,
      },
      sequenceNumber: id,
      state: CompassDeploymentEventState.Pending,
      description: `projectName deployment`,
      displayName: `projectName deployment ${id}`,
      lastUpdated: updatedAt,
      updateSequenceNumber: expect.anything(),
      url: deployable.pipeline.web_url,
    };
    mockedGetProjectEnvironments.mockResolvedValue([generateEnvironmentEvent()]);
    mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent.mockReturnValue(expectedResult);
    mockedGetRecentDeployments.mockResolvedValue([mockDeployment]);

    const deployments = await getDeploymentsForEnvironmentTiers('groupToken', 1, 'projectName');

    expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).toHaveBeenCalledTimes(1);
    expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).toHaveBeenCalledWith(
      mockDeployment,
      'projectName',
      EnvironmentTier.PRODUCTION,
    );
    expect(deployments).toHaveLength(1);
  });

  it('ignores non-Production events', async () => {
    mockedGetProjectEnvironments.mockResolvedValue([generateEnvironmentEvent(EnvironmentTier.STAGING)]);

    const deployments = await getDeploymentsForEnvironmentTiers('groupToken', 1, 'projectName');

    expect(mockedGetRecentDeployments).not.toHaveBeenCalled();
    expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).not.toHaveBeenCalled();
    expect(deployments).toHaveLength(0);
  });

  it('ignores null events from when deployment event mapping returns null', async () => {
    mockedGetProjectEnvironments.mockResolvedValue([generateEnvironmentEvent()]);

    const mockDeployment = mockDeploymentWithoutDeployable();
    mockedGetRecentDeployments.mockResolvedValue([mockDeployment]);
    mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent.mockReturnValue(null);

    const deployments = await getDeploymentsForEnvironmentTiers('groupToken', 1, 'projectName');
    expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).toHaveBeenCalledTimes(1);
    expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).toHaveBeenCalledWith(
      mockDeployment,
      'projectName',
      EnvironmentTier.PRODUCTION,
    );

    expect(deployments).toHaveLength(0);
  });

  describe('when isSendStagingEventsEnabled', () => {
    beforeEach(() => {
      jest.spyOn(featureFlagService, 'isSendStagingEventsEnabled').mockReturnValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns deployment events for all provided environments', async () => {
      const mockDeployment = getMockDeployment();
      const { deployable, environment, id, updated_at: updatedAt } = mockDeployment;
      const expectedResult = {
        environment: {
          category: CompassDeploymentEventEnvironmentCategory.Production,
          displayName: environment.name,
          environmentId: environment.id.toString(),
        },
        pipeline: {
          displayName: `projectName pipeline`,
          pipelineId: deployable.pipeline.id.toString(),
          url: deployable.pipeline.web_url,
        },
        sequenceNumber: id,
        state: CompassDeploymentEventState.Pending,
        description: `projectName deployment`,
        displayName: `projectName deployment ${id}`,
        lastUpdated: updatedAt,
        updateSequenceNumber: expect.anything(),
        url: deployable.pipeline.web_url,
      };
      mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent.mockReturnValue(expectedResult);

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

      const deployments = await getDeploymentsForEnvironmentTiers('groupToken', 1, 'projectName', [
        EnvironmentTier.PRODUCTION,
        EnvironmentTier.STAGING,
      ]);

      expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).toHaveBeenCalledTimes(3);
      expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent.mock.calls).toEqual([
        [mockDeployment1, 'projectName', EnvironmentTier.PRODUCTION],
        [mockDeployment2, 'projectName', EnvironmentTier.STAGING],
        [mockDeployment3, 'projectName', EnvironmentTier.STAGING],
      ]);
      expect(deployments).toHaveLength(3);
    });

    it('ignores deployments from environments that are not provided', async () => {
      mockedGetProjectEnvironments.mockResolvedValue([
        generateEnvironmentEvent(EnvironmentTier.TESTING, 'testingEnvName'),
        generateEnvironmentEvent(EnvironmentTier.DEVELOPMENT, 'developmentEnvName'),
        generateEnvironmentEvent(EnvironmentTier.OTHER, 'otherEnvName'),
      ]);

      const deployments = await getDeploymentsForEnvironmentTiers('groupToken', 1, 'projectName', [
        EnvironmentTier.PRODUCTION,
        EnvironmentTier.STAGING,
      ]);

      expect(mockedGetRecentDeployments).not.toHaveBeenCalled();
      expect(mockedGitlabAPiDeploymentToCompassDataProviderDeploymentEvent).not.toHaveBeenCalled();
      expect(deployments).toHaveLength(0);
    });
  });
});
