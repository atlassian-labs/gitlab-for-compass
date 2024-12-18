import Resolver from '@forge/resolver';

import { CompassComponentTypeObject } from '@atlassian/forge-graphql';
import { getGroupProjects } from '../services/fetch-projects';
import {
  ImportErrorTypes,
  GitlabAPIGroup,
  ResolverResponse,
  ProjectImportResult,
  ImportStatus,
  FeaturesList,
} from '../resolverTypes';
import {
  clearImportResult,
  getImportResult,
  getImportStatus,
  ImportFailedError,
  importProjects,
} from '../services/import-projects';
import { GroupProjectsResponse, TeamsWithMembershipStatus, WebhookSetupConfig } from '../types';
import { getAllComponentTypeIds } from '../client/compass';
import { appId, connectedGroupsInfo, getFeatures, groupsAllExisting, webhookSetupConfig } from './shared-resolvers';
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
