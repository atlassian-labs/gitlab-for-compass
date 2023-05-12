import { storage } from '@forge/api';
import parse from 'url-parse';

import { getOwnedProjectsBySearchCriteria } from '../client/gitlab';
import { STORAGE_SECRETS } from '../constants';
import { getGroupIds } from '../utils/storage-utils';
import { GitlabAPIProject } from '../types';

export const extractProjectInformation = (projectUrl: string): { projectName: string; pathName: string } | null => {
  const parsedUrl = parse(projectUrl);
  const splitPath = parsedUrl.pathname.split('/');

  if (!parsedUrl.hostname.match(/gitlab\.com/)) {
    throw new Error('Provided link is not Gitlab url');
  }

  return { projectName: splitPath[splitPath.length - 1], pathName: parsedUrl.pathname };
};

export const getAllGroupTokens = async (): Promise<string[]> => {
  const groupIds = await getGroupIds();
  const groupTokens = await Promise.all(
    groupIds.map((groupId) => storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`)),
  );

  return groupTokens;
};

export const getProjectDataFromUrl = async (
  url: string,
): Promise<{ project: GitlabAPIProject; groupToken: string }> => {
  try {
    const { projectName, pathName } = extractProjectInformation(url);
    const groupTokens = await getAllGroupTokens();

    console.log(`[getProjectDataFromUrl] groupTokens count: ${groupTokens.length}`);
    const projectsPromiseResults = await Promise.allSettled(
      groupTokens.map((token) => getOwnedProjectsBySearchCriteria(projectName, token)),
    );
    const projectsResult = projectsPromiseResults.reduce<{ projects: GitlabAPIProject[]; projectIndex: number | null }>(
      (result, currentProjectResult, index) => {
        if (currentProjectResult.status === 'fulfilled') {
          result.projects.push(...currentProjectResult.value);

          return {
            ...result,
            projectIndex: index,
          };
        }

        return result;
      },
      { projects: [], projectIndex: null },
    );
    console.log(`[getProjectDataFromUrl] projectResults count: ${projectsResult.projects.length}`);

    const groupToken = groupTokens[projectsResult.projectIndex];
    const project = projectsResult.projects.find(({ web_url: webUrl }) => webUrl.includes(pathName));

    if (!groupToken || !project) {
      throw new Error('Project not found');
    }
    console.log(`[getProjectDataFromUrl] project_id: ${project.id}`);
    return { project, groupToken };
  } catch (e) {
    console.log('Data provider link parser failed', e.message);
    return null;
  }
};
