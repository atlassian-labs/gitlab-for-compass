import Resolver from '@forge/resolver';

import graphqlGateway, { CompassComponentTypeObject } from '@atlassian/forge-graphql';
import { getGroupProjects } from './services/fetch-projects';
import {
  AuthErrorTypes,
  ImportErrorTypes,
  GitlabAPIGroup,
  ResolverResponse,
  ProjectImportResult,
  ImportStatus,
  DefaultErrorTypes,
  FeaturesList,
} from './resolverTypes';
import { connectGroup, getAllExistingGroups, getConnectedGroups, InvalidGroupTokenError } from './services/group';
import {
  clearImportResult,
  getImportResult,
  getImportStatus,
  ImportFailedError,
  importProjects,
} from './services/import-projects';
import { setupAndValidateWebhook } from './services/webhooks';
import { disconnectGroup } from './services/disconnect-group';
import { getForgeAppId } from './utils/get-forge-app-id';
import { getLastSyncTime } from './services/last-sync-time';
import { listFeatures } from './services/feature-flags';
import { GroupProjectsResponse } from './types';
import { getAllComponentTypeIds } from './client/compass';

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
  try {
    const connectedGroups = await getConnectedGroups();

    if (connectedGroups.length) {
      await setupAndValidateWebhook(connectedGroups[0].id);
    }

    return { success: true, data: connectedGroups };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: 'Get connected groups failed.', errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
    };
  }
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
  try {
    const allExistingGroups = await getAllExistingGroups();

    return { success: true, data: allExistingGroups };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: 'Get all existing groups failed.', errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
    };
  }
});

resolver.define('groups/projects', async (req): Promise<ResolverResponse<GroupProjectsResponse>> => {
  const {
    payload: { groupId, page, groupTokenId, search },
    context: { cloudId },
  } = req;

  try {
    const { projects, total } = await getGroupProjects(cloudId, groupId, page, groupTokenId, search);

    return { success: true, data: { projects, total } };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: e.errorType }],
    };
  }
});

resolver.define('project/import', async (req): Promise<ResolverResponse> => {
  const {
    payload: { projectsReadyToImport, groupId },
    context: { cloudId },
  } = req;

  try {
    await importProjects(cloudId, projectsReadyToImport, groupId);
    return {
      success: true,
    };
  } catch (e) {
    if (e instanceof ImportFailedError) {
      return {
        success: false,
        errors: [{ message: e.message, errorType: e.errorType }],
      };
    }

    return {
      success: false,
      errors: [{ message: e.message, errorType: ImportErrorTypes.UNEXPECTED_ERROR }],
    };
  }
});

resolver.define('project/import/status', async (): Promise<ResolverResponse<ImportStatus>> => {
  try {
    const importStatus = await getImportStatus();
    return { success: true, data: importStatus };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: e.errorType }],
    };
  }
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

resolver.define('project/import/clear', async (): Promise<ResolverResponse> => {
  try {
    await clearImportResult();
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: e.errorType }],
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

resolver.define('features', (): ResolverResponse<FeaturesList> => {
  try {
    const features = listFeatures();
    return {
      success: true,
      data: features,
    };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: DefaultErrorTypes.UNEXPECTED_ERROR }],
    };
  }
});

resolver.define('appId', (): ResolverResponse<string> => {
  try {
    const forgeAppId = getForgeAppId();
    return {
      success: true,
      data: forgeAppId,
    };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: DefaultErrorTypes.UNEXPECTED_ERROR }],
    };
  }
});

resolver.define('getAllCompassComponentTypes', async (req): Promise<ResolverResponse<CompassComponentTypeObject[]>> => {
  const { cloudId } = req.context;
  try {
    const componentTypes = await getAllComponentTypeIds(cloudId);
    return { success: true, data: componentTypes };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message }],
    };
  }
});

export default resolver.getDefinitions();
