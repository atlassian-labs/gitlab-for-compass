import { storage, webTrigger } from '@forge/api';

import { registerGroupWebhook, deleteGroupWebhook, getGroupWebhook } from '../client/gitlab';
import { GITLAB_EVENT_WEBTRIGGER, STORAGE_KEYS, STORAGE_SECRETS } from '../constants';
import { generateSignature } from '../utils/generate-signature-utils';

export const setupAndValidateWebhook = async (groupId: number): Promise<number> => {
  console.log('Setting up webhook');
  try {
    const [existingWebhook, baseUrl, groupToken] = await Promise.all([
      storage.get(`${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`),
      storage.get(STORAGE_KEYS.BASE_URL),
      storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`),
    ]);

    const isWebhookValid =
      existingWebhook && (await getGroupWebhook(groupId, existingWebhook, baseUrl, groupToken)) !== null;

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
      baseUrl,
      token: groupToken,
      signature: webhookSignature,
    });

    await Promise.all([
      storage.set(`${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`, webhookId),
      storage.set(`${STORAGE_KEYS.WEBHOOK_SIGNATURE_PREFIX}${groupId}`, webhookSignature),
    ]);

    console.log('Successfully created webhook');
    return webhookId;
  } catch (e) {
    console.log('Error setting up webhook, ', e);
    return null;
  }
};

export const deleteWebhook = async (groupId: number): Promise<void> => {
  const [webhookId, baseUrl, groupToken] = await Promise.all([
    storage.get(`${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`),
    storage.get(STORAGE_KEYS.BASE_URL),
    storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`),
  ]);

  if (webhookId) {
    await deleteGroupWebhook(groupId, webhookId, baseUrl, groupToken);
  }
};
