/* eslint-disable import/first */

import { mocked } from 'jest-mock';
import { mockForgeApi, storage } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { STORAGE_KEYS, STORAGE_SECRETS } from '../constants';
import { getGroupAccessTokens, getGroupsData } from '../client/gitlab';
import { connectGroup, getConnectedGroups, InvalidGroupTokenError } from './group';
import { AuthErrorTypes, GitlabAPIGroup } from '../resolverTypes';
import { ConnectGroupInput, GitLabRoles, GroupAccessToken } from '../types';

jest.mock('../client/gitlab');

const mockGetGroupsData = mocked(getGroupsData);
const mockGetGroupAccessTokens = mocked(getGroupAccessTokens);

const MOCK_GROUP_DATA = {
  name: 'koko',
  id: 123,
  full_name: 'GitLab/koko',
  path: 'koko/momo',
};

const MOCK_ANOTHER_GROUP_DATA = {
  name: 'keke',
  id: 125,
  full_name: 'GitLab/keke',
  path: 'keke/momo',
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
  { name: 'koko', id: 1234, role: GitLabRoles.OWNER },
  { name: 'momo', id: 2345, role: GitLabRoles.MAINTAINER },
];
const storageQuerySuccess = jest.fn().mockImplementation(() => {
  return {
    where: () => {
      return {
        getMany: async () => {
          return {
            results: [
              {
                key: `${STORAGE_KEYS.GROUP_NAME_KEY_PREFIX}${MOCK_CONNECTED_GROUPS[0].id}`,
                value: MOCK_CONNECTED_GROUPS[0].name,
              },
              {
                key: `${STORAGE_KEYS.GROUP_NAME_KEY_PREFIX}${MOCK_CONNECTED_GROUPS[1].id}`,
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

    describe('as Owner token role', () => {
      it('saves token to storage and returns valid groupId', async () => {
        const mockGroupAccessToken = generateMockGroupAccessToken();
        mockGetGroupsData.mockResolvedValue([MOCK_GROUP_DATA]);
        mockGetGroupAccessTokens.mockResolvedValue([mockGroupAccessToken]);

        const input: ConnectGroupInput = {
          token: MOCK_TOKEN,
          tokenName: mockGroupAccessToken.name,
          tokenRole: GitLabRoles.OWNER,
        };

        const result = await connectGroup(input);

        expect(storage.set).toHaveBeenNthCalledWith(
          1,
          `${STORAGE_KEYS.GROUP_NAME_KEY_PREFIX}${MOCK_GROUP_DATA.id}`,
          MOCK_GROUP_DATA.name,
        );
        expect(storage.set).toHaveBeenNthCalledWith(
          2,
          `${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${MOCK_GROUP_DATA.id}`,
          GitLabRoles.OWNER,
        );
        expect(storage.setSecret).toHaveBeenCalledWith(
          `${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${MOCK_GROUP_DATA.id}`,
          MOCK_TOKEN,
        );

        // Verify total number of calls
        expect(storage.set).toHaveBeenCalledTimes(2);
        expect(storage.setSecret).toHaveBeenCalledTimes(1);

        expect(result).toBe(MOCK_GROUP_DATA.id);
      });

      it('throws error in case of invalid group token', async () => {
        const mockGroupAccessToken = generateMockGroupAccessToken();
        mockGetGroupsData.mockRejectedValue(undefined);

        const input: ConnectGroupInput = {
          token: MOCK_TOKEN,
          tokenName: mockGroupAccessToken.name,
          tokenRole: GitLabRoles.OWNER,
        };

        await expect(connectGroup(input)).rejects.toThrow(
          new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_TOKEN),
        );
        expect(storage.set).not.toHaveBeenCalled();
      });

      it('throws error in case of invalid group token name', async () => {
        const mockGroupAccessToken = generateMockGroupAccessToken();
        mockGetGroupsData.mockResolvedValue([MOCK_GROUP_DATA]);
        mockGetGroupAccessTokens.mockResolvedValue([mockGroupAccessToken]);

        const input: ConnectGroupInput = {
          token: MOCK_TOKEN,
          tokenName: 'momo',
          tokenRole: GitLabRoles.OWNER,
        };

        await expect(connectGroup(input)).rejects.toThrow(
          new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_TOKEN_NAME),
        );
        expect(storage.set).not.toHaveBeenCalled();
      });

      it('throws error in case of invalid group token scopes', async () => {
        const mockGroupAccessToken = generateMockGroupAccessToken({ scopes: ['api'] });
        mockGetGroupsData.mockResolvedValue([MOCK_GROUP_DATA]);
        mockGetGroupAccessTokens.mockResolvedValue([mockGroupAccessToken]);

        const input: ConnectGroupInput = {
          token: MOCK_TOKEN,
          tokenName: mockGroupAccessToken.name,
          tokenRole: GitLabRoles.OWNER,
        };

        await expect(connectGroup(input)).rejects.toThrow(
          new InvalidGroupTokenError(AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES),
        );
        expect(storage.set).not.toHaveBeenCalled();
      });
    });

    describe('as Maintainer token role', () => {
      it('saves token to storage and returns valid groupId', async () => {
        const mockGroupAccessToken = generateMockGroupAccessToken();
        mockGetGroupsData.mockResolvedValue([MOCK_GROUP_DATA, MOCK_ANOTHER_GROUP_DATA]);

        const input: ConnectGroupInput = {
          token: MOCK_TOKEN,
          tokenName: mockGroupAccessToken.name,
          tokenRole: GitLabRoles.MAINTAINER,
          groupName: MOCK_ANOTHER_GROUP_DATA.name,
        };

        const result = await connectGroup(input);

        expect(storage.set).toHaveBeenNthCalledWith(
          1,
          `${STORAGE_KEYS.GROUP_NAME_KEY_PREFIX}${MOCK_ANOTHER_GROUP_DATA.id}`,
          MOCK_ANOTHER_GROUP_DATA.name,
        );
        expect(storage.set).toHaveBeenNthCalledWith(
          2,
          `${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${MOCK_ANOTHER_GROUP_DATA.id}`,
          GitLabRoles.MAINTAINER,
        );
        expect(storage.set).toHaveBeenNthCalledWith(
          3,
          `${STORAGE_KEYS.WEBHOOK_SETUP_IN_PROGRESS}${MOCK_ANOTHER_GROUP_DATA.id}`,
          MOCK_ANOTHER_GROUP_DATA.id,
        );
        expect(storage.setSecret).toHaveBeenCalledWith(
          `${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${MOCK_ANOTHER_GROUP_DATA.id}`,
          MOCK_TOKEN,
        );

        // Verify total number of calls
        expect(storage.set).toHaveBeenCalledTimes(3);
        expect(storage.setSecret).toHaveBeenCalledTimes(1);

        expect(result).toBe(MOCK_ANOTHER_GROUP_DATA.id);

        // Skips token fetch and scope validation
        expect(mockGetGroupAccessTokens).not.toHaveBeenCalled();
      });

      it('throws error in case of invalid group token', async () => {
        const mockGroupAccessToken = generateMockGroupAccessToken();
        mockGetGroupsData.mockRejectedValue(undefined);

        const input: ConnectGroupInput = {
          token: MOCK_TOKEN,
          tokenName: mockGroupAccessToken.name,
          tokenRole: GitLabRoles.MAINTAINER,
          groupName: MOCK_ANOTHER_GROUP_DATA.name,
        };

        await expect(connectGroup(input)).rejects.toThrow(
          new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_TOKEN),
        );
        expect(storage.set).not.toHaveBeenCalled();
      });
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
      storage.get = jest.fn().mockImplementation((groupKey: string): Promise<string> => {
        return groupKey === `${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${MOCK_CONNECTED_GROUPS[0].id}`
          ? Promise.resolve(MOCK_CONNECTED_GROUPS[0].role)
          : Promise.resolve(MOCK_CONNECTED_GROUPS[1].role);
      });
      mockGetGroupsData.mockImplementation((groupAccessToken: string): Promise<GitlabAPIGroup[]> => {
        return groupAccessToken === 'koko-token'
          ? Promise.resolve([MOCK_GROUP_DATA])
          : Promise.reject(new Error('Unauthorized'));
      });

      const result = await getConnectedGroups();

      expect(storage.query).toHaveBeenCalled();
      expect(storage.delete).toHaveBeenCalledWith(
        `${STORAGE_KEYS.GROUP_NAME_KEY_PREFIX}${MOCK_CONNECTED_GROUPS[1].id}`,
      );
      expect(storage.delete).toHaveBeenCalledWith(`${STORAGE_KEYS.TOKEN_ROLE_PREFIX}${MOCK_CONNECTED_GROUPS[1].id}`);
      expect(storage.deleteSecret).toHaveBeenCalledWith(
        `${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${MOCK_CONNECTED_GROUPS[1].id}`,
      );
      expect(result).toEqual([MOCK_GROUP_DATA]);
    });
  });
});
