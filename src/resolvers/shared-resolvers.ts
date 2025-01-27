import { CompassComponentTypeObject } from '@atlassian/forge-graphql';
import { Request } from '@forge/resolver';
import {
  AuthErrorTypes,
  DefaultErrorTypes,
  FeaturesList,
  GitlabAPIGroup,
  ImportErrorTypes,
  ResolverResponse,
} from '../resolverTypes';
import { listFeatures } from '../services/feature-flags';
import { getAllExistingGroups, getConnectedGroups } from '../services/group';
import { getWebhookSetupConfig, setupAndValidateWebhook } from '../services/webhooks';
import { getForgeAppId } from '../utils/get-forge-app-id';
import { GroupProjectsResponse, WebhookSetupConfig } from '../types';
import { getGroupProjects } from '../services/fetch-projects';
import { ImportFailedError, importProjects } from '../services/import-projects';
import { getAllComponentTypes as getAllCompassComponentTypes } from '../client/compass';

export const getFeatures = (cloudId: string): ResolverResponse<FeaturesList> => {
  try {
    const features = listFeatures(cloudId);
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
};

export const groupsAllExisting = async (): Promise<ResolverResponse<GitlabAPIGroup[]>> => {
  try {
    const allExistingGroups = await getAllExistingGroups();

    return { success: true, data: allExistingGroups };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: 'Get all existing groups failed.', errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
    };
  }
};

export const connectedGroupsInfo = async (): Promise<ResolverResponse<GitlabAPIGroup[]>> => {
  console.log('Fetching connected groups info');
  try {
    const connectedGroups = await getConnectedGroups();
    const setupConfig = await getWebhookSetupConfig();

    if (connectedGroups.length && !setupConfig.webhookSetupInProgress) {
      await setupAndValidateWebhook(connectedGroups[0].id);
    }

    return { success: true, data: connectedGroups };
  } catch (e) {
    console.log('Error fetching connected groups info', e);
    return {
      success: false,
      errors: [{ message: 'Get connected groups failed.', errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
    };
  }
};

export const appId = (): ResolverResponse<string> => {
  try {
    const forgeAppId = getForgeAppId();
    return {
      success: true,
      data: forgeAppId,
    };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: DefaultErrorTypes.NO_APP_ID_VARIABLE_DEFINED }],
    };
  }
};

export const webhookSetupConfig = async (): Promise<ResolverResponse<WebhookSetupConfig>> => {
  console.log('Fetching webhook setup config');
  try {
    const config = await getWebhookSetupConfig();
    return {
      success: true,
      data: config,
    };
  } catch (e) {
    console.log('Error fetching webhook setup config', e);
    return {
      success: false,
      errors: [{ message: e.message, errorType: DefaultErrorTypes.UNEXPECTED_ERROR }],
    };
  }
};

export const getGroupsProjects = async (req: any): Promise<ResolverResponse<GroupProjectsResponse>> => {
  const {
    payload: { groupId, page, groupTokenId, search, perPage },
    context: { cloudId },
  } = req;

  try {
    const { projects, total } = await getGroupProjects(cloudId, groupId, page, groupTokenId, search, perPage);

    return { success: true, data: { projects, total } };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message, errorType: e.errorType }],
    };
  }
};

export const importProject = async (req: any): Promise<ResolverResponse> => {
  const {
    payload: { projectsReadyToImport, groupId },
    context: { cloudId },
  } = req;

  console.log({
    message: 'Begin importing projects',
    count: projectsReadyToImport.length,
    cloudId,
  });

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
};

export const getAllComponentTypes = async (req: Request): Promise<ResolverResponse<CompassComponentTypeObject[]>> => {
  const { cloudId } = req.context;
  try {
    const componentTypes = await getAllCompassComponentTypes(cloudId);
    return { success: true, data: componentTypes };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message }],
    };
  }
};
