import Resolver from '@forge/resolver';

import graphqlGateway, { Component } from '@atlassian/forge-graphql';
import { AuthErrorTypes, GitlabAPIGroup, ResolverResponse, DefaultErrorTypes, FeaturesList } from '../resolverTypes';
import { connectGroup, InvalidGroupTokenError } from '../services/group';

import { setupAndValidateWebhook } from '../services/webhooks';
import { disconnectGroup } from '../services/disconnect-group';
import { getForgeAppId } from '../utils/get-forge-app-id';
import { getLastSyncTime } from '../services/last-sync-time';
import {
  appId,
  connectedGroupsInfo,
  getAllComponentTypes,
  getFeatures,
  getGroupsProjects,
  getProjectImportResult,
  groupsAllExisting,
  webhookSetupConfig,
} from './shared-resolvers';
import {
  ConnectGroupInput,
  GitLabRoles,
  GroupProjectsResponse,
  ProjectImportResult,
  WebhookSetupConfig,
} from '../types';
import { createMRWithCompassYML } from '../services/create-mr-with-compass-yml';
import { createComponent, createComponentSlug } from '../client/compass';

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

resolver.define('groups/projects', async (req): Promise<ResolverResponse<GroupProjectsResponse>> => {
  return getGroupsProjects(req);
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

resolver.define('createSingleComponent', async (req): Promise<ResolverResponse<Component>> => {
  const {
    payload: { projectToImport },
    context: { cloudId },
  } = req;
  try {
    const component = await createComponent(cloudId, projectToImport);

    if (component.id && projectToImport.name) {
      await createComponentSlug(component.id, projectToImport.name);
    }

    return {
      success: true,
      data: component,
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

resolver.define('getAllCompassComponentTypes', getAllComponentTypes);

resolver.define('project/createMRWithCompassYML', async (req): Promise<ResolverResponse> => {
  const { project, componentId, groupId } = req.payload;

  try {
    await createMRWithCompassYML(project, componentId, groupId);

    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.statusText || e.message }],
    };
  }
});

resolver.define('project/import/result', async (): Promise<ResolverResponse<ProjectImportResult>> => {
  return getProjectImportResult();
});

export default resolver.getDefinitions();
