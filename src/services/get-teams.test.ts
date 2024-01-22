import { mocked } from 'ts-jest/utils';

import { getFirstPageOfTeamsWithMembershipStatus } from './get-teams';
import { getTeams, getTenantContext } from '../client/compass';
import { MappedTeam } from '../types';
import { MOCK_CLOUD_ID } from '../__tests__/fixtures/gitlab-data';

jest.mock('../client/compass');

const mockGetTenantContext = mocked(getTenantContext);
const mockGetTeams = mocked(getTeams);

const MOCK_GET_TENANT_CONTEXT = {
  tenantContexts: [{ orgId: 'orgId' }],
};
const TEAM_ID = 'team_id';

const mockGetFirstPageOfTeamsWithMembershipStatus = (id: string, teamsAmount = 1) => {
  const team = {
    team: {
      id,
      displayName: 'team_name',
      smallAvatarImageUrl: 'imageUrl',
      state: 'ACTIVE',
    },
  };

  return new Array(teamsAmount).fill(team);
};

const mockMappedTeams = (teamId: string, teamsAmount = 1) => {
  const mappedTeam: MappedTeam = {
    teamId,
    displayName: 'team_name',
    imageUrl: 'imageUrl',
  };

  return new Array(teamsAmount).fill(mappedTeam);
};

describe('Get teams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns just teams with membership in case there are 30 of them', async () => {
    mockGetTenantContext.mockResolvedValue(MOCK_GET_TENANT_CONTEXT);
    mockGetTeams.mockResolvedValueOnce(mockGetFirstPageOfTeamsWithMembershipStatus(TEAM_ID, 30));

    const expectedResult = mockMappedTeams(TEAM_ID, 30);

    const result = await getFirstPageOfTeamsWithMembershipStatus(MOCK_CLOUD_ID);

    expect(result).toEqual({ teamsWithMembership: expectedResult, otherTeams: [] });
  });

  test('returns just other teams in case there are no teams with membership', async () => {
    mockGetTenantContext.mockResolvedValue(MOCK_GET_TENANT_CONTEXT);
    mockGetTeams.mockResolvedValueOnce([]);
    mockGetTeams.mockResolvedValueOnce(mockGetFirstPageOfTeamsWithMembershipStatus(TEAM_ID, 1));

    const expectedResult = mockMappedTeams(TEAM_ID, 1);

    const result = await getFirstPageOfTeamsWithMembershipStatus(MOCK_CLOUD_ID);

    expect(result).toEqual({ teamsWithMembership: [], otherTeams: expectedResult });
  });

  test('returns all teams', async () => {
    mockGetTenantContext.mockResolvedValue(MOCK_GET_TENANT_CONTEXT);
    mockGetTeams.mockResolvedValueOnce(mockGetFirstPageOfTeamsWithMembershipStatus(TEAM_ID, 2));
    mockGetTeams.mockResolvedValueOnce([
      ...mockGetFirstPageOfTeamsWithMembershipStatus(TEAM_ID, 2),
      ...mockGetFirstPageOfTeamsWithMembershipStatus('team_id_2', 2),
    ]);

    const expectedResult = {
      teamsWithMembership: mockMappedTeams(TEAM_ID, 2),
      otherTeams: mockMappedTeams('team_id_2', 2),
    };

    const result = await getFirstPageOfTeamsWithMembershipStatus(MOCK_CLOUD_ID);

    expect(result).toEqual(expectedResult);
  });

  test('throws an error in case of error while getting tenant context', async () => {
    mockGetTenantContext.mockRejectedValue(new Error('Error'));

    const errorMessage = 'Error while getting teams.';

    await expect(getFirstPageOfTeamsWithMembershipStatus(MOCK_CLOUD_ID)).rejects.toThrow(new Error(errorMessage));
  });
});
