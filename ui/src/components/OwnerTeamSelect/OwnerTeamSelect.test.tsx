import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { select, openMenu } from 'react-select-event';
import { OwnerTeamSelect, Props as OwnerTeamSelectProps } from './OwnerTeamSelect';
import { MappedTeam } from '../../types';
import { otherTeamsGroupLabel, teamsWithMembershipGroupLabel } from '../../constants';

const mockSearchTeams = jest.fn();
const mockSelectTeam = jest.fn();
const selectInputAreaLabel = 'Owner team selector';
const optionLabelTestId = 'owner-team-option';
const noOptionsTextRegExp = /No teams exist./i;

const getMockedTeams = (labels: string[]): MappedTeam[] => {
  return labels.map((label, key) => ({
    teamId: `${label}-${key}`,
    displayName: label,
    imageUrl: 'https://test',
  }));
};
const renderOwnerTeamSelect = (props: Partial<OwnerTeamSelectProps> = {}) => {
  return render(
    <OwnerTeamSelect
      teams={{ teamsWithMembership: [], otherTeams: [] }}
      isDisabled={false}
      selectKey={'test'}
      isLoadingTeams={false}
      selectTeam={mockSelectTeam}
      selectedTeamOption={null}
      {...props}
    />,
  );
};
describe('OwnerTeamSelect', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  test('renders OwnerTeamSelect', async () => {
    const { findByLabelText } = renderOwnerTeamSelect();
    const teamSelectInput = await findByLabelText(selectInputAreaLabel);
    expect(teamSelectInput).toBeDefined();
  });
  test('renders groups with options', async () => {
    const group1 = getMockedTeams(['Team1', 'Team2']);
    const group2 = getMockedTeams(['Team3', 'Team4']);
    const { findByLabelText, findByText, queryAllByTestId, queryByText } = renderOwnerTeamSelect({
      teams: {
        teamsWithMembership: group1,
        otherTeams: group2,
      },
    });
    const teamSelectInput = await findByLabelText(selectInputAreaLabel);
    openMenu(teamSelectInput);
    const teamsWithMembershipGroup = await findByText(teamsWithMembershipGroupLabel);
    const otherTeamsGroup = await findByText(otherTeamsGroupLabel);
    expect(teamsWithMembershipGroup).toBeDefined();
    expect(otherTeamsGroup).toBeDefined();
    const options = queryAllByTestId(optionLabelTestId);
    const option1 = queryByText('Team1');
    const option2 = queryByText('Team2');
    const option3 = queryByText('Team3');
    const option4 = queryByText('Team4');
    expect(options.length).toBe(4);
    expect(option1).not.toBeNull();
    expect(option2).not.toBeNull();
    expect(option3).not.toBeNull();
    expect(option4).not.toBeNull();
  });
  test('renders only "Your teams" group of options', async () => {
    const group1 = getMockedTeams(['Team1', 'Team2']);
    const group2 = getMockedTeams([]);
    const { findByLabelText, findByText, queryByText } = renderOwnerTeamSelect({
      teams: {
        teamsWithMembership: group1,
        otherTeams: group2,
      },
    });
    const teamSelectInput = await findByLabelText(selectInputAreaLabel);
    openMenu(teamSelectInput);
    const teamsWithMembershipGroup = await findByText(teamsWithMembershipGroupLabel);
    const otherTeamsGroup = queryByText(otherTeamsGroupLabel);
    expect(teamsWithMembershipGroup).toBeDefined();
    expect(otherTeamsGroup).toBeNull();
  });
  test('renders only "All teams" group of options', async () => {
    const group1 = getMockedTeams([]);
    const group2 = getMockedTeams(['Team3', 'Team4']);
    const { findByLabelText, findByText, queryByText } = renderOwnerTeamSelect({
      teams: {
        teamsWithMembership: group1,
        otherTeams: group2,
      },
    });
    const teamSelectInput = await findByLabelText(selectInputAreaLabel);
    openMenu(teamSelectInput);
    const teamsWithMembershipGroup = await queryByText(teamsWithMembershipGroupLabel);
    const otherTeamsGroup = findByText(otherTeamsGroupLabel);
    expect(teamsWithMembershipGroup).toBeNull();
    expect(otherTeamsGroup).toBeDefined();
  });
  test('renders empty menu without groups', async () => {
    const group1 = getMockedTeams([]);
    const group2 = getMockedTeams([]);
    const { findByLabelText, queryByText } = renderOwnerTeamSelect({
      teams: {
        teamsWithMembership: group1,
        otherTeams: group2,
      },
    });
    const teamSelectInput = await findByLabelText(selectInputAreaLabel);
    openMenu(teamSelectInput);
    const teamsWithMembershipGroup = queryByText(teamsWithMembershipGroupLabel);
    const otherTeamsGroup = queryByText(otherTeamsGroupLabel);
    const emptyState = await screen.findByText(noOptionsTextRegExp);
    expect(emptyState).toBeDefined();
    expect(teamsWithMembershipGroup).toBeNull();
    expect(otherTeamsGroup).toBeNull();
  });
  test('selects option', async () => {
    const group1 = getMockedTeams(['Team1']);
    const expectedOption = { iconUrl: 'https://test', label: 'Team1', value: 'Team1-0' };
    const { findByLabelText } = renderOwnerTeamSelect({
      teams: {
        teamsWithMembership: group1,
        otherTeams: [],
      },
      selectedTeamOption: expectedOption,
    });
    const teamSelectInput = await findByLabelText(selectInputAreaLabel);
    openMenu(teamSelectInput);
    await select(teamSelectInput, 'Team1');
    expect(mockSelectTeam).toHaveBeenCalledWith(expectedOption);
  });

  test('shows loading state on search', async () => {
    const group1 = getMockedTeams(['member-team-1, member-team-2, member-team-3']);
    const group2 = getMockedTeams(['other-team-1, other-team-2, other-team-3']);
    const { findByLabelText, queryByText } = renderOwnerTeamSelect({
      teams: {
        teamsWithMembership: group1,
        otherTeams: group2,
      },
    });
    const teamSelectInput = await findByLabelText(selectInputAreaLabel);

    openMenu(teamSelectInput);

    const searchInput = '2';

    fireEvent.change(teamSelectInput, { target: { value: searchInput } });

    const loadingMessage = queryByText('Loading...');

    expect(loadingMessage).not.toBeNull();
  });
});
