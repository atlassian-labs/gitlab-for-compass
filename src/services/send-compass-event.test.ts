/* eslint-disable import/first */
/* eslint-disable import/order */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { CompassEventType } from '@atlassian/forge-graphql';
import { sendEvents } from '../client/compass';
import { sendEventToCompass } from './send-compass-events';
import { pipelineWebhookFixture } from '../__tests__/fixtures/build-webhook-payload';
import { MOCK_CLOUD_ID } from '../__tests__/fixtures/gitlab-data';
import { webhookPipelineEventToCompassBuildEvent } from './builds';

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
