import { differenceBy } from 'lodash';

import { MappedTeam, Team, TeamsWithMembershipStatus } from '../types';
import { getTenantContext, getTeams } from '../client/compass';
import { TEAMS_AMOUNT } from '../constants';

enum TeamStates {
  ACTIVE = 'ACTIVE',
}

const mapTeams = (teams: Team[]): MappedTeam[] => {
  return teams
    .filter((el) => el.team.state === TeamStates.ACTIVE)
    .map((el) => {
      return {
        teamId: el.team.id,
        displayName: el.team.displayName,
        imageUrl: el.team.smallAvatarImageUrl,
      };
    });
};

const extractTeamsLeftToAdd = (otherTeams: MappedTeam[], teamsWithMembershipAmount: number): MappedTeam[] => {
  if (otherTeams.length > TEAMS_AMOUNT - teamsWithMembershipAmount) {
    otherTeams.splice(TEAMS_AMOUNT - teamsWithMembershipAmount);
  }

  return otherTeams;
};

export const getFirstPageOfTeamsWithMembershipStatus = async (
  cloudId: string,
  accountId?: string,
  searchValue?: string,
): Promise<TeamsWithMembershipStatus> => {
  try {
    const tenantContextResponse = await getTenantContext(cloudId);

    const { orgId } = tenantContextResponse.tenantContexts[0];

    const teamsWithMembership = await getTeams(orgId, cloudId, accountId, searchValue);

    const mappedTeamsWithMembership = mapTeams(teamsWithMembership);

    if (mappedTeamsWithMembership.length === TEAMS_AMOUNT) {
      return { teamsWithMembership: mappedTeamsWithMembership, otherTeams: [] };
    }

    const allTeams = await getTeams(orgId, cloudId, undefined, searchValue);

    const mappedAllTeams = mapTeams(allTeams);

    const otherTeams = differenceBy(mappedAllTeams, mappedTeamsWithMembership, 'teamId');

    const teamsLeftToAdd = extractTeamsLeftToAdd(otherTeams, mappedTeamsWithMembership.length);

    return { teamsWithMembership: mappedTeamsWithMembership, otherTeams: teamsLeftToAdd };
  } catch (error) {
    console.error('Error in getTeams:', error);
    const ERROR_MESSAGE = 'Error while getting teams.';
    throw new Error(ERROR_MESSAGE);
  }
};
