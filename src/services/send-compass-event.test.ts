/* eslint-disable import/first */
/* eslint-disable import/order */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { sendEvents } from '../client/compass';
import { sendEventToCompass, sendPushEventToCompass } from './send-compass-events';
import { pipelineWebhookFixture } from '../__tests__/fixtures/build-webhook-payload';
import { MOCK_CLOUD_ID } from '../__tests__/fixtures/gitlab-data';
import { webhookPipelineEventToCompassBuildEvent } from './builds';
import { PushEvent } from '../types';
import { generatePushEvent } from '../__tests__/helpers/gitlab-helper';

jest.mock('../client/compass');
const mockSendEvents = mocked(sendEvents);

describe('send build event to compass method', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully maps gitlab pipeline event to compass build event and send it', async () => {
    await sendEventToCompass(webhookPipelineEventToCompassBuildEvent(pipelineWebhookFixture, MOCK_CLOUD_ID));

    expect(mockSendEvents).toMatchSnapshot();
  });
});

describe('sendPushEventToCompass', () => {
  const mockPushEvent: PushEvent = generatePushEvent();

  const cloudId = 'cloudId123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends push events to Compass successfully', async () => {
    await sendPushEventToCompass(mockPushEvent, cloudId);

    expect(sendEvents).toHaveBeenCalledWith([
      {
        cloudId,
        event: {
          push: {
            pushEventProperties: {
              id: 'commit-sha',
              branchName: 'main',
              author: {
                name: 'John Doe',
                email: 'jdoe@example.com',
              },
            },
            externalEventSourceId: '1',
            updateSequenceNumber: 1,
            displayName: 'Commit on branch main',
            url: 'https://commit-url',
            description: 'message',
            lastUpdated: '2023-01-01T00:00:00Z',
          },
        },
      },
    ]);
  });
});
