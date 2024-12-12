import { ListResult, startsWith, storage } from '@forge/api';
import {
  AuthErrorTypes,
  DefaultErrorTypes,
  FeaturesList,
  GitlabAPIGroup,
  ImportableProject,
  ImportErrorTypes,
  ProjectImportResult,
  ResolverResponse,
} from '../resolverTypes';
import { listFeatures } from '../services/feature-flags';
import { getAllExistingGroups, getConnectedGroups } from '../services/group';
import { setupAndValidateWebhook } from '../services/webhooks';
import { getForgeAppId } from '../utils/get-forge-app-id';
import { STORAGE_KEYS } from '../constants';

export class ImportFailedError extends Error {
  constructor(readonly errorType: ImportErrorTypes, readonly message: string) {
    super(message);
  }
}

export const getFeatures = (): ResolverResponse<FeaturesList> => {
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

export const getFailedProjects = (): Promise<ListResult> => {
  const response = storage.query().where('key', startsWith(STORAGE_KEYS.CURRENT_IMPORT_FAILED_PROJECT_PREFIX));

  return response.getMany();
};

export const getImportResult = async (): Promise<ProjectImportResult> => {
  try {
    const listFailedProjects = await getFailedProjects();
    const failed = listFailedProjects.results.map(({ value }) => value as ImportableProject);
    const total = await storage.get(STORAGE_KEYS.CURRENT_IMPORT_TOTAL_PROJECTS);
    return {
      failed,
      total,
    };
  } catch (err) {
    throw new ImportFailedError(ImportErrorTypes.CANNOT_GET_IMPORT_RESULT, err.message);
  }
};
