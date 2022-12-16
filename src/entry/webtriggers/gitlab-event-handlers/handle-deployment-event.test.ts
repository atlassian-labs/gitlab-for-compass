/* eslint-disable import/first, import/order */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../../../__tests__/helpers/forge-helper';

mockForgeApi();

import {
  CompassCreateEventInput,
  CompassDeploymentEventEnvironmentCategory,
  CompassDeploymentEventState,
} from '@atlassian/forge-graphql';
import { generateDeploymentEvent, generateEnvironmentEvent } from '../../../__tests__/helpers/gitlab-helper';
import { MOCK_CLOUD_ID, TEST_TOKEN } from '../../../__tests__/fixtures/gitlab-data';
import { getEnvironments } from '../../../client/gitlab';
import { getDeployment, getRecentDeployments } from '../../../services/deployment';
import { sendEventToCompass } from '../../../services/send-compass-events';
import { createMockDeployment } from '../../../__tests__/fixtures/successful-deployment-payload';
import { insertMetricValues } from '../../../services/insert-metric-values';
import { handleDeploymentEvent } from './handle-deployment-event';
import { EnvironmentTier } from '../../../types';
import { hasDeploymentAfter28Days } from '../../../utils/has-deployment-after-28days';

jest.mock('../../../services/send-compass-events');
jest.mock('../../../services/deployment', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/ban-types
    ...(jest.requireActual('../../../services/deployment') as {}),
    getDeployment: jest.fn(),
    getRecentDeployments: jest.fn(),
  };
});
jest.mock('../../../client/compass');
jest.mock('../../../client/gitlab');
jest.mock('../../../services/insert-metric-values');
jest.mock('../../../utils/has-deployment-after-28days');

const mockedGetEnvironments = mocked(getEnvironments);
const mockedGetDeployment = mocked(getDeployment);
const mockedSendEventsToCompass = mocked(sendEventToCompass);
const mockedGetRecentDeployments = mocked(getRecentDeployments);
const mockedInsertMetricValues = mocked(insertMetricValues);
const mockedHasDeploymentAfter28Days = mocked(hasDeploymentAfter28Days);

const MOCK_DEPLOYMENT_EVENT = generateDeploymentEvent();
const MOCK_ENVIRONMENTS_EVENT = generateEnvironmentEvent();
const PROJECT_ID = 123;
const MOCK_DATE = Date.parse('2022-01-29T01:15:42.960Z');

const MOCK_DEPLOYMENT_EVENT_INPUT: CompassCreateEventInput = {
  cloudId: MOCK_CLOUD_ID,
  event: {
    deployment: {
      description: 'description',
      displayName: 'production',
      deploymentProperties: {
        environment: {
          category: 'PRODUCTION' as CompassDeploymentEventEnvironmentCategory,
          displayName: 'production',
          environmentId: '123',
        },
        pipeline: {
          pipelineId: '123',
          url: 'https://test',
          displayName: 'production pipeline',
        },
        state: CompassDeploymentEventState.Successful,
        sequenceNumber: 134,
      },
      externalEventSourceId: PROJECT_ID.toString(),
      lastUpdated: expect.anything(),
      updateSequenceNumber: expect.anything(),
      url: 'https://example',
    },
  },
};

const MOCK_DEPLOYMENT = createMockDeployment(1);
const MOCK_RECENT_DEPLOYMENTS = {
  deployments: [MOCK_DEPLOYMENT],
  headers: {
    get: jest.fn().mockResolvedValue('x-total'),
  } as unknown as Headers,
};

describe('GitLab deployment event', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const dateNowStub = jest.fn(() => MOCK_DATE);
    global.Date.now = dateNowStub;
  });

  it('sends deployment event successfully and does not send metric value', async () => {
    mockedGetEnvironments.mockResolvedValue([MOCK_ENVIRONMENTS_EVENT]);
    mockedGetDeployment.mockResolvedValue(MOCK_DEPLOYMENT_EVENT_INPUT);
    mockedGetRecentDeployments.mockResolvedValue(MOCK_RECENT_DEPLOYMENTS.deployments);
    mockedHasDeploymentAfter28Days.mockResolvedValue(false);

    await handleDeploymentEvent(MOCK_DEPLOYMENT_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(mockedSendEventsToCompass).toHaveBeenCalledWith(MOCK_DEPLOYMENT_EVENT_INPUT);
    expect(mockedInsertMetricValues).not.toHaveBeenCalled();
  });

  it('do not send deployment event when environment is not production', async () => {
    const MOCK_STAGING_ENVIRONMENTS_EVENT = generateEnvironmentEvent(EnvironmentTier.STAGING);
    mockedGetEnvironments.mockResolvedValue([MOCK_STAGING_ENVIRONMENTS_EVENT]);

    await handleDeploymentEvent(MOCK_DEPLOYMENT_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(mockedSendEventsToCompass).not.toHaveBeenCalled();
  });
});
