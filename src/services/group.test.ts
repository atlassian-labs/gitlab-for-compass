/* eslint-disable import/first */

import { mocked } from 'jest-mock';
import { storage, mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { STORAGE_KEYS, STORAGE_SECRETS } from '../constants';
import { getGroupAccessTokens, getGroupsData } from '../client/gitlab';
import { connectGroup, getConnectedGroups, InvalidGroupTokenError } from './group';
import { AuthErrorTypes, GitlabAPIGroup } from '../resolverTypes';
import { GroupAccessToken } from '../types';

jest.mock('../client/gitlab');

const mockGetGroupsData = mocked(getGroupsData);
const mockGetGroupAccessTokens = mocked(getGroupAccessTokens);

const MOCK_GROUP_DATA = {
  name: 'koko',
  id: 123,
  full_name: 'GitLab/koko',
  path: 'koko/momo',
};

const generateMockGroupAccessToken = (tokenPropertiesOverride: Partial<GroupAccessToken> = {}) => {
  return {
    user_id: 123,
    scopes: ['api', 'write_repository'],
    name: 'koko',
    expires_at: '',
    id: 567,
    active: true,
    created_at: '',
    revoked: false,
    access_level: 50,
    ...tokenPropertiesOverride,
  };
};

const MOCK_TOKEN = 'glpat-geTHYDSDGHJJ';

const MOCK_CONNECTED_GROUPS = [
  { name: 'koko', id: 1234 },
  { name: 'momo', id: 2345 },
];
const storageQuerySuccess = jest.fn().mockImplementation(() => {
  return {
    where: () => {
      return {
        getMany: async () => {
          return {
            results: [
              {
                key: `${STORAGE_KEYS.GROUP_KEY_PREFIX}${MOCK_CONNECTED_GROUPS[0].id}`,
                value: MOCK_CONNECTED_GROUPS[0].name,
              },
              {
                key: `${STORAGE_KEYS.GROUP_KEY_PREFIX}${MOCK_CONNECTED_GROUPS[1].id}`,
                value: MOCK_CONNECTED_GROUPS[1].name,
              },
            ],
          };
        },
      };
    },
  };
});

describe('Group service', () => {
  describe('connectGroup', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('saves token to storage and returns valid groupId', async () => {
      const mockGroupAccessToken = generateMockGroupAccessToken();
      mockGetGroupsData.mockResolvedValue([MOCK_GROUP_DATA]);
      mockGetGroupAccessTokens.mockResolvedValue([mockGroupAccessToken]);

      const result = await connectGroup(MOCK_TOKEN, mockGroupAccessToken.name);

      expect(storage.set).toHaveBeenCalledWith(
        `${STORAGE_KEYS.GROUP_KEY_PREFIX}${MOCK_GROUP_DATA.id}`,
        MOCK_GROUP_DATA.name,
      );
      expect(storage.setSecret).toHaveBeenCalledWith(
        `${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${MOCK_GROUP_DATA.id}`,
        MOCK_TOKEN,
      );

      expect(result).toBe(MOCK_GROUP_DATA.id);
    });

    it('throws error in case of invalid group token', async () => {
      const mockGroupAccessToken = generateMockGroupAccessToken();
      mockGetGroupsData.mockRejectedValue(undefined);

      await expect(connectGroup(MOCK_TOKEN, mockGroupAccessToken.name)).rejects.toThrow(
        new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_TOKEN),
      );
      expect(storage.set).not.toHaveBeenCalled();
    });

    it('throws error in case of invalid group token name', async () => {
      const mockGroupAccessToken = generateMockGroupAccessToken();
      mockGetGroupsData.mockResolvedValue([MOCK_GROUP_DATA]);
      mockGetGroupAccessTokens.mockResolvedValue([mockGroupAccessToken]);

      await expect(connectGroup(MOCK_TOKEN, 'momo')).rejects.toThrow(
        new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_TOKEN_NAME),
      );
      expect(storage.set).not.toHaveBeenCalled();
    });

    it('throws error in case of invalid group token scopes', async () => {
      const mockGroupAccessToken = generateMockGroupAccessToken({ scopes: ['api'] });
      mockGetGroupsData.mockResolvedValue([MOCK_GROUP_DATA]);
      mockGetGroupAccessTokens.mockResolvedValue([mockGroupAccessToken]);

      await expect(connectGroup(MOCK_TOKEN, mockGroupAccessToken.name)).rejects.toThrow(
        new InvalidGroupTokenError(AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES),
      );
      expect(storage.set).not.toHaveBeenCalled();
    });
  });

  describe('getConnectedGroups', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns connected groups', async () => {
      storage.query = storageQuerySuccess;
      storage.getSecret = jest.fn().mockImplementation((tokenKey: string): Promise<string> => {
        return tokenKey === `${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${MOCK_CONNECTED_GROUPS[0].id}`
          ? Promise.resolve('koko-token')
          : Promise.resolve('momo-token');
      });
      mockGetGroupsData.mockImplementation((groupAccessToken: string): Promise<GitlabAPIGroup[]> => {
        return groupAccessToken === 'koko-token'
          ? Promise.resolve([MOCK_GROUP_DATA])
          : Promise.reject(new Error('Unauthorized'));
      });

      const result = await getConnectedGroups();

      expect(storage.query).toHaveBeenCalled();
      expect(storage.delete).toHaveBeenCalledWith(`${STORAGE_KEYS.GROUP_KEY_PREFIX}${MOCK_CONNECTED_GROUPS[1].id}`);
      expect(storage.deleteSecret).toHaveBeenCalledWith(
        `${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${MOCK_CONNECTED_GROUPS[1].id}`,
      );
      expect(result).toEqual([MOCK_GROUP_DATA]);
    });
  });
});
