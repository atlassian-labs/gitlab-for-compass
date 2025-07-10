import { invoke } from '@forge/bridge';
import { CompassComponentTypeObject, Component } from '@atlassian/forge-graphql-types';

import {
  ImportableProject,
  ImportStatus,
  GitlabAPIGroup,
  ResolverResponse,
  ProjectImportResult,
  FeaturesList,
  GroupProjectsResponse,
} from '../resolverTypes';

import { GitLabRoles, TeamsWithMembershipStatus, WebhookSetupConfig } from '../types';

export const disconnectGroup = (id: number): Promise<ResolverResponse> => {
  return invoke<ResolverResponse>('groups/disconnect', {
    id,
  });
};

export const connectedInfo = (): Promise<ResolverResponse<GitlabAPIGroup[]>> => {
  return invoke<ResolverResponse<GitlabAPIGroup[]>>('groups/connectedInfo');
};

export const getAllExistingGroups = (): Promise<ResolverResponse<GitlabAPIGroup[]>> => {
  return invoke<ResolverResponse<GitlabAPIGroup[]>>('groups/allExisting');
};

export const getWebhookSetupConfig = (): Promise<ResolverResponse<WebhookSetupConfig>> => {
  return invoke<ResolverResponse<WebhookSetupConfig>>('webhooks/setupConfig');
};

export const resyncConfigAsCode = (groupId: number, page = 1): Promise<ResolverResponse<{ hasNextPage: boolean }>> => {
  return invoke<ResolverResponse<{ hasNextPage: boolean }>>('group/resyncCaC', { groupId, page });
};

export const rotateWebhook = (groupId: number): Promise<ResolverResponse<void>> => {
  return invoke<ResolverResponse<void>>('group/rotateWebhook', {
    groupId,
  });
};

export const getRole = (groupId: number) => {
  return invoke<ResolverResponse<GitLabRoles>>('group/getRole', {
    groupId,
  });
};

export const connectGroup = (
  groupToken: string,
  groupTokenName: string,
  groupName?: string,
  groupRole: string = GitLabRoles.OWNER,
): Promise<ResolverResponse> => {
  return invoke<ResolverResponse>('groups/connect', {
    groupToken,
    groupTokenName,
    groupRole,
    groupName,
  });
};

export const connectInProgressWebhook = (
  groupId: number,
  webhookId: string,
  webhookSecretToken: string,
): Promise<ResolverResponse> => {
  return invoke<ResolverResponse>('webhooks/connectInProgress', {
    groupId,
    webhookId,
    webhookSecretToken,
  });
};

export const importProjects = (
  projectsReadyToImport: ImportableProject[],
  groupId: number,
): Promise<ResolverResponse> => {
  return invoke<ResolverResponse>('project/import', {
    projectsReadyToImport,
    groupId,
  });
};

export const getGroupProjects = (
  groupId: number,
  page: number,
  groupTokenId: number,
  search?: string,
  perPage?: number,
): Promise<ResolverResponse<GroupProjectsResponse>> => {
  return invoke<ResolverResponse<GroupProjectsResponse>>('groups/projects', {
    groupId,
    page,
    groupTokenId,
    search,
    perPage,
  });
};

export const getImportStatus = (): Promise<ResolverResponse<ImportStatus>> => {
  return invoke<ResolverResponse<ImportStatus>>('project/import/status');
};

export const getImportResult = (): Promise<ResolverResponse<ProjectImportResult>> => {
  return invoke<ResolverResponse<ProjectImportResult>>('project/import/result');
};

export const clearResult = (): Promise<ResolverResponse> => {
  return invoke<ResolverResponse>('project/import/clear');
};

export const getLastSyncTime = (): Promise<ResolverResponse<string | null>> => {
  return invoke<ResolverResponse<string | null>>('project/lastSyncTime');
};

export const listFeatures = (): Promise<ResolverResponse<FeaturesList>> => {
  return invoke<ResolverResponse<FeaturesList>>('features');
};

export const getForgeAppId = (): Promise<ResolverResponse<string>> => {
  return invoke<ResolverResponse<string>>('appId');
};

export const getAllCompassComponentTypes = (): Promise<ResolverResponse<CompassComponentTypeObject[]>> => {
  return invoke<ResolverResponse<CompassComponentTypeObject[]>>('getAllCompassComponentTypes');
};

export const getFirstPageOfTeamsWithMembershipStatus = (
  searchTeamValue?: string,
): Promise<ResolverResponse<{ teams: TeamsWithMembershipStatus }>> => {
  return invoke<ResolverResponse<{ teams: TeamsWithMembershipStatus }>>('getFirstPageOfTeamsWithMembershipStatus', {
    searchTeamValue,
  });
};

export const getTeamOnboarding = (): Promise<ResolverResponse<{ isTeamOnboardingCompleted: boolean }>> => {
  return invoke<ResolverResponse<{ isTeamOnboardingCompleted: boolean }>>('onboarding/team/get');
};

export const setTeamOnboarding = (): Promise<ResolverResponse> => {
  return invoke<ResolverResponse>('onboarding/team/set');
};

export const createSingleComponent = (projectToImport: ImportableProject): Promise<ResolverResponse<Component>> => {
  return invoke<ResolverResponse<Component>>('createSingleComponent', {
    projectToImport,
  });
};

export const createMRWithCompassYML = (
  project: ImportableProject,
  componentId: string,
  groupId: number,
): Promise<ResolverResponse> => {
  return invoke<ResolverResponse>('project/createMRWithCompassYML', {
    project,
    componentId,
    groupId,
  });
};
