import { storage } from '@forge/api';
import parse from 'url-parse';

import { getMaintainedProjectsBySearchCriteria } from '../client/gitlab';
import { STORAGE_SECRETS } from '../constants';
import { getGroupIds } from '../utils/storage-utils';
import { GitlabAPIProject, TokenFetchResult } from '../types';
import { getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';

export const extractProjectInformation = (projectUrl: string): { projectName: string; pathName: string } | null => {
  const parsedUrl = parse(projectUrl);
  const splitPath = parsedUrl.pathname.split('/');

  if (!parsedUrl.hostname.match(/gitlab\.com/)) {
    throw new Error('Provided link is not Gitlab url');
  }

  return { projectName: splitPath[splitPath.length - 1], pathName: parsedUrl.pathname };
};

export const getAllGroupTokens = async (): Promise<TokenFetchResult[]> => {
  try {
    const groupIds = await getGroupIds();
    // console.log(`[getAllGroupTokens] groupIds: ${groupIds}`);
    const groupTokensResult = await Promise.allSettled(
      groupIds.map(async (groupId) => ({
        token: await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`),
        groupId,
      })),
    );

    if (hasRejections(groupTokensResult)) {
      throw new Error(`Error getting group tokens ${getFormattedErrors(groupTokensResult)}`);
    }

    return groupTokensResult.map(
      (groupTokenResult) => (groupTokenResult as PromiseFulfilledResult<TokenFetchResult>).value,
    );
  } catch (e) {
    throw new Error(`Error while getting all group tokens: ${e}`);
  }
};

function doesURLMatch(projectUrl: string, path: string, name: string) {
  const parsedUrl = parse(projectUrl);
  const urlPath = parsedUrl.pathname;
  const pathItems = urlPath.split('/');
  const projectName = pathItems[pathItems.length - 1];

  return urlPath === path && projectName === name;
}

export const getProjectDataFromUrl = async (
  url: string,
): Promise<{ project: GitlabAPIProject; groupToken: string; groupId: number } | null> => {
  try {
    const { projectName, pathName } = extractProjectInformation(url);
    const groupTokens = await getAllGroupTokens();

    const projectsPromiseResults = await Promise.allSettled(
      groupTokens.map((groupToken) => getMaintainedProjectsBySearchCriteria(projectName, groupToken.token)),
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

    const { groupId, token: groupToken } = groupTokens[projectsResult.projectIndex];
    const project = projectsResult.projects.find(({ web_url: webUrl }) => doesURLMatch(webUrl, pathName, projectName));

    if (!groupToken || !project) {
      throw new Error('Project not found');
    }
    return { project, groupToken, groupId };
  } catch (e) {
    console.log('Data provider link parser failed', e.message);
    return null;
  }
};
