/* eslint-disable import/order */
import { storage, mockForgeApi } from '../helpers/forge-helper';
/* eslint-disable import/first */
mockForgeApi();

import { processGitlabEvent } from '../../entry/webtriggers';
import { pipelineWebhookFixture } from '../fixtures/build-webhook-payload';

const MOCK_TOKEN_SECRET = 'kokokokokokokokok';

describe('Process gitlab webtrigger', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('successfully parse webhook event', async () => {
    storage.get.mockResolvedValue(MOCK_TOKEN_SECRET);
    const resp = await processGitlabEvent({
      body: JSON.stringify({ body: 'some data' }),
      headers: { 'x-gitlab-token': [MOCK_TOKEN_SECRET] },
      queryParameters: { groupId: [12345] },
      context: { cloudId: 'ari:cloud:compass::site/00000000-0000-0000-0000-000000000000' },
    });

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

    expect(resp).toMatchSnapshot();
  });
});
