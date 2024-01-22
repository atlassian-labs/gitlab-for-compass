/* eslint-disable import/first */
class MockResolver {
  resolvers: { [key: string]: any };

  constructor() {
    this.resolvers = {};
  }

  define = (name: any, fn: any) => {
    this.resolvers[name] = fn;
  };

  getDefinitions = () => this.resolvers;
}
jest.mock('@forge/resolver', () => MockResolver);

import handler from './import-resolvers';
import * as featureFlags from '../services/feature-flags';
import * as getTeams from '../services/get-teams';
import { MOCK_CLOUD_ID } from '../__tests__/fixtures/gitlab-data';

describe('importResolvers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getFirstPageOfTeamsWithMembershipStatus', () => {
    const { getFirstPageOfTeamsWithMembershipStatus } = handler as any;

    test('successfully returns teams data', async () => {
      const mockTeam = {
        teamId: 'teamId',
        displayName: 'displayName',
        imageUrl: 'https://test',
      };
      const mockTeamsResponse = { teamsWithMembership: [mockTeam], otherTeams: [mockTeam] };

      jest
        .spyOn(featureFlags, 'listFeatures')
        .mockReturnValueOnce({ isOwnerTeamEnabled: true, isSendStagingEventsEnabled: false });
      jest.spyOn(getTeams, 'getFirstPageOfTeamsWithMembershipStatus').mockResolvedValueOnce(mockTeamsResponse);

      const teamsResponse = await getFirstPageOfTeamsWithMembershipStatus({
        context: {
          cloudId: MOCK_CLOUD_ID,
          accountId: 'test-account-id',
        },
        payload: {
          searchTeamValue: 'searchTeamValue',
        },
      });

      expect(teamsResponse).toEqual({
        success: true,
        data: {
          teams: mockTeamsResponse,
        },
      });
    });

    test('returns an error if getFirstPageOfTeamsWithMembershipStatus request failed', async () => {
      const mockError = new Error('error');
      jest
        .spyOn(featureFlags, 'listFeatures')
        .mockReturnValueOnce({ isOwnerTeamEnabled: true, isSendStagingEventsEnabled: false });
      jest.spyOn(getTeams, 'getFirstPageOfTeamsWithMembershipStatus').mockRejectedValueOnce(mockError);

      const teamsResponse = await getFirstPageOfTeamsWithMembershipStatus({
        context: {
          cloudId: MOCK_CLOUD_ID,
          accountId: 'test-account-id',
        },
        payload: {
          searchTeamValue: 'searchTeamValue',
        },
      });

      expect(teamsResponse).toEqual({
        success: false,
        errors: [{ message: mockError.message }],
      });
    });

    test('returns empty teams data if the isOwnerTeamEnabled disabled', async () => {
      const mockTeam = {
        teamId: 'teamId',
        displayName: 'displayName',
        imageUrl: 'https://test',
      };
      const mockTeamsResponse = { teamsWithMembership: [mockTeam], otherTeams: [mockTeam] };

      jest
        .spyOn(featureFlags, 'listFeatures')
        .mockReturnValueOnce({ isOwnerTeamEnabled: false, isSendStagingEventsEnabled: false });
      jest.spyOn(getTeams, 'getFirstPageOfTeamsWithMembershipStatus').mockResolvedValueOnce(mockTeamsResponse);

      const teamsResponse = await getFirstPageOfTeamsWithMembershipStatus({
        context: {
          cloudId: MOCK_CLOUD_ID,
          accountId: 'test-account-id',
        },
        payload: {
          searchTeamValue: 'searchTeamValue',
        },
      });

      expect(teamsResponse).toEqual({
        success: true,
        data: {
          teams: { teamsWithMembership: [], otherTeams: [] },
        },
      });
    });
  });
});
