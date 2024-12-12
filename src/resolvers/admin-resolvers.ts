import Resolver from '@forge/resolver';

import graphqlGateway from '@atlassian/forge-graphql';
import {
  AuthErrorTypes,
  GitlabAPIGroup,
  ResolverResponse,
  DefaultErrorTypes,
  FeaturesList,
  ProjectImportResult,
} from '../resolverTypes';
import { connectGroup, InvalidGroupTokenError } from '../services/group';

import { setupAndValidateWebhook } from '../services/webhooks';
import { disconnectGroup } from '../services/disconnect-group';
import { getForgeAppId } from '../utils/get-forge-app-id';
import { getLastSyncTime } from '../services/last-sync-time';
import { appId, connectedGroupsInfo, getFeatures, getImportResult, groupsAllExisting } from './shared-resolvers';

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

resolver.define('groups/connect', async (req): Promise<ResolverResponse> => {
  const {
    payload: { groupToken, groupTokenName },
    context: { cloudId },
  } = req;
  try {
    const groupId = await connectGroup(groupToken, groupTokenName);

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

resolver.define('features', (): ResolverResponse<FeaturesList> => {
  return getFeatures();
});

resolver.define('appId', (): ResolverResponse<string> => {
  return appId();
});

resolver.define('project/import/result', async (): Promise<ResolverResponse<ProjectImportResult>> => {
  try {
    const importResult = await getImportResult();
    return { success: true, data: importResult };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: e.errorType }],
    };
  }
});

export default resolver.getDefinitions();
