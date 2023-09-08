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
  MergeRequestState,
  MergeRequest,
  GitlabApiPipeline,
  Deployment,
  Environment,
  GitlabPipelineStates,
} from '../types';
import { GitlabHttpMethodError, InvalidConfigFileError } from '../models/errors';
import { INVALID_YAML_ERROR } from '../models/error-messages';
import { queryParamsGenerator } from '../utils/url-utils';

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
  path: string,
  authToken: string,
  config?: CallGitLabConfig,
  body?: string,
): Promise<any> => {
  const resp = await fetch(`${BASE_URL}${path}`, {
    method: config?.method || HttpMethod.GET,
    headers: {
      'PRIVATE-TOKEN': authToken,
      Accept: config?.contentType || GitLabContentType.JSON,
    },
    body,
  });

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
};

export const getGroupsData = async (
  groupAccessToken: string,
  owned?: string,
  minAccessLevel?: number,
): Promise<GitlabAPIGroup[]> => {
  const params = {
    ...(owned ? { owned } : {}),
    ...(minAccessLevel ? { min_access_level: minAccessLevel.toString() } : {}),
  };

  const queryParams = queryParamsGenerator(params);

  console.log(`Calling gitlab to get groups. Query params: ${queryParams}`);
  const { data } = await callGitlab(`/api/v4/groups?${queryParams}`, groupAccessToken);

  return data;
};

export const registerGroupWebhook = async (payload: RegisterWebhookPayload): Promise<number> => {
  const { groupId, token: groupToken, url, signature } = payload;
  console.log(`Calling gitlab to register webhook`);
  const {
    data: { id },
  } = await callGitlab(
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
    console.log(`Calling gitlab to delete webhook`);
    await callGitlab(`/api/v4/groups/${groupId}/hooks/${hookId}`, groupToken, { method: HttpMethod.DELETE });
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
    console.log(`Calling gitlab to get webhook`);
    const { data: webhook } = await callGitlab(`/api/v4/groups/${groupId}/hooks/${hookId}`, groupToken);

    return webhook;
  } catch (e) {
    if (e.statusText.includes('Not Found')) {
      return null;
    }
    throw e;
  }
};

export const getGroupAccessTokens = async (groupToken: string, groupId: number): Promise<GroupAccessToken[]> => {
  console.log(`Calling gitlab to get group access tokens`);
  const { data: groupAccessTokenList } = await callGitlab(`/api/v4/groups/${groupId}/access_tokens`, groupToken);

  return groupAccessTokenList;
};

export const getCommitDiff = async (groupToken: string, projectId: number, sha: string): Promise<CommitFileDiff[]> => {
  console.log(`Calling gitlab to get commit diff`);
  const { data: diff } = await callGitlab(`/api/v4/projects/${projectId}/repository/commits/${sha}/diff`, groupToken);

  return diff;
};

export const getFileContent = async (
  groupToken: string,
  projectId: number,
  filePath: string,
  ref: string,
): Promise<CompassYaml> => {
  const params = {
    ref,
  };

  const queryParams = queryParamsGenerator(params);
  console.log(`Calling gitlab to get file content`);
  const fileRaw = await callGitlab(
    `/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?${queryParams}`,
    groupToken,
    { contentType: GitLabContentType.RAW },
  );

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
): Promise<{ data: GitlabAPIProject[]; headers: Headers }> => {
  const params = {
    include_subgroups: 'true',
    page: page.toString(),
    per_page: perPage.toString(),
    ...(search ? { search } : {}),
  };

  const queryParams = queryParamsGenerator(params);
  console.log(`Calling gitlab to get projects`);
  const { data, headers } = await callGitlab(`/api/v4/groups/${groupId}/projects?${queryParams}`, groupToken);

  return { data, headers };
};

export const getProjectById = async (groupToken: string, projectId: number): Promise<GitlabAPIProject> => {
  console.log(`Calling gitlab to get project by id`);
  const { data: project } = await callGitlab(`/api/v4/projects/${projectId}`, groupToken);

  return project;
};

export const getProjectLanguages = async (groupToken: string, projectId: number) => {
  console.log(`Calling gitlab to get project languages`);
  const { data: languages } = await callGitlab(`/api/v4/projects/${projectId}/languages`, groupToken);

  return languages;
};

export const getProjectVariable = async (
  groupToken: string,
  projectId: number,
  variable: string,
): Promise<string | null | never> => {
  console.log(
    `Calling gitlab to get project variable ${variable}. It is normal for the request to 404 if the variable does not exist.`,
  );
  const {
    data: { value },
  } = await callGitlab(`/api/v4/projects/${projectId}/variables/${variable}`, groupToken);
  return value;
};

export const getProjectBranch = async (
  groupToken: string,
  projectId: number,
  branchName: string,
): Promise<ProjectBranch> => {
  console.log(`Calling gitlab to get project branch`);
  const { data: branch } = await callGitlab(
    `/api/v4/projects/${projectId}/repository/branches/${branchName}`,
    groupToken,
  );
  return branch;
};

export const getOwnedProjectsBySearchCriteria = async (
  search: string,
  groupToken: string,
): Promise<GitlabAPIProject[]> => {
  const params = {
    owned: 'true',
    search,
  };

  const queryParams = queryParamsGenerator(params);
  console.log(`Calling gitlab to get owned projects by search criteria`);
  const { data } = await callGitlab(`/api/v4/projects?${queryParams}`, groupToken);

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

  console.log(`Calling gitlab to get project recent deployments`);
  const { data, headers } = await callGitlab(path, groupToken);

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

  console.log(`Calling gitlab to get merge requests`);
  const { data, headers } = await callGitlab(path, groupToken);

  return { data, headers };
};

export const getProjectDeploymentById = async (projectId: number, deploymentId: number, groupToken: string) => {
  console.log(`Calling gitlab to get project deployment by id`);
  const { data } = await callGitlab(`/api/v4/projects/${projectId}/deployments/${deploymentId}`, groupToken);

  return data;
};

export const getEnvironments = async (projectId: number, groupToken: string): Promise<Environment[]> => {
  console.log(`Calling gitlab to get environments`);
  const { data } = await callGitlab(`/api/v4/projects/${projectId}/environments`, groupToken);

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

  console.log(`Calling gitlab to get project recent pipelines`);
  const { data, headers } = await callGitlab(path, groupToken);
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

  console.log(`Calling gitlab to create file in project`);
  const { data } = await callGitlab(
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

  console.log(`Calling gitlab to create merge request`);
  const { data } = await callGitlab(
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
