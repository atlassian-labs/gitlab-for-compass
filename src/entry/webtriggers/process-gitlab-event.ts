import { storage } from '@forge/api';

import {
  DeploymentEvent,
  GitlabEvent,
  MergeRequestEvent,
  PipelineEvent,
  PushEvent,
  WebtriggerRequest,
  WebtriggerResponse,
} from '../../types';
import { serverResponse } from '../../utils/webtrigger-utils';
import { parse } from '../../utils/parse-ari';
import { STORAGE_KEYS, STORAGE_SECRETS } from '../../constants';
import {
  handlePushEvent,
  handleMergeRequestEvent,
  handleDeploymentEvent,
  handlePipelineEvent,
} from './gitlab-event-handlers';
import { listFeatures } from '../../services/feature-flags';

type Context = {
  principal: undefined;
  installContext: string;
};

class ValidateWebhookSignatureError extends Error {}

const validateWebhookSignature = (eventSignature: string, controlSignature: string): void | never => {
  if (eventSignature !== controlSignature) {
    throw new ValidateWebhookSignatureError();
  }
};

export const processGitlabEvent = async (event: WebtriggerRequest, context: Context): Promise<WebtriggerResponse> => {
  const { installContext } = context;
  const cloudId = parse(installContext).resourceId;
  const groupId = event.queryParameters.groupId[0];
  const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);
  const eventPayload = event.body;
  let parsedEvent: GitlabEvent;

  try {
    validateWebhookSignature(
      event.headers['x-gitlab-token'][0],
      await storage.get(`${STORAGE_KEYS.WEBHOOK_SIGNATURE_PREFIX}${groupId}`),
    );
    parsedEvent = JSON.parse(eventPayload);
  } catch (error) {
    if (error instanceof ValidateWebhookSignatureError) {
      console.error({ message: 'Webhook event secret is invalid', error });
      return serverResponse('Invalid webhook secret', 403);
    }

    console.error({ message: 'Failed parsing webhook event', error });
    return serverResponse('Invalid event format', 400);
  }

  if (parsedEvent.object_kind === 'push') {
    await handlePushEvent(parsedEvent as PushEvent, groupToken);
  }

  if (parsedEvent.object_kind === 'merge_request') {
    await handleMergeRequestEvent(parsedEvent as MergeRequestEvent, groupToken, cloudId);
  }

  if (parsedEvent.object_kind === 'pipeline') {
    await handlePipelineEvent(parsedEvent as PipelineEvent, groupToken, cloudId);
  }

  if (parsedEvent.object_kind === 'deployment') {
    await handleDeploymentEvent(parsedEvent as DeploymentEvent, groupToken, cloudId);
  }

  return serverResponse('Processed webhook event');
};
