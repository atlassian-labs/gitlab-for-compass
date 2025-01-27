import Resolver from '@forge/resolver';

import { GitlabAPIGroup, ResolverResponse, ProjectImportResult, ImportStatus, FeaturesList } from '../resolverTypes';
import { clearImportResult, getImportResult, getImportStatus } from '../services/import-projects';
import { GroupProjectsResponse, TeamsWithMembershipStatus, WebhookSetupConfig } from '../types';

import {
  appId,
  connectedGroupsInfo,
  getAllComponentTypes,
  getFeatures,
  getGroupsProjects,
  groupsAllExisting,
  importProject,
  webhookSetupConfig,
} from './shared-resolvers';
import { getFirstPageOfTeamsWithMembershipStatus } from '../services/get-teams';
import { getTeamOnboarding, setTeamOnboarding } from '../services/onboarding';

const resolver = new Resolver();

resolver.define('groups/connectedInfo', async (): Promise<ResolverResponse<GitlabAPIGroup[]>> => {
  return connectedGroupsInfo();
});

resolver.define('groups/allExisting', async (): Promise<ResolverResponse<GitlabAPIGroup[]>> => {
  return groupsAllExisting();
});

resolver.define('groups/projects', async (req): Promise<ResolverResponse<GroupProjectsResponse>> => {
  return getGroupsProjects(req);
});

resolver.define('project/import', async (req): Promise<ResolverResponse> => {
  return importProject(req);
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

resolver.define('features', (req): ResolverResponse<FeaturesList> => {
  const {
    context: { cloudId },
  } = req;

  return getFeatures(cloudId);
});

resolver.define('appId', (): ResolverResponse<string> => {
  return appId();
});

resolver.define('webhooks/setupConfig', async (): Promise<ResolverResponse<WebhookSetupConfig>> => {
  return webhookSetupConfig();
});

resolver.define('getAllCompassComponentTypes', getAllComponentTypes);

resolver.define(
  'getFirstPageOfTeamsWithMembershipStatus',
  async (req): Promise<ResolverResponse<{ teams: TeamsWithMembershipStatus }>> => {
    const { cloudId, accountId } = req.context;
    const { searchTeamValue } = req.payload;

    try {
      const teams = await getFirstPageOfTeamsWithMembershipStatus(cloudId, accountId, searchTeamValue);
      return { success: true, data: { teams } };
    } catch (e) {
      return {
        success: false,
        errors: [{ message: e.message }],
      };
    }
  },
);

resolver.define(
  'onboarding/team/get',
  async (req): Promise<ResolverResponse<{ isTeamOnboardingCompleted: boolean }>> => {
    const { accountId } = req.context;

    try {
      const isTeamOnboardingCompleted = await getTeamOnboarding(accountId);

      return { success: true, data: { isTeamOnboardingCompleted } };
    } catch (e) {
      return {
        success: false,
        errors: [{ message: e.message }],
      };
    }
  },
);

resolver.define('onboarding/team/set', async (req): Promise<ResolverResponse> => {
  const { accountId } = req.context;

  try {
    await setTeamOnboarding(accountId);

    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errors: [{ message: e.message }],
    };
  }
});

export default resolver.getDefinitions();
