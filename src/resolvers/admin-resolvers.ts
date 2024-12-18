import Resolver from '@forge/resolver';

import graphqlGateway from '@atlassian/forge-graphql';
import { AuthErrorTypes, GitlabAPIGroup, ResolverResponse, DefaultErrorTypes, FeaturesList } from '../resolverTypes';
import { connectGroup, InvalidGroupTokenError } from '../services/group';

import { setupAndValidateWebhook } from '../services/webhooks';
import { disconnectGroup } from '../services/disconnect-group';
import { getForgeAppId } from '../utils/get-forge-app-id';
import { getLastSyncTime } from '../services/last-sync-time';
import { appId, connectedGroupsInfo, getFeatures, groupsAllExisting, webhookSetupConfig } from './shared-resolvers';
import { ConnectGroupInput, GitLabRoles, WebhookSetupConfig } from '../types';

const resolver = new Resolver();

resolver.define('groups/disconnect', async (req): Promise<ResolverResponse> => {
  try {
    const {
      payload: { id: groupId },
      context: { cloudId },
    } = req;
    const forgeAppId = getForgeAppId();

    await disconnectGroup(groupId, cloudId, forgeAppId);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: 'Disconnect group failed.', errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
    };
  }
});

resolver.define('groups/connectedInfo', async (): Promise<ResolverResponse<GitlabAPIGroup[]>> => {
  return connectedGroupsInfo();
});

resolver.define('webhooks/setupConfig', async (): Promise<ResolverResponse<WebhookSetupConfig>> => {
  return webhookSetupConfig();
});

resolver.define('groups/connect', async (req): Promise<ResolverResponse> => {
  const {
    payload: { groupToken, groupTokenName, groupRole, groupName },
    context: { cloudId },
  } = req;
  try {
    const input: ConnectGroupInput = {
      token: groupToken,
      tokenName: groupTokenName,
      tokenRole: groupRole,
      groupName,
    };
    const groupId = await connectGroup(input);

    const skipWebhookSetup = groupRole === GitLabRoles.MAINTAINER;
    if (skipWebhookSetup) {
      return { success: true };
    }

    await setupAndValidateWebhook(groupId);

    await graphqlGateway.compass.asApp().synchronizeLinkAssociations({
      cloudId,
      forgeAppId: getForgeAppId(),
    });

    return { success: true };
  } catch (e) {
    if (e instanceof InvalidGroupTokenError) {
      return {
        success: false,
        errors: [{ message: e.message, errorType: e.errorType }],
      };
    }

    return {
      success: false,
      errors: [{ message: e.message, errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
    };
  }
});

resolver.define('webhooks/connectInProgress', async (req): Promise<ResolverResponse> => {
  const {
    payload: { groupId, webhookId, webhookSecretToken },
    context: { cloudId },
  } = req;
  try {
    if (!groupId) {
      return {
        success: false,
        errors: [{ message: 'No webhook setup in progress.', errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
      };
    }

    await setupAndValidateWebhook(groupId, webhookId, webhookSecretToken);

    await graphqlGateway.compass.asApp().synchronizeLinkAssociations({
      cloudId,
      forgeAppId: getForgeAppId(),
    });

    return { success: true };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
    };
  }
});

resolver.define('groups/allExisting', async (): Promise<ResolverResponse<GitlabAPIGroup[]>> => {
  return groupsAllExisting();
});

resolver.define('project/lastSyncTime', async (): Promise<ResolverResponse<string | null>> => {
  try {
    const lastSyncTime = await getLastSyncTime();
    return {
      success: true,
      data: lastSyncTime,
    };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: DefaultErrorTypes.UNEXPECTED_ERROR }],
    };
  }
});

resolver.define('features', (req): ResolverResponse<FeaturesList> => {
  const {
    context: { cloudId },
  } = req;

  return getFeatures(cloudId);
});

resolver.define('appId', (): ResolverResponse<string> => {
  return appId();
});

export default resolver.getDefinitions();
