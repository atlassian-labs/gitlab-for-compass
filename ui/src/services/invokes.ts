import { invoke } from '@forge/bridge';
import { CompassComponentTypeObject } from '@atlassian/forge-graphql';
import {
  ImportableProject,
  ImportStatus,
  GitlabAPIGroup,
  ResolverResponse,
  ProjectImportResult,
  FeaturesList,
  GroupProjectsResponse,
} from '../resolverTypes';

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

export const connectGroup = (groupToken: string, groupTokenName: string): Promise<ResolverResponse> => {
  return invoke<ResolverResponse>('groups/connect', {
    groupToken,
    groupTokenName,
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
): Promise<ResolverResponse<GroupProjectsResponse>> => {
  return invoke<ResolverResponse<GroupProjectsResponse>>('groups/projects', {
    groupId,
    page,
    groupTokenId,
    search,
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
