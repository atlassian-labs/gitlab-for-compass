import { CreateLinkInput, Link } from '@atlassian/forge-graphql';
import { storage } from '@forge/api';

import { getComponentByExternalAlias } from '../client/compass';
import { COMPASS_YML_BRANCH, STORAGE_SECRETS } from '../constants';
import { getMergeRequests, getProjects, GitLabHeaders } from '../client/gitlab';
import { GroupProjectsResponse, MergeRequestState, Project, ProjectReadyForImport } from '../types';
import { getProjectLabels } from './get-labels';

const mapComponentLinks = (links: Link[] = []): CreateLinkInput[] =>
  links.map((link) => {
    return { url: link.url, type: link.type };
  });

const fetchProjects = async (
  groupToken: string,
  groupId: number,
  page: number,
  search?: string,
): Promise<{ total: number; projects: Project[] }> => {
  try {
    const PER_PAGE = 10;
    const { data: projects, headers } = await getProjects(groupToken, groupId, page, PER_PAGE, search);

    const generatedProjectsWithLanguages = await Promise.all(
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

    return { total: Number(headers.get(GitLabHeaders.PAGINATION_TOTAL)), projects: generatedProjectsWithLanguages };
  } catch (err) {
    const ERROR_MESSAGE = 'Error while fetching group projects from Gitlab!';

    console.error(ERROR_MESSAGE, err);
    throw new Error(ERROR_MESSAGE);
  }
};

const compareProjectWithExistingComponent = async (cloudId: string, projectId: number, groupToken: string) => {
  try {
    const [{ component }, { data: mergeRequestWithCompassYML }] = await Promise.all([
      getComponentByExternalAlias({
        cloudId,
        externalId: projectId.toString(),
        options: { includeLinks: true },
      }),
      getMergeRequests(1, 1, {
        projectId,
        groupToken,
        scope: 'all',
        sourceBranch: COMPASS_YML_BRANCH,
        state: MergeRequestState.OPENED,
      }),
    ]);

    return {
      isManaged: Boolean(component?.dataManager),
      hasComponent: Boolean(component?.id) || Boolean(mergeRequestWithCompassYML.length),
      isCompassFilePrOpened: Boolean(mergeRequestWithCompassYML.length),
      componentId: component?.id,
      componentLinks: mapComponentLinks(component?.links),
      componentType: component?.type,
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
): Promise<GroupProjectsResponse> => {
  const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupTokenId}`);

  const { projects, total } = await fetchProjects(groupToken, groupId, page, search);

  const checkedDataWithExistingComponents = await Promise.all(
    projects.map(({ id: projectId }) => {
      return compareProjectWithExistingComponent(cloudId, projectId, groupToken);
    }),
  ).catch((err) => {
    throw new Error(err);
  });

  const resultProjects = projects.map((project, i) => {
    return { ...project, ...checkedDataWithExistingComponents[i] };
  });

  return { total, projects: resultProjects };
};
