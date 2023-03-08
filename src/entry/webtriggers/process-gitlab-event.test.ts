/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { storage, mockForgeApi } from '../../__tests__/helpers/forge-helper';

mockForgeApi();
import { WebtriggerRequest } from '../../types';
import {
  handleDeploymentEvent,
  handleMergeRequestEvent,
  handlePipelineEvent,
  handlePushEvent,
} from './gitlab-event-handlers';
import { processGitlabEvent } from './process-gitlab-event';
import { serverResponse } from '../../utils/webtrigger-utils';
import {
  generateDeploymentEvent,
  generateMergeRequestEvent,
  generatePipelineEvent,
  generatePushEvent,
} from '../../__tests__/helpers/gitlab-helper';
import { MOCK_CLOUD_ID, TEST_TOKEN } from '../../__tests__/fixtures/gitlab-data';

jest.mock('./gitlab-event-handlers');
jest.mock('../../utils/webtrigger-utils');
jest.mock('../../services/feature-flags');

const MOCK_CONTEXT = {
  principal: undefined as undefined,
  installContext: `ari:cloud:compass::site/${MOCK_CLOUD_ID}`,
};

const MOCK_GROUP_ID = 1;

const generateWebtriggerRequest = (body: string, token = TEST_TOKEN): WebtriggerRequest => {
  return {
    body,
    queryParameters: {
      groupId: [MOCK_GROUP_ID],
    },
    headers: {
      'x-gitlab-token': [token],
    },
  };
};

const mockHandlePushEvent = mocked(handlePushEvent);
const mockHandlePipelineEvent = mocked(handlePipelineEvent);
const mockHandleMergeRequestEvent = mocked(handleMergeRequestEvent);
const mockDeploymentEvent = mocked(handleDeploymentEvent);

describe('processGitlabEvent', () => {
  const MOCK_PUSH_EVENT = generatePushEvent();
  const MOCK_PIPELINE_EVENT = generatePipelineEvent();
  const MOCK_MERGE_REQUEST_EVENT = generateMergeRequestEvent();
  const MOCK_DEPLOYMENT_EVENT = generateDeploymentEvent();

  beforeEach(() => {
    jest.clearAllMocks();
    storage.getSecret.mockResolvedValue(TEST_TOKEN);
    storage.get.mockResolvedValue(TEST_TOKEN);
  });

  it('handles push event', async () => {
    const webtriggerRequest = generateWebtriggerRequest(JSON.stringify(MOCK_PUSH_EVENT));

    await processGitlabEvent(webtriggerRequest, MOCK_CONTEXT);

    expect(mockHandlePushEvent).toHaveBeenCalledWith(MOCK_PUSH_EVENT, TEST_TOKEN);
    expect(serverResponse).toHaveBeenCalledWith('Processed webhook event');
  });

  it('returns server response error in case of invalid webhook event secret', async () => {
    const webtriggerRequest = generateWebtriggerRequest(JSON.stringify(MOCK_PUSH_EVENT), 'invalid-token');

    await processGitlabEvent(webtriggerRequest, MOCK_CONTEXT);

    expect(mockHandlePushEvent).not.toHaveBeenCalled();
    expect(serverResponse).toHaveBeenCalledWith('Invalid webhook secret', 403);
  });

  it('returns server response error in case of failed parsing webhook event', async () => {
    const webtriggerRequest = generateWebtriggerRequest('<p>Invalid body</p>');

    await processGitlabEvent(webtriggerRequest, MOCK_CONTEXT);

    expect(mockHandlePushEvent).not.toHaveBeenCalled();
    expect(serverResponse).toHaveBeenCalledWith('Invalid event format', 400);
  });

  it('handles pipeline event when FF is enabled', async () => {
    const webtriggerRequest = generateWebtriggerRequest(JSON.stringify(MOCK_PIPELINE_EVENT));

    await processGitlabEvent(webtriggerRequest, MOCK_CONTEXT);

    expect(mockHandlePipelineEvent).toHaveBeenCalledWith(MOCK_PIPELINE_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);
    expect(serverResponse).toHaveBeenCalledWith('Processed webhook event');
  });

  it('handles merge request event', async () => {
    const webtriggerRequest = generateWebtriggerRequest(JSON.stringify(MOCK_MERGE_REQUEST_EVENT));

    await processGitlabEvent(webtriggerRequest, MOCK_CONTEXT);

    expect(mockHandleMergeRequestEvent).toHaveBeenCalledWith(MOCK_MERGE_REQUEST_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);
    expect(serverResponse).toHaveBeenCalledWith('Processed webhook event');
  });

  it('handles deployment event when FF is enabled', async () => {
    const webtriggerRequest = generateWebtriggerRequest(JSON.stringify(MOCK_DEPLOYMENT_EVENT));

    await processGitlabEvent(webtriggerRequest, MOCK_CONTEXT);

    expect(mockDeploymentEvent).toHaveBeenCalledWith(MOCK_DEPLOYMENT_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);
    expect(serverResponse).toHaveBeenCalledWith('Processed webhook event');
  });
});
