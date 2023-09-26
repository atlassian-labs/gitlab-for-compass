/* eslint-disable import/first, import/order */
import { mockAgg } from '../../__tests__/helpers/mock-agg';

mockAgg();

import {
  DataProviderBuildEvent,
  DataProviderDeploymentEvent,
  CompassBuildEventState,
  CompassDeploymentEventEnvironmentCategory,
  CompassDeploymentEventState,
  DataProviderResult,
  InvocationStatusCode,
} from '@atlassian/forge-graphql';
import { dataProvider } from './index';
import * as getBackfillEvents from '../../services/get-backfill-data';
import * as getProjectDataFromUrl from '../../services/data-provider-link-parser';
import * as getTrackingBranchName from '../../services/get-tracking-branch';
import { GitlabAPIProject } from '../../types';
import { GitlabHttpMethodError } from '../../models/errors';

const getEventsSpy = jest.spyOn(getBackfillEvents, 'getBackfillData');
const projectDataSpy = jest.spyOn(getProjectDataFromUrl, 'getProjectDataFromUrl');
const trackingBranchSpy = jest.spyOn(getTrackingBranchName, 'getTrackingBranchName');

const MOCK_BUILD_EVENT: DataProviderBuildEvent = {
  pipeline: {
    pipelineId: 'pipeline-id',
  },
  startedAt: 'started-at',
  completedAt: 'completed-at',
  state: CompassBuildEventState.Successful,
  description: 'mock description',
  displayName: 'mock display name',
  updateSequenceNumber: 1,
  lastUpdated: 'updated',
  url: 'url',
};

export const MOCK_DEPLOY_EVENT: DataProviderDeploymentEvent = {
  displayName: 'name',
  lastUpdated: 'mock',
  updateSequenceNumber: '1',
  url: 'url',
  environment: {
    category: CompassDeploymentEventEnvironmentCategory.Production,
    displayName: 'prod',
    environmentId: 'id',
  },
  pipeline: { pipelineId: '1', displayName: 'pipeline', url: 'url' },
  sequenceNumber: 1,
  state: CompassDeploymentEventState.Successful,
};

const MOCK_EVENTS_RESPONSE: {
  builds: DataProviderBuildEvent[];
  deployments: DataProviderDeploymentEvent[];
  metrics: {
    mrCycleTime: number;
    buildDuration: number;
    openMergeRequestsCount: number;
  };
} = {
  builds: [MOCK_BUILD_EVENT],
  deployments: [MOCK_DEPLOY_EVENT],
  metrics: {
    mrCycleTime: 1,
    buildDuration: 2,
    openMergeRequestsCount: 3,
  },
};
const MOCK_BASE_URL = 'https://gitlab.com/test/repo-name?testParam=test';
const MOCK_PROJECT_URL = `${MOCK_BASE_URL}/test/repo-name?testParam=test`;
const MOCK_PROJECT: GitlabAPIProject = {
  id: 1,
  description: 'description',
  name: 'name',
  topics: ['topic'],
  default_branch: 'main',
  web_url: 'web_url',
  namespace: {
    id: 2,
    full_path: 'full_path',
    name: 'name',
    path: 'path',
  },
  created_at: 'abc',
};

describe('dataProvider module', () => {
  it('successfully returns events and metrics in the expected format', async () => {
    getEventsSpy.mockResolvedValue(MOCK_EVENTS_RESPONSE);
    projectDataSpy.mockResolvedValue({
      project: MOCK_PROJECT,
      baseUrl: MOCK_BASE_URL,
      groupToken: 'mock-group-token',
    });

    trackingBranchSpy.mockResolvedValue('branch');

    const result = await dataProvider({
      url: MOCK_PROJECT_URL,
      ctx: {
        cloudId: 'ari:cloud:compass:122345:component/12345/12345',
        extensionId: 'mock-extension-id',
      },
    });

    const dataProviderResult = result as DataProviderResult;

    expect(dataProviderResult.externalSourceId).toEqual(MOCK_PROJECT.id.toString());
    expect(dataProviderResult.metrics).toMatchSnapshot();
    expect(dataProviderResult.events).toMatchSnapshot();
  });

  it('returns error from ForgeInvokationErrorResponse class in case of invocation error from getBackfillData', async () => {
    const error = 'Internal server error';

    getEventsSpy.mockRejectedValue(new GitlabHttpMethodError(InvocationStatusCode.INTERNAL_SERVER_ERROR, error));
    projectDataSpy.mockResolvedValue({
      baseUrl: MOCK_BASE_URL,
      project: MOCK_PROJECT,
      groupToken: 'mock-group-token',
    });

    trackingBranchSpy.mockResolvedValue('branch');

    const result = await dataProvider({
      url: MOCK_PROJECT_URL,
      ctx: {
        cloudId: 'ari:cloud:compass:122345:component/12345/12345',
        extensionId: 'mock-extension-id',
      },
    });

    expect(result).toEqual({
      error,
      statusCode: InvocationStatusCode.INTERNAL_SERVER_ERROR,
      options: { backoffTimeInSeconds: 3600 },
    });
  });
});
