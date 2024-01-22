import { GroupType } from '@atlaskit/select';
import { otherTeamsGroupLabel, teamsWithMembershipGroupLabel } from '../../constants';

import { MappedTeam, TeamsWithMembershipStatus } from '../../types';
import { SelectOwnerTeamOption } from './types';

const mapTeamsToOptions = (teams: MappedTeam[]): SelectOwnerTeamOption[] => {
  return teams.map(({ teamId, displayName, imageUrl }) => ({
    label: displayName,
    value: teamId,
    iconUrl: imageUrl,
  }));
};

const getOptionsGroup = (groupLabel: string, teams: MappedTeam[]): GroupType<SelectOwnerTeamOption> => ({
  label: groupLabel,
  options: mapTeamsToOptions(teams),
});

export const getOwnerTeamSelectOptions = (
  teams: TeamsWithMembershipStatus | undefined,
): GroupType<SelectOwnerTeamOption>[] | undefined => {
  if (!teams) {
    return undefined;
  }

  const { teamsWithMembership, otherTeams } = teams;

  const options: GroupType<SelectOwnerTeamOption>[] = [];

  if (teamsWithMembership.length) {
    const teamsWithMembershipGroup = getOptionsGroup(teamsWithMembershipGroupLabel, teamsWithMembership);
    options.push(teamsWithMembershipGroup);
  }

  if (otherTeams.length) {
    const otherTeamsOptions = getOptionsGroup(otherTeamsGroupLabel, otherTeams);
    options.push(otherTeamsOptions);
  }

  return options;
};
