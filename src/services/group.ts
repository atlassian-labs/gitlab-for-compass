import { Result, startsWith, storage } from '@forge/api';

import { GitLabAccessLevels, GitlabAPIGroup, GroupAccessToken } from '../types';
import { getGroupAccessTokens, getGroupsData } from '../client/gitlab';
import { REQUIRED_SCOPES, STORAGE_KEYS, STORAGE_SECRETS } from '../constants';
import { AuthErrorTypes } from '../resolverTypes';
import { deleteGroupDataFromStorage } from './clear-storage';
import { ALL_SETTLED_STATUS, getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';

export class InvalidGroupTokenError extends Error {
  constructor(public errorType: AuthErrorTypes) {
    super();
    this.message = 'Token validation error.';
  }
}

const findGroupToken = async (
  groupToken: string,
  groupTokenName: string,
  groupId: number,
): Promise<GroupAccessToken | undefined> => {
  const groupAccessTokens = await getGroupAccessTokens(groupToken, groupId);

  return groupAccessTokens.find((groupAccessToken) => groupAccessToken.name === groupTokenName);
};

const validateGroupTokenScopes = (requiredScopes: string[], tokenScopes: string[]) => {
  return requiredScopes.every((requiredScope) => tokenScopes.includes(requiredScope));
};

export const connectGroup = async (token: string, tokenName: string): Promise<number> => {
  let groupId;
  let groupName;
  try {
    const [group] = await getGroupsData(token, 'true');
    ({ id: groupId, name: groupName } = group);
  } catch (e) {
    throw new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_TOKEN);
  }

  const groupToken = await findGroupToken(token, tokenName, groupId);
  if (!groupToken) {
    throw new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_TOKEN_NAME);
  }

  const hasValidScopes = validateGroupTokenScopes(REQUIRED_SCOPES, groupToken.scopes);
  if (!hasValidScopes) {
    throw new InvalidGroupTokenError(AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES);
  }

  await storage.set(`${STORAGE_KEYS.GROUP_KEY_PREFIX}${groupId}`, groupName);
  await storage.setSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`, token);

  return groupId;
};

const getGroups = async (owned?: string, minAccessLevel?: number): Promise<GitlabAPIGroup[]> => {
  const response = storage.query().where('key', startsWith(STORAGE_KEYS.GROUP_KEY_PREFIX));

  const { results: groups } = await response.getMany();

  const tokensResult = await Promise.allSettled(
    groups.map((group: Result) =>
      storage.getSecret(
        `${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${group.key.replace(STORAGE_KEYS.GROUP_KEY_PREFIX, '')}`,
      ),
    ),
  );

  if (hasRejections(tokensResult)) {
    throw new Error(`Error getting tokens ${getFormattedErrors(tokensResult)}`);
  }

  const tokens = tokensResult.map(
    (tokenResult: PromiseSettledResult<string>) => (tokenResult as PromiseFulfilledResult<string>).value,
  );

  const groupPromises = tokens.map((token: string) => getGroupsData(token, owned, minAccessLevel));

  // We need to remove revoked/invalid (on Gitlab side) tokens from storage
  const groupsResult = await Promise.allSettled(groupPromises);

  const reducedGroupsResult = groupsResult.reduce<{
    accessedGroups: GitlabAPIGroup[];
    invalidGroupIds: string[];
  }>(
    (
      result: { accessedGroups: GitlabAPIGroup[]; invalidGroupIds: string[] },
      currentGroupResult: PromiseSettledResult<GitlabAPIGroup[]>,
      i: number,
    ) => {
      if (
        currentGroupResult.status === ALL_SETTLED_STATUS.REJECTED &&
        currentGroupResult.reason.toString().includes('Unauthorized')
      ) {
        result.invalidGroupIds.push(groups[i].key.replace(STORAGE_KEYS.GROUP_KEY_PREFIX, ''));
      }
      if (currentGroupResult.status === ALL_SETTLED_STATUS.FULFILLED) {
        if (minAccessLevel) {
          result.accessedGroups.push(...currentGroupResult.value);
        } else {
          const [group] = currentGroupResult.value;
          result.accessedGroups.push(group);
        }
      }
      return result;
    },
    { accessedGroups: [], invalidGroupIds: [] },
  );

  const settledResult = await Promise.allSettled(
    reducedGroupsResult.invalidGroupIds.map((id: string) => deleteGroupDataFromStorage(id)),
  );

  if (hasRejections(settledResult)) {
    throw new Error(`Error deleting group data from storage: ${getFormattedErrors(settledResult)}`);
  }

  return reducedGroupsResult.accessedGroups;
};

export const getConnectedGroups = async (): Promise<GitlabAPIGroup[]> => {
  return getGroups('true');
};

export const getAllExistingGroups = async (): Promise<GitlabAPIGroup[]> => {
  return getGroups(null, GitLabAccessLevels.OWNER);
};
