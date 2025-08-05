import { CreateLinkInput, Link } from '@atlassian/forge-graphql-types';
import { storage } from '@forge/api';

import { getComponentByExternalAlias } from '../client/compass';
import { COMPASS_YML_BRANCH, EXTERNAL_SOURCE, STORAGE_SECRETS } from '../constants';
import { getMergeRequests, getProjects, GitLabHeaders } from '../client/gitlab';
import {
  CompareProjectWithExistingComponent,
  GroupProjectsResponse,
  MergeRequestState,
  Project,
  ProjectReadyForImport,
} from '../types';
import { getProjectLabels } from './get-labels';
import { ALL_SETTLED_STATUS, getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';

const PER_PAGE = 10;

const mapComponentLinks = (links: Link[] = []): CreateLinkInput[] =>
  links.map((link) => {
    return { url: link.url, type: link.type };
  });

const fetchProjects = async (
  groupToken: string,
  groupId: number,
  page: number,
  search?: string,
  perPage = PER_PAGE,
): Promise<{ total: number; projects: Project[] }> => {
  try {
    const { data: projects, headers } = await getProjects(groupToken, groupId, page, perPage, search);

    const generatedProjectsWithLanguagesResult = await Promise.allSettled(
      projects.map(async (project) => {
        const labels = await getProjectLabels(project.id, groupToken, project.topics);

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          url: project.web_url,
          defaultBranch: project.default_branch,
          groupName: project.namespace.name,
          groupPath: project.namespace.path,
          groupFullPath: project.namespace.full_path,
          labels,
        };
      }),
    );

    if (hasRejections(generatedProjectsWithLanguagesResult)) {
      throw new Error(
        `Error getting projects with languages: ${getFormattedErrors(generatedProjectsWithLanguagesResult)}`,
      );
    }

    const generatedProjectsWithLanguages = generatedProjectsWithLanguagesResult.map(
      (generatedProjectWithLanguagesResult) =>
        (generatedProjectWithLanguagesResult as PromiseFulfilledResult<Project>).value,
    );

    return { total: Number(headers.get(GitLabHeaders.PAGINATION_TOTAL)), projects: generatedProjectsWithLanguages };
  } catch (err) {
    const ERROR_MESSAGE = 'Error while fetching group projects from Gitlab!';

    console.error(ERROR_MESSAGE, err);
    throw new Error(ERROR_MESSAGE);
  }
};

export const compareProjectWithExistingComponent = async (
  cloudId: string,
  projectId: number,
  groupToken: string,
): Promise<CompareProjectWithExistingComponent> => {
  try {
    const [componentByExtenalAliasResult, mergeRequestsResults] = await Promise.allSettled([
      getComponentByExternalAlias({
        cloudId,
        externalId: projectId.toString(),
        externalSource: EXTERNAL_SOURCE,
        options: { includeLinks: true, includeCustomFields: false },
      }),
      getMergeRequests(1, 1, {
        projectId,
        groupToken,
        scope: 'all',
        sourceBranch: COMPASS_YML_BRANCH,
        state: MergeRequestState.OPENED,
      }),
    ]);

    // TODO: DELETE AFTER DEBUGGING
    if (
      cloudId === '3fee7fa3-4663-4c14-9767-2308819c9e77' &&
      mergeRequestsResults.status === ALL_SETTLED_STATUS.REJECTED
    ) {
      const errorReason = (mergeRequestsResults as PromiseRejectedResult).reason;
      if (errorReason && typeof errorReason === 'string' && errorReason.includes('403')) {
        console.error(`[DEBUG] 403 error on merge requests call for project ${projectId} ${errorReason} ${cloudId}`);
      }
    }

    if (
      componentByExtenalAliasResult.status === ALL_SETTLED_STATUS.REJECTED ||
      mergeRequestsResults.status === ALL_SETTLED_STATUS.REJECTED
    ) {
      throw new Error(
        `Error getting component by external alias or merge requests: ${getFormattedErrors([
          componentByExtenalAliasResult,
          mergeRequestsResults,
        ])}`,
      );
    }

    const { component } = componentByExtenalAliasResult.value;
    const { data: mergeRequestWithCompassYML } = mergeRequestsResults.value;

    return {
      isManaged: Boolean(component?.dataManager),
      hasComponent: Boolean(component?.id) || Boolean(mergeRequestWithCompassYML.length),
      isCompassFilePrOpened: Boolean(mergeRequestWithCompassYML.length),
      componentId: component?.id,
      componentLinks: mapComponentLinks(component?.links),
      typeId: component?.typeId,
    };
  } catch (err) {
    const ERROR_MESSAGE = 'Error while getting repository additional fields.';

    console.error(ERROR_MESSAGE, err);
    throw new Error(ERROR_MESSAGE);
  }
};

export const sortProjects = (projects: ProjectReadyForImport[]): ProjectReadyForImport[] => {
  const groupedProjects: { [key: string]: ProjectReadyForImport[] } = {};

  projects.forEach((project) => {
    groupedProjects[project.groupFullPath] = groupedProjects[project.groupFullPath]
      ? [...groupedProjects[project.groupFullPath], project]
      : [project];
  });

  return Object.values(groupedProjects)
    .map((group) => {
      return group.sort((a, b) => a.name.localeCompare(b.name));
    })
    .flat();
};

export const getGroupProjects = async (
  cloudId: string,
  groupId: number,
  page: number,
  groupTokenId: number,
  search?: string,
  perPage?: number,
): Promise<GroupProjectsResponse> => {
  try {
    const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupTokenId}`);

    const { projects, total } = await fetchProjects(groupToken, groupId, page, search, perPage);

    const checkedDataWithExistingComponentsResults = await Promise.allSettled(
      projects.map(({ id: projectId }) => {
        return compareProjectWithExistingComponent(cloudId, projectId, groupToken);
      }),
    );

    if (hasRejections(checkedDataWithExistingComponentsResults)) {
      throw new Error(
        `Error checking project with existing components: ${getFormattedErrors(
          checkedDataWithExistingComponentsResults,
        )}`,
      );
    }

    const checkedDataWithExistingComponents = checkedDataWithExistingComponentsResults.map(
      (checkedDataWithExistingComponentsResult) =>
        (checkedDataWithExistingComponentsResult as PromiseFulfilledResult<CompareProjectWithExistingComponent>).value,
    );

    const resultProjects = projects.map((project, i) => {
      return { ...project, ...checkedDataWithExistingComponents[i] };
    });

    return { total, projects: resultProjects };
  } catch (e) {
    throw new Error(`Error while getting group projects: ${e}`);
  }
};
