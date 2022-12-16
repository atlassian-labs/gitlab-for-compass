/* eslint-disable import/first, import/order */
import { mockAgg } from '../__tests__/helpers/mock-agg';

mockAgg();

import { CompassDeploymentEventEnvironmentCategory, CompassDeploymentEventState } from '@atlassian/forge-graphql';
import {
  gitLabStateToCompassFormat,
  gitlabApiDeploymentToCompassDeploymentEvent,
  gitlabAPiDeploymentToCompassDataProviderDeploymentEvent,
} from './deployment';
import { Deployment, EnvironmentTier } from '../types';
import { MOCK_CLOUD_ID } from '../__tests__/fixtures/gitlab-data';

const mockDeployment: Deployment = {
  id: 12345,
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
    name: 'name',
    id: 123,
  },
  status: 'string',
};

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
              category: EnvironmentTier.PRODUCTION.toUpperCase() as CompassDeploymentEventEnvironmentCategory,
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
    const deploymentInput = gitlabAPiDeploymentToCompassDataProviderDeploymentEvent(mockDeployment, mockProjectName);

    const { deployable, environment, id, updated_at: updatedAt } = mockDeployment;

    const expectedResult = {
      environment: {
        category: EnvironmentTier.PRODUCTION.toUpperCase() as CompassDeploymentEventEnvironmentCategory,
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
});
