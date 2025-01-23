import { Dispatch, SetStateAction, useMemo } from 'react';
import Button, { LoadingButton } from '@atlaskit/button';
import Select from '@atlaskit/select';
import { Inline } from '@atlaskit/primitives';
import Spinner from '@atlaskit/spinner';
import { Search } from '../../../Search';
import { ProjectsImportTable } from '../../../ProjectsImportTable';
import {
  GroupSelectorWrapper,
  Header,
  OverrideDescription,
  TableHeaderWrapper,
  TableSearchWrapper,
  Wrapper,
} from '../../styles';
import { CompassComponentTypeOption, ComponentTypesResult, ProjectImportSelection } from '../../../../services/types';
import { ButtonWrapper, Divider } from '../../../styles';
import { GitlabAPIGroup } from '../../../../types';
import { buildGroupsSelectorOptions, SelectorItem } from './buildGroupsSelectorOptions';
import { SelectOwnerTeamOption } from '../../../OwnerTeamSelect/types';
import { TeamsForImportResult } from '../../../../hooks/useTeamsForImport';

const projectsToImportMessage = (projCount: number) => (projCount === 1 ? 'project selected' : 'projects selected');

type Props = {
  projects: ProjectImportSelection[];
  isProjectsLoading: boolean;
  onSelectAllItems: (filteredProjects: ProjectImportSelection[], isAllItemsSelected: boolean) => void;
  onChangeComponentType: (id: number, type: CompassComponentTypeOption) => void;
  handleNavigateToConnectedPage: () => void;
  projectsFetchingError?: string;
  onSelectItem: (id: number) => void;
  selectedProjects: ProjectImportSelection[];
  handleNavigateToScreen: () => void;
  isProjectsImporting: boolean;
  totalProjects: number;
  setPage: Dispatch<SetStateAction<number>>;
  groups: GitlabAPIGroup[];
  isGroupsLoading: boolean;
  handleChangeGroup: (item: SelectorItem | null) => void;
  handleSearchValue: (value: string) => void;
  locationGroupId: number;
  importableComponentTypes: ComponentTypesResult;
  teamsResult: TeamsForImportResult;
  selectProjectTeam: (id: number, ownerTeamOption: SelectOwnerTeamOption | null) => void;
  isSpotlightActive: boolean;
  finishOnboarding: () => void;
  isOnboardingFlow: boolean;
};

export const SelectProjectsScreen = ({
  projects,
  isProjectsLoading,
  onSelectAllItems,
  onChangeComponentType,
  handleNavigateToConnectedPage,
  projectsFetchingError,
  onSelectItem,
  selectedProjects,
  handleNavigateToScreen,
  isProjectsImporting,
  totalProjects,
  setPage,
  groups,
  isGroupsLoading,
  handleChangeGroup,
  handleSearchValue,
  locationGroupId,
  importableComponentTypes,
  teamsResult,
  selectProjectTeam,
  isSpotlightActive,
  finishOnboarding,
  isOnboardingFlow,
}: Props) => {
  const groupSelectorOptions = useMemo(
    () => buildGroupsSelectorOptions(groups, locationGroupId),
    [groups, locationGroupId],
  );

  return (
    <Wrapper data-testid='gitlab-select-projects-screen'>
      <Header>Select projects</Header>
      <OverrideDescription>
        By importing projects as components, you can track them, manage them via configuration files, and bring in rich,
        real-time component data such as metrics, directly into Compass.
      </OverrideDescription>
      <TableHeaderWrapper>
        <GroupSelectorWrapper data-testid='group-selector'>
          <Select
            isClearable
            isLoading={isGroupsLoading}
            isDisabled={isProjectsLoading && !isGroupsLoading}
            onChange={(e) => handleChangeGroup(e)}
            inputId='select-group'
            className='single-select'
            classNamePrefix='react-select'
            placeholder='Select group'
            options={groupSelectorOptions}
          />
        </GroupSelectorWrapper>
        <TableSearchWrapper>
          <Search handleSearchValue={handleSearchValue} isProjectsLoading={isProjectsLoading} />
        </TableSearchWrapper>
      </TableHeaderWrapper>
      <ProjectsImportTable
        projects={projects}
        isLoading={isProjectsLoading && !projects.length}
        onSelectAllItems={onSelectAllItems}
        onSelectItem={onSelectItem}
        onChangeComponentType={onChangeComponentType}
        error={projectsFetchingError}
        importableComponentTypes={importableComponentTypes}
        teamsResult={teamsResult}
        selectProjectTeam={selectProjectTeam}
        isSpotlightActive={isSpotlightActive}
        finishOnboarding={finishOnboarding}
        isOnboardingFlow={isOnboardingFlow}
      />
      {projects.length !== 0 ? (
        <>
          <Divider />
          <Inline spread='space-between' alignBlock='center'>
            <p>
              <strong>{Object.keys(selectedProjects).length}</strong>{' '}
              {projectsToImportMessage(Object.keys(selectedProjects).length)}
            </p>
            {totalProjects > projects.length ? (
              <Button testId={'load-more-button'} onClick={() => setPage((prevPage) => prevPage + 1)}>
                {!!projects.length && isProjectsLoading ? <Spinner /> : 'Load more'}
              </Button>
            ) : null}
            <ButtonWrapper>
              <Button onClick={handleNavigateToConnectedPage}>Cancel</Button>
              <LoadingButton
                appearance='primary'
                isDisabled={selectedProjects.length === 0}
                onClick={handleNavigateToScreen}
                isLoading={isProjectsImporting}
              >
                Select
              </LoadingButton>
            </ButtonWrapper>
          </Inline>
        </>
      ) : null}
    </Wrapper>
  );
};
