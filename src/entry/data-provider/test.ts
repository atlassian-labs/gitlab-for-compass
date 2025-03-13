/* eslint-disable import/first, import/order */
import { mockAgg } from '../../__tests__/helpers/mock-agg';
import { CompassEventType, DataProviderResult, InvocationStatusCode } from '@atlassian/forge-graphql';
import { dataProvider } from './index';
import * as getBackfillEvents from '../../services/get-backfill-data';
import * as getProjectDataFromUrl from '../../services/data-provider-link-parser';
import * as getTrackingBranchName from '../../services/get-tracking-branch';
import { GitlabAPIProject } from '../../types';
import { GitlabHttpMethodError } from '../../models/errors';
import * as featureFlagService from '../../services/feature-flags';
import { MOCK_BACKFILL_RESPONSE, MOCK_EMPTY_BACKFILL_RESPONSE } from '../../services/__mocks__/mocks';

mockAgg();

const getEventsSpy = jest.spyOn(getBackfillEvents, 'getBackfillData');
const projectDataSpy = jest.spyOn(getProjectDataFromUrl, 'getProjectDataFromUrl');
const trackingBranchSpy = jest.spyOn(getTrackingBranchName, 'getTrackingBranchName');

const MOCK_PROJECT_URL = 'https://gitlab.com/test/repo-name?testParam=test';
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
    jest.spyOn(featureFlagService, 'isCompassPushEventEnabled').mockReturnValue(true);
    getEventsSpy.mockResolvedValue(MOCK_BACKFILL_RESPONSE);
    projectDataSpy.mockResolvedValue({
      project: MOCK_PROJECT,
      groupToken: 'mock-group-token',
      groupId: 123,
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
    expect(dataProviderResult.events.pushes).toEqual({
      initialValues: null,
    });
  });

  it('successfully returns empty events when backfill response is empty', async () => {
    jest.spyOn(featureFlagService, 'isCompassPushEventEnabled').mockReturnValue(true);
    getEventsSpy.mockResolvedValue(MOCK_EMPTY_BACKFILL_RESPONSE);
    projectDataSpy.mockResolvedValue({
      project: MOCK_PROJECT,
      groupToken: 'mock-group-token',
      groupId: 123,
    });

    trackingBranchSpy.mockResolvedValue('branch');

    const result = await dataProvider({
      url: MOCK_PROJECT_URL,
      ctx: {
        cloudId: 'ari:cloud:compass:122345:component/12345/12345',
        extensionId: 'mock-extension-id',
      },
      options: {
        eventTypes: [CompassEventType.Push],
      },
    });

    const dataProviderResult = result as DataProviderResult;

    expect(dataProviderResult.externalSourceId).toEqual(MOCK_PROJECT.id.toString());
    expect(dataProviderResult.events).toEqual({
      pushes: {
        initialValues: null,
      },
      deployments: {
        initialValues: null,
      },
      builds: {
        initialValues: null,
      },
    });
  });

  it('when FF isCompassPushEventEnabled is false, push eventType is not returned', async () => {
    jest.spyOn(featureFlagService, 'isCompassPushEventEnabled').mockReturnValue(false);
    getEventsSpy.mockResolvedValue(MOCK_BACKFILL_RESPONSE);
    projectDataSpy.mockResolvedValue({
      project: MOCK_PROJECT,
      groupToken: 'mock-group-token',
      groupId: 123,
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
    expect(dataProviderResult.events.pushes).toBeUndefined();
  });

  it('returns error from ForgeInvokationErrorResponse class in case of invocation error from getBackfillData', async () => {
    const error = 'Internal server error';

    getEventsSpy.mockRejectedValue(new GitlabHttpMethodError(InvocationStatusCode.INTERNAL_SERVER_ERROR, error));
    projectDataSpy.mockResolvedValue({
      project: MOCK_PROJECT,
      groupToken: 'mock-group-token',
      groupId: 134,
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
