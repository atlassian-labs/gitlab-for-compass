import { AuthErrorTypes, DefaultErrorTypes, FeaturesList, GitlabAPIGroup, ResolverResponse } from '../resolverTypes';
import { listFeatures } from '../services/feature-flags';
import { getAllExistingGroups, getConnectedGroups } from '../services/group';
import { setupAndValidateWebhook } from '../services/webhooks';
import { getForgeAppId } from '../utils/get-forge-app-id';

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
