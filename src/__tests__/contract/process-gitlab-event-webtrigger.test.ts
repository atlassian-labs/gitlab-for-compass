/* eslint-disable import/order */
import { storage, mockForgeApi } from '../helpers/forge-helper';
import { internalMetrics } from '@forge/metrics';
/* eslint-disable import/first */
mockForgeApi();

import { processGitlabEvent } from '../../entry/webtriggers';
import { pipelineWebhookFixture } from '../fixtures/build-webhook-payload';

const mockedIncr = jest.fn();
jest.mock('@forge/metrics', () => ({
  internalMetrics: {
    counter: jest.fn(() => ({
      incr: mockedIncr,
    })),
  },
}));

const MOCK_TOKEN_SECRET = 'kokokokokokokokok';

describe('Process gitlab webtrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successfully parse webhook event', async () => {
    storage.get.mockResolvedValue(MOCK_TOKEN_SECRET);
    const resp = await processGitlabEvent({
      body: JSON.stringify({ body: 'some data' }),
      headers: { 'x-gitlab-token': [MOCK_TOKEN_SECRET] },
      queryParameters: { groupId: [12345] },
      context: { cloudId: 'ari:cloud:compass::site/00000000-0000-0000-0000-000000000000' },
    });
    expect(internalMetrics.counter).toHaveBeenCalledTimes(2);
    expect(resp).toMatchSnapshot();
  });

  test('successfully parse webhook pipeline event', async () => {
    storage.get.mockResolvedValue(MOCK_TOKEN_SECRET);
    const resp = await processGitlabEvent({
      body: JSON.stringify({ body: pipelineWebhookFixture }),
      headers: { 'x-gitlab-token': [MOCK_TOKEN_SECRET] },
      queryParameters: { groupId: [12345] },
      context: { cloudId: 'ari:cloud:compass::site/00000000-0000-0000-0000-000000000000' },
    });

    expect(internalMetrics.counter).toHaveBeenCalledTimes(2);
    expect(resp).toMatchSnapshot();
  });
});
