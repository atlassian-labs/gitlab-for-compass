import { storage, webTrigger } from '@forge/api';

import { registerGroupWebhook, deleteGroupWebhook, getGroupWebhook } from '../client/gitlab';
import { GITLAB_EVENT_WEBTRIGGER, STORAGE_KEYS, STORAGE_SECRETS } from '../constants';
import { generateSignature } from '../utils/generate-signature-utils';
import { ALL_SETTLED_STATUS, getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';
import { GitLabRoles } from '../types';

const setupAndValidateForOwnerToken = async (
  groupId: number,
  existingWebhook: number,
  groupToken: string,
): Promise<number> => {
  console.log('Setting up webhook for Owner token role');

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

  console.log('Successfully created webhook with owner token role');
  return webhookId;
};

const setupAndValidateForMaintainerToken = async (
  groupId: number,
  webhookId: number,
  isExistingWebhook?: boolean,
  webhookSignature?: string,
): Promise<number> => {
  console.log('Setting up webhook for Maintainer token role');

  if (isExistingWebhook) {
    console.log('Using existing webhook. Skipping webhook validation since Maintainer token role is not authorized');
    return webhookId;
  }

  const settledResult = await Promise.allSettled([
    storage.set(`${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`, webhookId),
    storage.set(`${STORAGE_KEYS.WEBHOOK_SIGNATURE_PREFIX}${groupId}`, webhookSignature),
  ]);

  if (hasRejections(settledResult)) {
    throw new Error(`Error setting webhookId or webhookSignature: ${getFormattedErrors(settledResult)}`);
  }

  console.log('Successfully created webhook with maintainer token role');
  return webhookId;
};

export const setupAndValidateWebhook = async (
  groupId: number,
  webhookId?: number,
  webhookSecretToken?: string,
): Promise<number> => {
  console.log('Setting up webhook');
  try {
    const [existingWebhookResult, tokenRoleResult, groupTokenResult] = await Promise.allSettled([
      storage.get(`${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`),
      storage.get(`${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${groupId}`),
      storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`),
    ]);

    if (
      existingWebhookResult.status === ALL_SETTLED_STATUS.REJECTED ||
      tokenRoleResult.status === ALL_SETTLED_STATUS.REJECTED ||
      groupTokenResult.status === ALL_SETTLED_STATUS.REJECTED
    ) {
      throw new Error(
        `Error getting existing webhook, token role or group token: ${getFormattedErrors([
          existingWebhookResult,
          tokenRoleResult,
          groupTokenResult,
        ])}`,
      );
    }

    const existingWebhook = existingWebhookResult.value;
    const groupToken = groupTokenResult.value;
    const tokenRole: string = tokenRoleResult.value;

    // Legacy integrations might not have the new tokenRole stored. These are treated as OWNER.
    if (!tokenRole || tokenRole === GitLabRoles.OWNER) {
      return setupAndValidateForOwnerToken(groupId, existingWebhook, groupToken);
    }

    // Prioritize using existing webhooks setup over incoming webhookId.
    return setupAndValidateForMaintainerToken(
      groupId,
      existingWebhook ?? webhookId,
      !!existingWebhook,
      webhookSecretToken,
    );
  } catch (e) {
    console.log('Error setting up webhook, ', e);
    return null;
  }
};

export const deleteWebhook = async (groupId: number): Promise<void> => {
  try {
    const [webhookIdResult, tokenRole, groupTokenResult] = await Promise.allSettled([
      storage.get(`${STORAGE_KEYS.WEBHOOK_KEY_PREFIX}${groupId}`),
      storage.get(`${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${groupId}`),
      storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`),
    ]);

    if (
      webhookIdResult.status === ALL_SETTLED_STATUS.REJECTED ||
      tokenRole.status === ALL_SETTLED_STATUS.REJECTED ||
      groupTokenResult.status === ALL_SETTLED_STATUS.REJECTED
    ) {
      throw new Error(
        `Error getting webhookId or groupToken: ${getFormattedErrors([webhookIdResult, groupTokenResult])}`,
      );
    }

    if (tokenRole.value === GitLabRoles.MAINTAINER) {
      console.log('Skipping webhook deletion since Maintainer token role is not authorized');
      return;
    }

    const webhookId = webhookIdResult.value;
    const groupToken = groupTokenResult.value;

    if (webhookId) {
      await deleteGroupWebhook(groupId, webhookId, groupToken);
    }
  } catch (e) {
    console.error('Error deleting webhook', e);
    throw new Error(`Error deleting webhook: ${e}`);
  }
};
