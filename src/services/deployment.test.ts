/* eslint-disable import/first, import/order */
import { mockAgg } from '../__tests__/helpers/mock-agg';

mockAgg();

import { CompassDeploymentEventEnvironmentCategory, CompassDeploymentEventState } from '@atlassian/forge-graphql';
import {
  gitLabStateToCompassFormat,
  gitlabApiDeploymentToCompassDeploymentEvent,
  gitlabAPiDeploymentToCompassDataProviderDeploymentEvent,
  mapEnvTierToCompassDeploymentEnv,
  getDeploymentAfter28Days,
} from './deployment';
import { EnvironmentTier } from '../types';
import { MOCK_CLOUD_ID } from '../__tests__/fixtures/gitlab-data';
import { mocked } from 'jest-mock';
import { getEnvironments, getProjectRecentDeployments } from '../client/gitlab';
import { generateDeployment, generateEnvironmentEvent } from '../__tests__/helpers/gitlab-helper';
import * as featureFlagService from './feature-flags';

jest.mock('../client/gitlab');
const mockedGetEnvironments = mocked(getEnvironments);
const mockedGetProjectRecentDeployments = mocked(getProjectRecentDeployments);

const mockDeployment = generateDeployment();
const mockProjectName = 'projectName';

describe('deployment', () => {
  it('should map gitlab deployment state to compass format', async () => {
    expect(gitLabStateToCompassFormat('CREATED')).toBe(CompassDeploymentEventState.Pending);
    expect(gitLabStateToCompassFormat('BLOCKED')).toBe(CompassDeploymentEventState.Pending);
    expect(gitLabStateToCompassFormat('SUCCESS')).toBe(CompassDeploymentEventState.Successful);
    expect(gitLabStateToCompassFormat('RUNNING')).toBe(CompassDeploymentEventState.InProgress);
    expect(gitLabStateToCompassFormat('FAILED')).toBe(CompassDeploymentEventState.Failed);
    expect(gitLabStateToCompassFormat('CANCELED')).toBe(CompassDeploymentEventState.Cancelled);
    expect(gitLabStateToCompassFormat('Not valid state')).toBe(CompassDeploymentEventState.Unknown);
  });

  it('should create valid compass deployment input', async () => {
    const mockProjectId = 12345;

    const deploymentInput = gitlabApiDeploymentToCompassDeploymentEvent(
      mockDeployment,
      mockProjectId,
      mockProjectName,
      EnvironmentTier.PRODUCTION,
      MOCK_CLOUD_ID,
    );

    const expectedResult = {
      cloudId: MOCK_CLOUD_ID,
      event: {
        deployment: {
          externalEventSourceId: mockProjectId.toString(),
          lastUpdated: expect.anything(),
          updateSequenceNumber: expect.anything(),
          displayName: `${mockProjectName} deployment ${mockDeployment.id}`,
          url: mockDeployment.deployable.pipeline.web_url,
          description: `${mockProjectName} deployment`,
          deploymentProperties: {
            startedAt: mockDeployment.created_at,
            completedAt: null as any,
            pipeline: {
              pipelineId: mockDeployment.deployable.pipeline.id.toString(),
              url: mockDeployment.deployable.pipeline.web_url,
              displayName: `${mockProjectName} pipeline`,
            },
            environment: {
              category: CompassDeploymentEventEnvironmentCategory.Production,
              displayName: mockDeployment.environment.name,
              environmentId: mockDeployment.environment.id.toString(),
            },
            state: gitLabStateToCompassFormat(mockDeployment.deployable.status),
            sequenceNumber: mockDeployment.id,
          },
        },
      },
    };

    expect(deploymentInput).toEqual(expectedResult);
  });

  it('should create valid data provider deployment input', async () => {
    const deploymentInput = gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(
      mockDeployment,
      mockProjectName,
      EnvironmentTier.PRODUCTION,
    );

    const { deployable, environment, id, updated_at: updatedAt } = mockDeployment;

    const expectedResult = {
      environment: {
        category: CompassDeploymentEventEnvironmentCategory.Production,
        displayName: environment.name,
        environmentId: environment.id.toString(),
      },
      pipeline: {
        displayName: `${mockProjectName} pipeline`,
        pipelineId: deployable.pipeline.id.toString(),
        url: deployable.pipeline.web_url,
      },
      sequenceNumber: id,
      state: CompassDeploymentEventState.Pending,
      description: `${mockProjectName} deployment`,
      displayName: `${mockProjectName} deployment ${id}`,
      lastUpdated: updatedAt,
      updateSequenceNumber: expect.anything(),
      url: deployable.pipeline.web_url,
    };

    expect(deploymentInput).toEqual(expectedResult);
  });

  it('should return null when there is an error mapping the event', async () => {
    const mockDeploymentWithNullDeployable = generateDeployment({ deployable: null });

    const deploymentInput = gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(
      mockDeploymentWithNullDeployable,
      mockProjectName,
      EnvironmentTier.PRODUCTION,
    );

    expect(deploymentInput).toEqual(null);
  });
});

describe('mapEnvTierToCompassDeploymentEnv', () => {
  it.each`
    envTier                        | deploymentEventEnvCategory
    ${EnvironmentTier.PRODUCTION}  | ${CompassDeploymentEventEnvironmentCategory.Production}
    ${EnvironmentTier.STAGING}     | ${CompassDeploymentEventEnvironmentCategory.Staging}
    ${EnvironmentTier.DEVELOPMENT} | ${CompassDeploymentEventEnvironmentCategory.Development}
    ${EnvironmentTier.TESTING}     | ${CompassDeploymentEventEnvironmentCategory.Testing}
    ${EnvironmentTier.OTHER}       | ${CompassDeploymentEventEnvironmentCategory.Unmapped}
  `(
    'maps EnvironmentTier: $envTier to the corresponding CompassDeploymentEventEnvironmentCategory: ' +
      '$deploymentEventEnvCategory',
    ({ envTier, deploymentEventEnvCategory }) => {
      expect(mapEnvTierToCompassDeploymentEnv(envTier)).toEqual(deploymentEventEnvCategory);
    },
  );

  it('maps invalid EnvironmentTiers to UNMAPPED environment category', () => {
    expect(mapEnvTierToCompassDeploymentEnv('foobar' as EnvironmentTier)).toEqual(
      CompassDeploymentEventEnvironmentCategory.Unmapped,
    );
  });
});

describe('getDeploymentAfter28Days', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls getProjectRecentDeployments for all production project environments and returns deployment data', async () => {
    mockedGetEnvironments.mockResolvedValue([
      generateEnvironmentEvent(EnvironmentTier.PRODUCTION, 'prod'),
      generateEnvironmentEvent(EnvironmentTier.PRODUCTION, 'production'),
    ]);

    const prodDeployment = generateDeployment({ environment: { name: 'prod', id: 1 } });
    const productionDeployment = generateDeployment({ environment: { name: 'production', id: 2 } });

    mockedGetProjectRecentDeployments.mockImplementation((page, perPage, fetchFnParameters) => {
      return new Promise((resolve) => {
        const data = fetchFnParameters.environmentName === 'prod' ? prodDeployment : productionDeployment;
        resolve({ data: [data], headers: new Headers() });
      });
    });

    expect(await getDeploymentAfter28Days('123', 1, '2021-01-20T00:32:51.059Z', '2022-01-20T00:32:51.059Z')).toEqual([
      prodDeployment,
      productionDeployment,
    ]);
    expect(mockedGetProjectRecentDeployments).toHaveBeenCalledTimes(2);
  });

  it('ignores all non-production project environments', async () => {
    mockedGetEnvironments.mockResolvedValue([
      generateEnvironmentEvent(EnvironmentTier.STAGING, 'staging'),
      generateEnvironmentEvent(EnvironmentTier.TESTING, 'testing'),
      generateEnvironmentEvent(EnvironmentTier.DEVELOPMENT, 'development'),
    ]);

    expect(await getDeploymentAfter28Days('123', 1, '2021-01-20T00:32:51.059Z', '2022-01-20T00:32:51.059Z')).toEqual(
      [],
    );
    expect(mockedGetProjectRecentDeployments).not.toHaveBeenCalled();
  });

  describe('when isSendStagingEventsEnabled', () => {
    beforeEach(() => {
      jest.spyOn(featureFlagService, 'isSendStagingEventsEnabled').mockReturnValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('calls getProjectRecentDeployments for production and staging project environments and returns deployment data', async () => {
      mockedGetEnvironments.mockResolvedValue([
        generateEnvironmentEvent(EnvironmentTier.PRODUCTION, 'production'),
        generateEnvironmentEvent(EnvironmentTier.STAGING, 'staging'),
        generateEnvironmentEvent(EnvironmentTier.STAGING, 'stg'),
      ]);

      const productionDeployment = generateDeployment({ environment: { name: 'production', id: 1 } });
      const stagingDeployment = generateDeployment({ environment: { name: 'staging', id: 2 } });
      const stgDeployment = generateDeployment({ environment: { name: 'stg', id: 3 } });

      mockedGetProjectRecentDeployments.mockImplementation((page, perPage, fetchFnParameters) => {
        const getData = (environmentName: string) => {
          switch (environmentName) {
            case 'production':
              return productionDeployment;
            case 'staging':
              return stagingDeployment;
            case 'stg':
            default:
              return stgDeployment;
          }
        };
        return new Promise((resolve) => {
          resolve({ data: [getData(fetchFnParameters.environmentName)], headers: new Headers() });
        });
      });

      expect(await getDeploymentAfter28Days('123', 1, '2021-01-20T00:32:51.059Z', '2021-01-20T00:32:51.059Z')).toEqual([
        productionDeployment,
        stagingDeployment,
        stgDeployment,
      ]);
      expect(mockedGetProjectRecentDeployments).toHaveBeenCalledTimes(3);
    });

    it('ignores non-production, non-staging environments', async () => {
      mockedGetEnvironments.mockResolvedValue([
        generateEnvironmentEvent(EnvironmentTier.DEVELOPMENT, 'development'),
        generateEnvironmentEvent(EnvironmentTier.TESTING, 'testing'),
        generateEnvironmentEvent(EnvironmentTier.OTHER, 'other'),
      ]);

      expect(await getDeploymentAfter28Days('123', 1, '2021-01-20T00:32:51.059Z', '2021-01-20T00:32:51.059Z')).toEqual(
        [],
      );
      expect(mockedGetProjectRecentDeployments).toHaveBeenCalledTimes(0);
    });
  });
});
