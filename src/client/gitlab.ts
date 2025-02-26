import { fetch } from '@forge/api';
import yaml from 'js-yaml';

import { BASE_URL } from '../constants';
import {
  GitlabAPIGroup,
  GroupAccessToken,
  RegisterWebhookPayload,
  CommitFileDiff,
  CompassYaml,
  GitlabAPIProject,
  ProjectBranch,
  ProjectFile,
  MergeRequestState,
  MergeRequest,
  GitlabApiPipeline,
  Deployment,
  Environment,
  GitlabPipelineStates,
  GitLabAccessLevels,
} from '../types';
import { GitlabHttpMethodError, InvalidConfigFileError } from '../models/errors';
import { INVALID_YAML_ERROR } from '../models/error-messages';
import { queryParamsGenerator } from '../utils/url-utils';
import { isGitlabMaintainerTokenEnabled } from '../services/feature-flags';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum GitLabContentType {
  JSON = 'application/json',
  RAW = 'text/plain; charset=utf-8',
}
type CallGitLabConfig = {
  method?: HttpMethod;
  contentType?: GitLabContentType;
};

export enum GitLabHeaders {
  PAGINATION_TOTAL = 'x-total',
}

export type GitlabPaginatedFetch<D, P> = (
  page: number,
  perPage: number,
  fetchFnParameters: Record<'groupToken', string> & P,
) => Promise<{ data: D[]; headers: Headers }>;

export enum MergeRequestWorkInProgressFilterOptions {
  ONLY_WIP = 'yes',
  FILTER_OUT_WIP = 'no',
}

export enum MergeRequestResultViewOptions {
  SIMPLE = 'simple',
  DEFAULT = 'default',
}

function isTextBody(config?: CallGitLabConfig) {
  return config?.contentType === GitLabContentType.RAW;
}

export const callGitlab = async (
  apiOperation: string,
  path: string,
  authToken: string,
  config?: CallGitLabConfig,
  body?: string,
): Promise<any> => {
  const startTime = performance.now();

  try {
    console.log(`Calling gitlab to ${apiOperation}`);
    const resp = await fetch(`${BASE_URL}${path}`, {
      method: config?.method || HttpMethod.GET,
      headers: {
        'PRIVATE-TOKEN': authToken,
        Accept: config?.contentType || GitLabContentType.JSON,
        'Content-Type': config?.contentType || GitLabContentType.JSON,
      },
      body,
    });

    console.log(`Gitlab response status: ${resp.status}`);

    if (resp.status === 204) {
      // no content, we can just return here
      return null;
    }

    if (resp.status >= 300) {
      const msg = isTextBody(config) ? await resp.text() : JSON.stringify(await resp.json());
      console.warn(`Gitlab client received a status code of ${resp.status} while making the request. Error: ${msg}`);
      throw new GitlabHttpMethodError(resp.status, resp.statusText);
    }

    if (isTextBody(config)) {
      return resp.text();
    }

    return { data: await resp.json(), headers: resp.headers };
  } finally {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`GitLab API call to ${apiOperation} took ${duration.toFixed(2)} ms`);
  }
};

export const getGroupsData = async (
  groupAccessToken: string,
  owned?: string,
  minAccessLevel?: number,
  name?: string,
  pageSize = 100,
): Promise<GitlabAPIGroup[]> => {
  const params = {
    ...(owned ? { owned } : {}),
    ...(minAccessLevel ? { min_access_level: minAccessLevel.toString() } : {}),
    ...(name ? { search: name } : {}),
    ...(pageSize ? { per_page: pageSize.toString() } : {}),
  };

  const queryParams = queryParamsGenerator(params);

  const { data } = await callGitlab(`getGroupsData`, `/api/v4/groups?${queryParams}`, groupAccessToken);

  console.log('Number of groups fetched:', data.length);

  return data;
};

export const registerGroupWebhook = async (payload: RegisterWebhookPayload): Promise<number> => {
  const { groupId, token: groupToken, url, signature } = payload;
  const {
    data: { id },
  } = await callGitlab(
    `register webhook`,
    `/api/v4/groups/${groupId}/hooks`,
    groupToken,
    { method: HttpMethod.POST },
    JSON.stringify({
      url,
      token: signature,
      push_events: true,
      merge_requests_events: true,
      pipeline_events: true,
      deployment_events: true,
    }),
  );

  return id;
};

export const deleteGroupWebhook = async (groupId: number, hookId: number, groupToken: string): Promise<void> => {
  try {
    await callGitlab('delete webhook', `/api/v4/groups/${groupId}/hooks/${hookId}`, groupToken, {
      method: HttpMethod.DELETE,
    });
  } catch (e) {
    if (e.statusText.includes('Not Found')) {
      return;
    }
    throw e;
  }
};

export const getGroupWebhook = async (
  groupId: number,
  hookId: number,
  groupToken: string,
): Promise<{ id: number } | null> => {
  try {
    const { data: webhook } = await callGitlab('get webhook', `/api/v4/groups/${groupId}/hooks/${hookId}`, groupToken);

    return webhook;
  } catch (e) {
    if (e.statusText.includes('Not Found')) {
      return null;
    }
    throw e;
  }
};

export const getGroupAccessTokens = async (
  groupToken: string,
  groupId: number,
  state = 'active',
  pageSize = 100,
): Promise<GroupAccessToken[]> => {
  const params = {
    ...(state ? { state } : {}),
    ...(pageSize ? { per_page: pageSize.toString() } : {}),
  };
  const queryParams = queryParamsGenerator(params);

  const { data: groupAccessTokenList } = await callGitlab(
    'get group access tokens',
    `/api/v4/groups/${groupId}/access_tokens?${queryParams}`,
    groupToken,
  );

  console.log('Number of active access tokens fetched:', groupAccessTokenList.length);

  return groupAccessTokenList;
};

export const getCommitDiff = async (groupToken: string, projectId: number, sha: string): Promise<CommitFileDiff[]> => {
  const { data: diff } = await callGitlab(
    'get commit diff',
    `/api/v4/projects/${projectId}/repository/commits/${sha}/diff`,
    groupToken,
  );

  return diff;
};

export const listFiles = async (
  groupToken: string,
  projectId: number,
  path?: string,
  ref?: string,
  pageToken?: string,
  pageSize?: number,
  recursive?: boolean,
): Promise<ProjectFile[]> => {
  const params = {
    pagination: 'keyset',
    ...(pageSize ? { per_page: pageSize.toString() } : {}),
    ...(pageToken ? { page_token: pageToken } : {}),
    ...(recursive ? { recursive: recursive.toString() } : {}),
    ...(ref ? { ref } : {}),
    ...(path ? { path } : {}),
  };

  const queryParams = queryParamsGenerator(params);
  const { data } = await callGitlab(
    'list files in path',
    `/api/v4/projects/${projectId}/repository/tree?${queryParams}`,
    groupToken,
  );

  return data;
};

export const getRawFileContent = async (
  groupToken: string,
  projectId: number,
  filePath: string,
  ref?: string,
): Promise<string> => {
  const params = {
    ...(ref ? { ref } : {}),
  };

  const queryParams = queryParamsGenerator(params);
  return callGitlab(
    'get file contents',
    `/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?${queryParams}`,
    groupToken,
    { contentType: GitLabContentType.RAW },
  );
};

export const getFileContent = async (
  groupToken: string,
  projectId: number,
  filePath: string,
  ref: string,
): Promise<CompassYaml> => {
  const fileRaw = await getRawFileContent(groupToken, projectId, filePath, ref);

  try {
    return yaml.load(fileRaw);
  } catch (e) {
    console.warn({ message: 'Error parsing yaml file', error: e });
    throw new InvalidConfigFileError([INVALID_YAML_ERROR]);
  }
};

export const getProjects = async (
  groupToken: string,
  groupId: number,
  page: number,
  perPage: number,
  search?: string,
  orderBy?: string,
): Promise<{ data: GitlabAPIProject[]; headers: Headers }> => {
  const params = {
    include_subgroups: 'true',
    page: page.toString(),
    per_page: perPage.toString(),
    ...(orderBy ? { order_by: orderBy } : {}),
    ...(search ? { search } : {}),
  };

  const queryParams = queryParamsGenerator(params);
  const { data, headers } = await callGitlab(
    'get projects',
    `/api/v4/groups/${groupId}/projects?${queryParams}`,
    groupToken,
  );

  return { data, headers };
};

export const getProjectById = async (groupToken: string, projectId: number): Promise<GitlabAPIProject> => {
  const { data: project } = await callGitlab('get project by id', `/api/v4/projects/${projectId}`, groupToken);

  return project;
};

export const getProjectLanguages = async (groupToken: string, projectId: number) => {
  const { data: languages } = await callGitlab(
    'get project languages',
    `/api/v4/projects/${projectId}/languages`,
    groupToken,
  );

  return languages;
};

export const getProjectVariable = async (
  groupToken: string,
  projectId: number,
  variable: string,
): Promise<string | null | never> => {
  const {
    data: { value },
  } = await callGitlab(
    `get variable ${variable}. It is normal for the request to 404 if the variable does not exist.`,
    `/api/v4/projects/${projectId}/variables/${variable}`,
    groupToken,
  );
  return value;
};

export const getProjectBranch = async (
  groupToken: string,
  projectId: number,
  branchName: string,
): Promise<ProjectBranch> => {
  const { data: branch } = await callGitlab(
    'get project branch',
    `/api/v4/projects/${projectId}/repository/branches/${branchName}`,
    groupToken,
  );
  return branch;
};

/**
 * Get project data filtered by search criteria.
 * @param search - search criteria i.e. project name
 * @param groupToken - Gitlab access token
 */
export const getMaintainedProjectsBySearchCriteria = async (
  search: string,
  groupToken: string,
): Promise<GitlabAPIProject[]> => {
  const roleFilter = isGitlabMaintainerTokenEnabled()
    ? { min_access_level: GitLabAccessLevels.MAINTAINER.toString() }
    : { owned: 'true' };

  const params = {
    ...roleFilter,
    search,
  };

  const queryParams = queryParamsGenerator(params);
  const { data } = await callGitlab(
    'get owned projects by search criteria',
    `/api/v4/projects?${queryParams}`,
    groupToken,
  );

  return data;
};

export const getProjectRecentDeployments: GitlabPaginatedFetch<
  Deployment,
  {
    projectId: number;
    dateAfter: string; // in iso date time format, e.g. 2019-03-15T08:00:00Z
    environmentName: string;
    dateBefore?: string; // in iso date time format, e.g. 2019-03-15T08:00:00Z
  }
> = async (page, perPage, fetchParameters) => {
  const { groupToken, projectId, dateAfter, dateBefore, environmentName } = fetchParameters;
  const params = {
    updated_after: dateAfter,
    order_by: 'updated_at',
    environment: environmentName,
    page: page.toString(),
    per_page: perPage.toString(),
    ...(dateBefore ? { updated_before: dateBefore } : {}),
  };

  const queryParams = queryParamsGenerator(params);
  const path = `/api/v4/projects/${projectId}/deployments?${queryParams}`;

  const { data, headers } = await callGitlab("get project's recent deployments", path, groupToken);

  return { data, headers };
};

export const getMergeRequests: GitlabPaginatedFetch<
  MergeRequest,
  {
    groupToken: string;
    projectId: number;
    state: MergeRequestState;
    scope: string;
    targetBranch?: string;
    orderBy?: string;
    wip?: MergeRequestWorkInProgressFilterOptions;
    isSimpleView?: boolean;
    sourceBranch?: string;
  }
> = async (page, perPage, fetchParameters) => {
  const { state, scope, targetBranch, orderBy, wip, isSimpleView, projectId, groupToken, sourceBranch } =
    fetchParameters;

  const params = {
    state,
    page: page.toString(),
    per_page: perPage.toString(),
    scope,
    ...(targetBranch ? { target_branch: targetBranch } : {}),
    ...(orderBy ? { order_by: orderBy } : {}),
    ...(wip ? { wip } : {}),
    ...(isSimpleView ? { view: 'simple' } : {}),
    ...(sourceBranch ? { source_branch: sourceBranch } : {}),
  };

  const queryParams = queryParamsGenerator(params);
  const path = `/api/v4/projects/${projectId}/merge_requests?${queryParams}`;

  const { data, headers } = await callGitlab('get merge requests', path, groupToken);

  return { data, headers };
};

export const getProjectDeploymentById = async (projectId: number, deploymentId: number, groupToken: string) => {
  const { data } = await callGitlab(
    'get project deployment by id',
    `/api/v4/projects/${projectId}/deployments/${deploymentId}`,
    groupToken,
  );

  return data;
};

export const getEnvironments = async (
  projectId: number,
  groupToken: string,
  pageSize = 100,
): Promise<Environment[]> => {
  const params = {
    ...(pageSize ? { per_page: pageSize.toString() } : {}),
  };
  const queryParams = queryParamsGenerator(params);

  const { data } = await callGitlab(
    "get project's environments",
    `/api/v4/projects/${projectId}/environments?${queryParams}`,
    groupToken,
  );

  console.log('Number of environments fetched:', data.length);

  return data;
};

export const getProjectRecentPipelines: GitlabPaginatedFetch<
  GitlabApiPipeline,
  {
    projectId: number;
    dateAfter?: string; // in iso date time format, e.g. 2019-03-15T08:00:00Z
    branchName: string;
    status?: GitlabPipelineStates;
  }
> = async (page, perPage, fetchParameters) => {
  const { groupToken, projectId, dateAfter, branchName, status } = fetchParameters;
  const params = {
    ref: branchName,
    page: page.toString(),
    per_page: perPage.toString(),
    ...(status ? { status } : {}),
    ...(dateAfter ? { updated_after: dateAfter } : {}),
  };

  const queryParams = queryParamsGenerator(params);
  const path = `/api/v4/projects/${projectId}/pipelines?${queryParams}`;

  const { data, headers } = await callGitlab("get project's recent pipelines", path, groupToken);
  return { data, headers };
};

export const createFileInProject = async (
  groupToken: string,
  projectId: number,
  filePath: string,
  branchName: string,
  startBranchName: string,
  encoding: string,
  content: string,
  commitMessage: string,
) => {
  const path = `/api/v4/projects/${projectId}/repository/files/${filePath}`;

  const { data } = await callGitlab(
    'create file in project',
    path,
    groupToken,
    { method: HttpMethod.POST },
    JSON.stringify({
      branch: branchName,
      start_branch: startBranchName,
      encoding,
      content,
      commit_message: commitMessage,
    }),
  );

  return data;
};

export const createMergeRequest = async (
  groupToken: string,
  projectId: number,
  sourceBranch: string,
  targetBranch: string,
  title: string,
  description: string,
  removeSourceBranch: boolean,
) => {
  const path = `/api/v4/projects/${projectId}/merge_requests`;

  const { data } = await callGitlab(
    'create merge request',
    path,
    groupToken,
    { method: HttpMethod.POST },
    JSON.stringify({
      source_branch: sourceBranch,
      target_branch: targetBranch,
      title,
      description,
      remove_source_branch: removeSourceBranch,
    }),
  );

  return data;
};
