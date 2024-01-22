import { Dispatch, SetStateAction, useMemo } from 'react';
import Button, { LoadingButton } from '@atlaskit/button';
import Select from '@atlaskit/select';
import { useLocation } from 'react-router-dom';

import { Search } from '../../../Search';
import { ProjectsImportTable } from '../../../ProjectsImportTable';
import {
  ButtonWrapper,
  GroupSelectorWrapper,
  Header,
  OverrideDescription,
  TableHeaderWrapper,
  TableSearchWrapper,
  Wrapper,
} from '../../styles';
import { CompassComponentTypeOption, ComponentTypesResult, ProjectImportSelection } from '../../../../services/types';
import { CenterWrapper } from '../../../styles';
import { GitlabAPIGroup } from '../../../../types';
import { buildGroupsSelectorOptions, SelectorItem } from './buildGroupsSelectorOptions';

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
  isOwnerTeamEnabled: boolean;
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
  isOwnerTeamEnabled,
}: Props) => {
  const groupSelectorOptions = useMemo(
    () => buildGroupsSelectorOptions(groups, locationGroupId),
    [groups, locationGroupId],
  );

  return (
    <Wrapper data-testid='gitlab-select-projects-screen'>
      <Header>Select projects</Header>
      <OverrideDescription>
        By importing projects as components, you can track them, manage them via configuration files, <br />
        and bring in rich, real-time component data such as metrics, directly into Compass.
      </OverrideDescription>
      <>
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
          isOwnerTeamEnabled={isOwnerTeamEnabled}
        />
        {projects.length !== 0 ? (
          <CenterWrapper>
            <LoadingButton
              testId='load-more-button'
              isDisabled={totalProjects <= projects.length}
              onClick={() => setPage((prevPage) => prevPage + 1)}
              isLoading={!!projects.length && isProjectsLoading}
            >
              Load More
            </LoadingButton>
          </CenterWrapper>
        ) : null}
      </>

      <ButtonWrapper>
        <Button onClick={() => handleNavigateToConnectedPage()}>Cancel</Button>
        <LoadingButton
          appearance='primary'
          isDisabled={selectedProjects.length === 0}
          onClick={() => handleNavigateToScreen()}
          isLoading={isProjectsImporting}
        >
          Select
        </LoadingButton>
      </ButtonWrapper>
    </Wrapper>
  );
};
