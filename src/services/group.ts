import { Result, startsWith, storage } from '@forge/api';

import {
  ConnectGroupInput,
  GitLabAccessLevels,
  GitlabAPIGroup,
  GitLabRoles,
  GroupAccessToken,
  TokenFetchResult,
} from '../types';
import { getGroupAccessTokens, getGroupsData } from '../client/gitlab';
import { REQUIRED_SCOPES, STORAGE_KEYS, STORAGE_SECRETS } from '../constants';
import { AuthErrorTypes, StoreTokenErrorTypes } from '../resolverTypes';
import { deleteGroupDataFromStorage } from './clear-storage';
import { ALL_SETTLED_STATUS, getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';
import { StoreRotateTokenError } from '../models/errors';
import { getDifferenceBetweenDates } from '../utils/time-utils';

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

/**
 * Connects a group given a token with maintainer role. It will list the
 * group and check if the given groupName is fetched. If so, then it is deemed as
 * matching. Skips checks for scopes and token validity as Maintainer role is not
 * authorized to fetch tokens from Gitlab.
 * @param token - Gitlab access token
 * @param groupName - Gitlab group name
 * @returns Matching verified Gitlab Group ID
 */
export const connectGroupAsMaintainer = async (token: string, groupName: string): Promise<number> => {
  if (!groupName) {
    throw new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_NAME);
  }

  let groups: GitlabAPIGroup[];
  try {
    console.log('Fetching groups data for Maintainer token role');
    groups = await getGroupsData(token, null, null, groupName);
  } catch (e) {
    console.log('Error fetching groups data for Maintainer token role');
    throw new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_TOKEN);
  }

  for (const group of groups) {
    if (group.name === groupName) {
      return group.id;
    }
  }

  throw new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_NAME);
};

/**
 * Connects a group given a token with owner role. It will find the matching
 * group given the token and validate the scopes.
 * @param token - Gitlab access token
 * @param tokenName - Gitlab access token name
 * @returns Matching verified Gitlab Group's ID and name
 */
export const connectGroupAsOwner = async (
  token: string,
  tokenName: string,
): Promise<{ groupName: string; groupId: number; tokenId: number; tokenExpirationDate: string }> => {
  let groupId;
  let groupName;
  try {
    console.log('Fetching groups data for Owner token role');
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

  return { groupId, groupName, tokenId: groupToken.id, tokenExpirationDate: groupToken.expires_at };
};

export const connectGroup = async (input: ConnectGroupInput): Promise<number> => {
  const { token, tokenName, tokenRole, groupName } = input;

  let groupId;
  let fetchedGroupName;
  let tokenId;
  let tokenExpirationDate;
  if (tokenRole === GitLabRoles.MAINTAINER) {
    groupId = await connectGroupAsMaintainer(token, groupName);
  } else {
    ({
      groupId,
      groupName: fetchedGroupName,
      tokenId,
      tokenExpirationDate,
    } = await connectGroupAsOwner(token, tokenName));
  }

  await storage.set(`${STORAGE_KEYS.GROUP_NAME_KEY_PREFIX}${groupId}`, fetchedGroupName ?? groupName);
  await storage.setSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`, token);
  await storage.set(`${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${groupId}`, tokenRole);

  if (tokenRole === GitLabRoles.OWNER) {
    await storage.set(`${STORAGE_KEYS.TOKEN_ID_PREFIX}${groupId}`, tokenId);
    await storage.set(`${STORAGE_KEYS.TOKEN_EXPIRATION_PREFIX}${groupId}`, tokenExpirationDate);
  }

  if (tokenRole === GitLabRoles.MAINTAINER) {
    await storage.set(`${STORAGE_KEYS.WEBHOOK_SETUP_IN_PROGRESS}${groupId}`, groupId);
  }

  return groupId;
};

export const rotateGroupToken = async (input: ConnectGroupInput): Promise<void> => {
  const { token, tokenName, tokenRole, groupName } = input;

  let groupId;
  let tokenId;
  let tokenExpirationDate;
  if (tokenRole === GitLabRoles.MAINTAINER) {
    groupId = await connectGroupAsMaintainer(token, groupName);
  } else {
    ({ groupId, tokenId, tokenExpirationDate } = await connectGroupAsOwner(token, tokenName));
  }

  try {
    await storage.setSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`, token);
    await storage.set(`${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${groupId}`, tokenRole);

    if (tokenRole === GitLabRoles.OWNER) {
      await storage.set(`${STORAGE_KEYS.TOKEN_ID_PREFIX}${groupId}`, tokenId);
      await storage.set(`${STORAGE_KEYS.TOKEN_EXPIRATION_PREFIX}${groupId}`, tokenExpirationDate);
    }
  } catch {
    throw new StoreRotateTokenError(StoreTokenErrorTypes.STORE_ERROR);
  }
};

export const getTokenExpirationDays = async (groupId: number): Promise<number | null> => {
  try {
    const tokenExpirationDate = await storage.get(`${STORAGE_KEYS.TOKEN_EXPIRATION_PREFIX}${groupId}`);

    if (tokenExpirationDate) {
      const dateNow = new Date().toISOString();
      const differenceBetweenDates = getDifferenceBetweenDates(dateNow, tokenExpirationDate);

      return differenceBetweenDates;
    }

    return null;
  } catch (e) {
    throw new Error(`Error while getting token expiration date: ${e}`);
  }
};

/**
 * Fetches groups data given token. Performs different fetch flows based on
 * role of the token i.e. Maintainer vs Owner.
 * @param token - Gitlab access token
 * @param groupId - Gitlab group ID
 * @param owned - filter by owned groups
 * @param minAccessLevel - filter by minAccessLevel
 */
const getGroupsWithToken = async (
  token: string,
  groupId: number,
  owned?: string,
  minAccessLevel?: number,
): Promise<GitlabAPIGroup[]> => {
  const tokenRole = await storage.get(`${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${groupId}`);

  if (tokenRole === GitLabRoles.OWNER) {
    return getGroupsData(token, owned, minAccessLevel);
  }

  const groupName: string = await storage.get(`${STORAGE_KEYS.GROUP_NAME_KEY_PREFIX}${groupId}`);
  const groups = await getGroupsData(token, null, null, groupName);

  for (const group of groups) {
    if (group.name === groupName) {
      return [group];
    }
  }

  return Promise.reject(new Error(`Error fetching groups data for group ${groupName} using Maintainer token.`));
};

/**
 * Fetches groups data given filters.
 * @param owned - filter by owned groups
 * @param minAccessLevel - filter by minAccessLevel
 * @returns List of GitlabAPIGroup objects
 */
const getGroups = async (owned?: string, minAccessLevel?: number): Promise<GitlabAPIGroup[]> => {
  const response = storage.query().where('key', startsWith(STORAGE_KEYS.GROUP_NAME_KEY_PREFIX));

  const { results: groups } = await response.getMany();

  const tokensResult = await Promise.allSettled(
    groups.map(async (group: Result) => {
      const groupId = Number(group.key.replace(STORAGE_KEYS.GROUP_NAME_KEY_PREFIX, ''));
      const token = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);
      return { token, groupId };
    }),
  );

  if (hasRejections(tokensResult)) {
    throw new Error(`Error getting tokens ${getFormattedErrors(tokensResult)}`);
  }

  const tokensWithGroup = tokensResult.map(
    (tokenResult: PromiseSettledResult<TokenFetchResult>) =>
      (tokenResult as PromiseFulfilledResult<TokenFetchResult>).value,
  );

  const groupPromises = tokensWithGroup.map((fetchResult: TokenFetchResult) => {
    return getGroupsWithToken(fetchResult.token, fetchResult.groupId, owned, minAccessLevel);
  });

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
        result.invalidGroupIds.push(groups[i].key.replace(STORAGE_KEYS.GROUP_NAME_KEY_PREFIX, ''));
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

export const getGroupById = async (groupId: number): Promise<GitlabAPIGroup> | undefined => {
  const groups = await getGroups(null);
  return groups.find((group) => groupId === group.id);
};
