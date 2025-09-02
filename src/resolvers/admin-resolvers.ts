import Resolver, { Request } from '@forge/resolver';

import graphqlGateway from '@atlassian/forge-graphql';
import { Component } from '@atlassian/forge-graphql-types';
import { storage } from '@forge/api';
import {
  AuthErrorTypes,
  GitlabAPIGroup,
  ResolverResponse,
  DefaultErrorTypes,
  FeaturesList,
  ResyncErrorTypes,
} from '../resolverTypes';
import { connectGroup, getGroupById, InvalidGroupTokenError, rotateGroupToken } from '../services/group';

import { rotateWebhook, setupAndValidateWebhook } from '../services/webhooks';
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
  getRole,
  groupsAllExisting,
  tokenExpirationDays,
  webhookSetupConfig,
  webhookStatus,
} from './shared-resolvers';
import {
  BlobFileSearchResult,
  ConnectGroupInput,
  FileData,
  GitLabRoles,
  GroupProjectsResponse,
  ImportableProject,
  ProjectImportResult,
  WebhookAlertStatus,
  WebhookSetupConfig,
} from '../types';
import { createMRWithCompassYML } from '../services/create-mr-with-compass-yml';
import { createComponent, createComponentSlug } from '../client/compass';
import { STORAGE_KEYS } from '../constants';
import { minutesToMilliseconds } from '../utils/time-utils';
import { getGroupCaCFiles } from '../services/files';
import { checkCaCFilename } from '../utils/cac-filename-check';
import { resyncConfigAsCode } from '../services/resync-cac';
import { StoreRotateTokenError } from '../models/errors';

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

resolver.define('groups/rotateToken', async (req): Promise<ResolverResponse> => {
  const {
    payload: { groupToken, groupTokenName, groupRole, groupName },
  } = req;

  try {
    const input: ConnectGroupInput = {
      token: groupToken,
      tokenName: groupTokenName,
      tokenRole: groupRole,
      groupName,
    };

    await rotateGroupToken(input);

    return { success: true };
  } catch (e) {
    if (e instanceof InvalidGroupTokenError || e instanceof StoreRotateTokenError) {
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

    const group = await getGroupById(groupId);

    await graphqlGateway.compass.asApp().synchronizeLinkAssociations({
      cloudId,
      forgeAppId: getForgeAppId(),
      options: {
        ...(group && { urlFilterRegex: `.*gitlab\.com/.*${group.path}.*` }), // eslint-disable-line no-useless-escape
      },
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

resolver.define('group/getRole', async (req): Promise<ResolverResponse<GitLabRoles>> => {
  return getRole(req);
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

    const group = await getGroupById(groupId);

    await graphqlGateway.compass.asApp().synchronizeLinkAssociations({
      cloudId,
      forgeAppId: getForgeAppId(),
      options: {
        ...(group && { urlFilterRegex: `.*gitlab\.com/.*${group.path}.*` }), // eslint-disable-line no-useless-escape
      },
    });

    return { success: true };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
    };
  }
});

resolver.define('webhooks/getWebhookStatus', async (req): Promise<ResolverResponse<WebhookAlertStatus>> => {
  return webhookStatus(req);
});

resolver.define('group/rotateWebhook', async (req): Promise<ResolverResponse<void>> => {
  const { groupId } = req.payload;

  try {
    await rotateWebhook(groupId);
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: `rotateWebhook call could not complete: ${e.message}` }],
    };
  }
});

resolver.define('group/tokenExpirationDays', async (req): Promise<ResolverResponse<number | null>> => {
  return tokenExpirationDays(req);
});

resolver.define('groups/allExisting', async (): Promise<ResolverResponse<GitlabAPIGroup[]>> => {
  return groupsAllExisting();
});

resolver.define('groups/projects', async (req): Promise<ResolverResponse<GroupProjectsResponse>> => {
  return getGroupsProjects(req);
});

resolver.define('group/resyncCaC', async (req): Promise<ResolverResponse<{ hasNextPage: boolean }>> => {
  const {
    payload: { groupId, page },
    context: { cloudId },
  } = req;

  const MINUTES_LOCK = 60;
  const MAX_FILES = 20;

  try {
    const lastUpdate = await storage.get(`${STORAGE_KEYS.CAC_MANUAL_SYNC_PREFIX}${cloudId}_${groupId}`);

    const dateNowInMs = Date.now();

    if (!lastUpdate) {
      await storage.set(`${STORAGE_KEYS.CAC_MANUAL_SYNC_PREFIX}${cloudId}_${groupId}`, dateNowInMs);
    }

    if (lastUpdate && dateNowInMs - lastUpdate > minutesToMilliseconds(MINUTES_LOCK)) {
      await storage.set(`${STORAGE_KEYS.CAC_MANUAL_SYNC_PREFIX}${cloudId}_${groupId}`, dateNowInMs);
    }

    if (lastUpdate && dateNowInMs - lastUpdate <= minutesToMilliseconds(MINUTES_LOCK)) {
      return {
        success: true,
        errors: [
          {
            message: `A resync of the config-as-code files in ${groupId} is already underway.`,
            errorType: ResyncErrorTypes.RESYNC_TIME_LIMIT,
          },
        ],
      };
    }

    let yamlFiles: BlobFileSearchResult[] = [];

    // eslint-disable-next-line no-console
    console.log(`Fetching page ${page} of config-as-code files for group: ${groupId}.`);

    const { data, hasNextPage } = await getGroupCaCFiles({
      groupId,
      page,
      perPage: MAX_FILES,
    });

    yamlFiles = data;

    // eslint-disable-next-line no-console
    console.log(`Fetched ${yamlFiles.length} config-as-code-files for group: ${groupId}`);

    const yamlFilesData: FileData[] = [];

    if (yamlFiles.length > 0) {
      for (const yamlFile of yamlFiles) {
        if (checkCaCFilename) {
          yamlFilesData.push({
            path: yamlFile.path,
            projectId: yamlFile.project_id,
            groupId,
            ref: yamlFile.ref,
          });
        }
      }

      await resyncConfigAsCode(cloudId, yamlFilesData);
    }

    return {
      success: true,
      data: {
        hasNextPage,
      },
    };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message }],
    };
  }
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

resolver.define(
  'createSingleComponent',
  async (req: Request<{ projectToImport: ImportableProject }>): Promise<ResolverResponse<Component>> => {
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
  },
);

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
