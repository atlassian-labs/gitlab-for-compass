import { storage, webTrigger } from '@forge/api';

import { registerGroupWebhook, deleteGroupWebhook, getGroupWebhook } from '../client/gitlab';
import { GITLAB_EVENT_WEBTRIGGER, STORAGE_KEYS, STORAGE_SECRETS } from '../constants';
import { generateSignature } from '../utils/generate-signature-utils';
import { ALL_SETTLED_STATUS, getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';

export const setupAndValidateWebhook = async (groupId: number): Promise<number> => {
  console.log('Setting up webhook');
  try {
    const [existingWebhookResult, groupTokenResult] = await Promise.allSettled([
      storage.get(`${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`),
      storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`),
    ]);

    if (
      existingWebhookResult.status === ALL_SETTLED_STATUS.REJECTED ||
      groupTokenResult.status === ALL_SETTLED_STATUS.REJECTED
    ) {
      throw new Error(
        `Error getting existing webhook or group token: ${getFormattedErrors([
          existingWebhookResult,
          groupTokenResult,
        ])}`,
      );
    }

    const existingWebhook = existingWebhookResult.value;
    const groupToken = groupTokenResult.value;

    const isWebhookValid = existingWebhook && (await getGroupWebhook(groupId, existingWebhook, groupToken)) !== null;

    if (isWebhookValid) {
      console.log('Using existing webhook');
      return existingWebhook;
    }

    const webtriggerURL = await webTrigger.getUrl(GITLAB_EVENT_WEBTRIGGER);
    const webtriggerURLWithGroupId = `${webtriggerURL}?groupId=${groupId}`;
    const webhookSignature = generateSignature();
    const webhookId = await registerGroupWebhook({
      groupId,
      url: webtriggerURLWithGroupId,
      token: groupToken,
      signature: webhookSignature,
    });

    const settledResult = await Promise.allSettled([
      storage.set(`${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`, webhookId),
      storage.set(`${STORAGE_KEYS.WEBHOOK_SIGNATURE_PREFIX}${groupId}`, webhookSignature),
    ]);

    if (hasRejections(settledResult)) {
      throw new Error(`Error setting webhookId or webhookSignature: ${getFormattedErrors(settledResult)}`);
    }

    console.log('Successfully created webhook');
    return webhookId;
  } catch (e) {
    console.log('Error setting up webhook, ', e);
    return null;
  }
};

export const deleteWebhook = async (groupId: number): Promise<void> => {
  try {
    const [webhookIdResult, groupTokenResult] = await Promise.allSettled([
      storage.get(`${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`),
      storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`),
    ]);

    if (
      webhookIdResult.status === ALL_SETTLED_STATUS.REJECTED ||
      groupTokenResult.status === ALL_SETTLED_STATUS.REJECTED
    ) {
      throw new Error(
        `Error getting webhookId or groupToken: ${getFormattedErrors([webhookIdResult, groupTokenResult])}`,
      );
    }

    const webhookId = webhookIdResult.value;
    const groupToken = groupTokenResult.value;

    if (webhookId) {
      await deleteGroupWebhook(groupId, webhookId, groupToken);
    }
  } catch (e) {
    console.error('Error while getting webhookId or groupToken', e);
    throw new Error(`Error while getting webhookId or groupToken: ${e}`);
  }
};
