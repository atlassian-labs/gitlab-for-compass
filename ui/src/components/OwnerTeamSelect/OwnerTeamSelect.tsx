import Select from '@atlaskit/select';
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { TeamsWithMembershipStatus } from '../../types';
import { OwnerTeamOption } from './OwnerTeamOption';
import { getOwnerTeamSelectOptions } from './buildSelectOptions';
import { EmptyStateDescription, EmptyStateWrapper } from './styles';
import { SelectOwnerTeamOption, InputActionMeta } from './types';

export type Props = {
  selectKey: string;
  selectedTeamOption: SelectOwnerTeamOption | null;
  teams: TeamsWithMembershipStatus | undefined;
  isDisabled: boolean;
  isLoadingTeams: boolean;
  selectTeam: (ownerTeamOption: SelectOwnerTeamOption | null) => void;
};

export const OwnerTeamSelect: FunctionComponent<Props> = ({
  selectedTeamOption,
  isDisabled,
  selectKey,
  teams,
  isLoadingTeams,
  selectTeam,
}) => {
  const [searchTeamsResult, setSearchTeamsResult] = useState<TeamsWithMembershipStatus>();
  const [searchTeamsQuery, setSearchTeamsQuery] = useState<string>();
  const [isSearchTeamsLoading, setIsSearchTeamsLoading] = useState<boolean>(false);

  const actualSearchInput = useRef<string | null>(null);

  useEffect(() => {
    if (searchTeamsQuery) {
      // TBD Call teams request after search
    }
  }, [searchTeamsQuery]);

  const currentTeams = searchTeamsQuery ? searchTeamsResult : teams;
  const isLoadingTeamsData = isLoadingTeams || isSearchTeamsLoading;

  const buildOptions = () => {
    const undefinedToEnableSelectLoadingState = undefined;

    return isLoadingTeamsData ? undefinedToEnableSelectLoadingState : getOwnerTeamSelectOptions(currentTeams);
  };

  const clearSearch = () => {
    setSearchTeamsQuery(undefined);
    setIsSearchTeamsLoading(false);
    actualSearchInput.current = null;
  };

  const triggerTeamsSearch = (value: string, actionMeta: InputActionMeta) => {
    const { action } = actionMeta;
    const isOnClearAction = action === 'input-blur' || action === 'menu-close';
    const shouldClearSearch = isOnClearAction || !value;
    const isSameSearchInput = value.trim() === searchTeamsQuery;

    if (shouldClearSearch) {
      clearSearch();
      return;
    }

    if (isSameSearchInput) {
      setIsSearchTeamsLoading(false);
      return;
    }

    setSearchTeamsQuery(value.trim());
  };

  const debouncedTriggerTeamsSearch = useCallback(debounce(triggerTeamsSearch, 1000), [searchTeamsQuery]);

  const handleOptionChange = (option: SelectOwnerTeamOption | null) => {
    selectTeam(option);
  };

  const handleInputChange = (value: string, actionMeta: InputActionMeta) => {
    setIsSearchTeamsLoading(true);
    actualSearchInput.current = value ? value.trim() : null;
    debouncedTriggerTeamsSearch(value, actionMeta);
  };

  const NoOptionsMessage = () => {
    if (searchTeamsQuery) {
      return (
        <EmptyStateWrapper>
          <EmptyStateDescription>
            No matching team found. <br />
            Try a different team name or create a team from the <b>Teams</b> page.
          </EmptyStateDescription>
        </EmptyStateWrapper>
      );
    }

    return (
      <EmptyStateDescription>
        No teams exist.
        <br />
        Create a team from the <b>Teams</b> page.
      </EmptyStateDescription>
    );
  };

  return (
    <Select
      aria-label='Owner team selector'
      key={selectKey}
      classNamePrefix='team-selector'
      components={{ NoOptionsMessage }}
      isDisabled={isDisabled}
      formatOptionLabel={OwnerTeamOption}
      options={buildOptions()}
      value={selectedTeamOption}
      onChange={handleOptionChange}
      onInputChange={handleInputChange}
      placeholder='Choose team'
      menuPosition='fixed'
      isClearable={true}
      isLoading={isLoadingTeamsData}
      loadingMessage={() => 'Loading...'}
      backspaceRemovesValue={false}
      onMenuClose={clearSearch}
    />
  );
};
