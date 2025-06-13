/* eslint-disable import/first, import/order */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../../../__tests__/helpers/forge-helper';

mockForgeApi();

import {
  CompassCreateEventInput,
  CompassDeploymentEventEnvironmentCategory,
  CompassDeploymentEventState,
} from '@atlassian/forge-graphql-types';
import { generateDeploymentEvent, generateEnvironmentEvent } from '../../../__tests__/helpers/gitlab-helper';
import { MOCK_CLOUD_ID, TEST_TOKEN } from '../../../__tests__/fixtures/gitlab-data';
import { getEnvironments } from '../../../client/gitlab';
import { getDeployment } from '../../../services/deployment';
import { sendEventToCompass } from '../../../services/send-compass-events';
import { handleDeploymentEvent } from './handle-deployment-event';
import { EnvironmentTier } from '../../../types';
import * as featureFlagService from '../../../services/feature-flags';

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

jest.spyOn(global.console, 'error').mockImplementation(() => ({}));

const mockedGetEnvironments = mocked(getEnvironments);
const mockedGetDeployment = mocked(getDeployment);
const mockedSendEventsToCompass = mocked(sendEventToCompass);

const MOCK_DEPLOYMENT_EVENT = generateDeploymentEvent();
const MOCK_ENVIRONMENTS_EVENT = generateEnvironmentEvent();
const PROJECT_ID = 123;
const MOCK_DATE = Date.parse('2022-01-29T01:15:42.960Z');
const MOCK_ERROR = new Error('Unexpected Error');

const generateMockDeploymentInput = (
  environment = CompassDeploymentEventEnvironmentCategory.Production,
): CompassCreateEventInput => ({
  cloudId: MOCK_CLOUD_ID,
  event: {
    deployment: {
      description: 'description',
      displayName: 'production',
      deploymentProperties: {
        environment: {
          category: environment,
          displayName: environment.toLowerCase(),
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
});

describe('GitLab deployment event', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    const dateNowStub = jest.fn(() => MOCK_DATE);
    global.Date.now = dateNowStub;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends deployment event successfully', async () => {
    const MOCK_DEPLOYMENT_EVENT_INPUT = generateMockDeploymentInput();

    mockedGetEnvironments.mockResolvedValue([MOCK_ENVIRONMENTS_EVENT]);
    mockedGetDeployment.mockResolvedValue(MOCK_DEPLOYMENT_EVENT_INPUT);

    await handleDeploymentEvent(MOCK_DEPLOYMENT_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(mockedSendEventsToCompass).toHaveBeenCalledWith(MOCK_DEPLOYMENT_EVENT_INPUT);
  });

  it('send deployment event when environment is not production or staging', async () => {
    const MOCK_STAGING_ENVIRONMENTS_EVENT = generateEnvironmentEvent(EnvironmentTier.STAGING);
    const MOCK_DEPLOYMENT_EVENT_INPUT = generateMockDeploymentInput(CompassDeploymentEventEnvironmentCategory.Staging);

    mockedGetEnvironments.mockResolvedValue([MOCK_STAGING_ENVIRONMENTS_EVENT]);
    mockedGetDeployment.mockResolvedValue(MOCK_DEPLOYMENT_EVENT_INPUT);

    await handleDeploymentEvent(MOCK_DEPLOYMENT_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(mockedSendEventsToCompass).toHaveBeenCalledWith(MOCK_DEPLOYMENT_EVENT_INPUT);
  });

  it('throws error when event environment not found in project environments', async () => {
    const MOCK_PRODUCTION_ENVIRONMENT_EVENT = generateEnvironmentEvent(EnvironmentTier.PRODUCTION, 'production');
    const MOCK_PRD_DEPLOYMENT_EVENT = generateDeploymentEvent({ environment: 'prd' });

    mockedGetEnvironments.mockResolvedValue([MOCK_PRODUCTION_ENVIRONMENT_EVENT]);

    await handleDeploymentEvent(MOCK_PRD_DEPLOYMENT_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(console.error).toHaveBeenCalledWith(
      'Error while sending deployment event to Compass',
      new Error('Environment with name "prd" not found'),
    );
  });

  it('failed sending deployment event', async () => {
    const MOCK_DEPLOYMENT_EVENT_INPUT = generateMockDeploymentInput();

    mockedGetEnvironments.mockResolvedValue([MOCK_ENVIRONMENTS_EVENT]);
    mockedGetDeployment.mockResolvedValue(MOCK_DEPLOYMENT_EVENT_INPUT);

    mockedSendEventsToCompass.mockRejectedValue(MOCK_ERROR);

    await handleDeploymentEvent(MOCK_DEPLOYMENT_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);
    expect(console.error).toHaveBeenCalledWith('Error while sending deployment event to Compass', MOCK_ERROR);
  });

  describe('when isSendStagingEventsEnabled', () => {
    beforeEach(() => {
      jest.spyOn(featureFlagService, 'isSendStagingEventsEnabled').mockReturnValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('sends deployment events when environment is staging', async () => {
      const MOCK_STAGING_ENVIRONMENTS_EVENT = generateEnvironmentEvent(EnvironmentTier.STAGING, 'staging');
      const MOCK_STAGING_DEPLOYMENT_EVENT = generateDeploymentEvent({ environment: 'staging' });
      const MOCK_STAGING_DEPLOYMENT_EVENT_INPUT = generateMockDeploymentInput(
        CompassDeploymentEventEnvironmentCategory.Staging,
      );
      mockedGetEnvironments.mockResolvedValue([MOCK_STAGING_ENVIRONMENTS_EVENT]);
      mockedGetDeployment.mockResolvedValue(MOCK_STAGING_DEPLOYMENT_EVENT_INPUT);

      await handleDeploymentEvent(MOCK_STAGING_DEPLOYMENT_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);

      expect(mockedSendEventsToCompass).toHaveBeenCalledWith(MOCK_STAGING_DEPLOYMENT_EVENT_INPUT);
    });

    it('process deployment events when environment is not production or staging', async () => {
      const MOCK_TESTING_ENVIRONMENTS_EVENT = generateEnvironmentEvent(EnvironmentTier.TESTING, 'testing');
      const MOCK_TESTING_DEPLOYMENT_EVENT = generateDeploymentEvent({ environment: 'testing' });
      const MOCK_TESTING_DEPLOYMENT_EVENT_INPUT = generateMockDeploymentInput(
        CompassDeploymentEventEnvironmentCategory.Testing,
      );
      mockedGetEnvironments.mockResolvedValue([MOCK_TESTING_ENVIRONMENTS_EVENT]);
      mockedGetDeployment.mockResolvedValue(MOCK_TESTING_DEPLOYMENT_EVENT_INPUT);

      await handleDeploymentEvent(MOCK_TESTING_DEPLOYMENT_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);

      expect(mockedSendEventsToCompass).toHaveBeenCalledWith(MOCK_TESTING_DEPLOYMENT_EVENT_INPUT);
    });
  });
});
