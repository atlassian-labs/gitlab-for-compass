import { storage } from '@forge/api';

import {
  DeploymentEvent,
  GitlabEvent,
  MergeRequestEvent,
  PipelineEvent,
  PushEvent,
  WebhookTypes,
  WebtriggerRequest,
  WebtriggerResponse,
} from '../../types';
import { serverResponse } from '../../utils/webtrigger-utils';
import { STORAGE_KEYS, STORAGE_SECRETS } from '../../constants';
import {
  handlePushEvent,
  handleMergeRequestEvent,
  handleDeploymentEvent,
  handlePipelineEvent,
} from './gitlab-event-handlers';
import { ParseWebhookEventPayloadError, ValidateWebhookSignatureError } from '../../models/errors';

const validateWebhookSignature = (eventSignature: string, controlSignature: string): void | never => {
  if (eventSignature !== controlSignature) {
    throw new ValidateWebhookSignatureError();
  }
};

const parseEventPayload = (eventPayload: string): GitlabEvent | never => {
  try {
    return JSON.parse(eventPayload);
  } catch {
    throw new ParseWebhookEventPayloadError();
  }
};

export const processGitlabEvent = async (event: WebtriggerRequest): Promise<WebtriggerResponse> => {
  try {
    const { cloudId } = event.context;
    const groupId = event.queryParameters.groupId[0];
    const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);
    const eventPayload = event.body;

    validateWebhookSignature(
      event.headers['x-gitlab-token'][0],
      await storage.get(`${STORAGE_KEYS.WEBHOOK_SIGNATURE_PREFIX}${groupId}`),
    );

    const parsedEvent = parseEventPayload(eventPayload);

    if (parsedEvent.object_kind === WebhookTypes.PUSH) {
      await handlePushEvent(parsedEvent as PushEvent, groupToken, cloudId);

      return serverResponse('Processed webhook event of type PUSH');
    }

    if (parsedEvent.object_kind === WebhookTypes.MERGE_REQUEST) {
      await handleMergeRequestEvent(parsedEvent as MergeRequestEvent, groupToken, cloudId);

      return serverResponse('Processed webhook event of type MERGE_REQUEST');
    }

    if (parsedEvent.object_kind === WebhookTypes.PIPELINE) {
      await handlePipelineEvent(parsedEvent as PipelineEvent, groupToken, cloudId);

      return serverResponse('Processed webhook event of type PIPELINE');
    }

    if (parsedEvent.object_kind === WebhookTypes.DEPLOYMENT) {
      await handleDeploymentEvent(parsedEvent as DeploymentEvent, groupToken, cloudId);

      return serverResponse('Processed webhook event of type DEPLOYMENT');
    }

    return serverResponse('Processed webhook event');
  } catch (error) {
    if (error instanceof ValidateWebhookSignatureError) {
      console.error({ message: 'Webhook event secret is invalid', error });
      return serverResponse('Invalid webhook secret', 403);
    }

    if (error instanceof ParseWebhookEventPayloadError) {
      console.error({ message: 'Failed parsing webhook event', error });
      return serverResponse('Invalid event format', 400);
    }

    console.error({ message: 'Unexpected error while processing webhook', error });
    return serverResponse('The webhook could not be processed', 500);
  }
};
