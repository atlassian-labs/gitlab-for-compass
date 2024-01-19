import { fireEvent, render } from '@testing-library/react';

import { SelectProjectsScreen } from '../SelectProjectsScreen';
import {
  projectImportSelectionMock,
  groupMock,
  componentTypesResultMock,
  componentTypesErrorResultMock,
} from '../__mocks__/mocks';
import { GitlabAPIGroup } from '../../../../types';

jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    state: 123,
  }),
}));

describe('SelectProjectsScreen', () => {
  it('should render projects import table with load more button', async () => {
    const { findByTestId } = render(
      <SelectProjectsScreen
        projects={projectImportSelectionMock}
        isProjectsLoading={false}
        onSelectAllItems={jest.fn()}
        onChangeComponentType={jest.fn()}
        handleNavigateToConnectedPage={jest.fn()}
        projectsFetchingError=''
        onSelectItem={jest.fn()}
        selectedProjects={projectImportSelectionMock}
        handleNavigateToScreen={jest.fn()}
        isProjectsImporting
        totalProjects={10}
        setPage={jest.fn()}
        groups={groupMock}
        isGroupsLoading={false}
        handleChangeGroup={jest.fn()}
        handleSearchValue={jest.fn()}
        importableComponentTypes={componentTypesResultMock}
        locationGroupId={1}
        isOwnerTeamEnabled={false}
      />,
    );

    expect(await findByTestId('load-more-button')).toBeDefined();
    expect(await findByTestId('projects-import-table--table')).toBeDefined();
  });

  it('should not render load more button when projects not exist', () => {
    const { queryByTestId } = render(
      <SelectProjectsScreen
        projects={[]}
        isProjectsLoading={false}
        onSelectAllItems={jest.fn()}
        onChangeComponentType={jest.fn()}
        handleNavigateToConnectedPage={jest.fn()}
        projectsFetchingError=''
        onSelectItem={jest.fn()}
        selectedProjects={projectImportSelectionMock}
        handleNavigateToScreen={jest.fn()}
        isProjectsImporting
        totalProjects={10}
        setPage={jest.fn()}
        groups={groupMock}
        isGroupsLoading={false}
        handleChangeGroup={jest.fn()}
        handleSearchValue={jest.fn()}
        importableComponentTypes={componentTypesResultMock}
        locationGroupId={1}
        isOwnerTeamEnabled={false}
      />,
    );

    expect(queryByTestId('load-more-button')).toBeNull();
  });

  it('should disabled load more button when all projects are rendered', () => {
    const { getByTestId } = render(
      <SelectProjectsScreen
        projects={projectImportSelectionMock}
        isProjectsLoading={false}
        onSelectAllItems={jest.fn()}
        onChangeComponentType={jest.fn()}
        handleNavigateToConnectedPage={jest.fn()}
        projectsFetchingError=''
        onSelectItem={jest.fn()}
        selectedProjects={projectImportSelectionMock}
        handleNavigateToScreen={jest.fn()}
        isProjectsImporting
        totalProjects={1}
        setPage={jest.fn()}
        groups={groupMock}
        isGroupsLoading={false}
        handleChangeGroup={jest.fn()}
        handleSearchValue={jest.fn()}
        importableComponentTypes={componentTypesResultMock}
        locationGroupId={1}
        isOwnerTeamEnabled={false}
      />,
    );

    expect(getByTestId('load-more-button')).toHaveProperty('disabled', true);
  });

  it('should show an error message per component type dropdown when component types result is empty.', () => {
    const { getByTestId, getByText } = render(
      <SelectProjectsScreen
        projects={projectImportSelectionMock}
        isProjectsLoading={false}
        onSelectAllItems={jest.fn()}
        onChangeComponentType={jest.fn()}
        handleNavigateToConnectedPage={jest.fn()}
        projectsFetchingError=''
        onSelectItem={jest.fn()}
        selectedProjects={projectImportSelectionMock}
        handleNavigateToScreen={jest.fn()}
        isProjectsImporting
        totalProjects={1}
        setPage={jest.fn()}
        groups={groupMock}
        isGroupsLoading={false}
        handleChangeGroup={jest.fn()}
        handleSearchValue={jest.fn()}
        importableComponentTypes={componentTypesErrorResultMock}
        locationGroupId={1}
        isOwnerTeamEnabled={false}
      />,
    );

    expect(getByTestId('error-loading-component-types'));
    fireEvent.click(getByTestId('error-loading-component-types--button'));
    expect(getByText('Error loading component types. Try refreshing!'));
  });

  it('should filter out connected parent group from group selector options', () => {
    const parentGroupId = 1;
    const parentGroupName = 'parent-group';
    const subgroupName = 'subgroup';

    const parentGroup: GitlabAPIGroup = {
      full_name: 'parent-group-full-name',
      name: parentGroupName,
      id: parentGroupId,
      path: '/',
    };
    const subgroup: GitlabAPIGroup = {
      full_name: 'subgroup-full-name',
      name: subgroupName,
      id: 2,
      path: '/',
    };

    const groups: GitlabAPIGroup[] = [parentGroup, subgroup];

    const unchangedProps = {
      projects: projectImportSelectionMock,
      isProjectsLoading: false,
      onSelectAllItems: jest.fn(),
      onChangeComponentType: jest.fn(),
      handleNavigateToConnectedPage: jest.fn(),
      projectsFetchingError: '',
      onSelectItem: jest.fn(),
      selectedProjects: projectImportSelectionMock,
      handleNavigateToScreen: jest.fn(),
      isProjectsImporting: true,
      totalProjects: 10,
      setPage: jest.fn(),
      isGroupsLoading: false,
      handleChangeGroup: jest.fn(),
      handleSearchValue: jest.fn(),
      importableComponentTypes: componentTypesResultMock,
    };

    const { queryByTestId, rerender, queryByText } = render(
      <SelectProjectsScreen {...unchangedProps} groups={[]} locationGroupId={0} isOwnerTeamEnabled={false} />,
    );

    // groups fetched and the groupSelectorOptions calculated and memoized
    rerender(
      <SelectProjectsScreen {...unchangedProps} groups={groups} locationGroupId={0} isOwnerTeamEnabled={false} />,
    );

    // locationGroupId updated and the groupSelectorOptions should be recalculated
    rerender(
      <SelectProjectsScreen
        {...unchangedProps}
        groups={groups}
        locationGroupId={parentGroupId}
        isOwnerTeamEnabled={false}
      />,
    );

    const selectContainer = queryByTestId('group-selector');
    expect(selectContainer).not.toBeNull();
    const select = (selectContainer as HTMLElement).firstElementChild;

    // open select dropdown
    fireEvent.keyDown(select as Element, { key: 'ArrowDown' });

    expect(queryByText(subgroupName)).not.toBeNull();
    expect(queryByText(parentGroupName)).toBeNull();
  });

  it('renders SelectProjectsScreen with Owner team column', async () => {
    const { queryByText } = render(
      <SelectProjectsScreen
        projects={projectImportSelectionMock}
        isProjectsLoading={false}
        onSelectAllItems={jest.fn()}
        onChangeComponentType={jest.fn()}
        handleNavigateToConnectedPage={jest.fn()}
        projectsFetchingError=''
        onSelectItem={jest.fn()}
        selectedProjects={projectImportSelectionMock}
        handleNavigateToScreen={jest.fn()}
        isProjectsImporting
        totalProjects={1}
        setPage={jest.fn()}
        groups={groupMock}
        isGroupsLoading={false}
        handleChangeGroup={jest.fn()}
        handleSearchValue={jest.fn()}
        importableComponentTypes={componentTypesErrorResultMock}
        locationGroupId={1}
        isOwnerTeamEnabled={true}
      />,
    );

    expect(await queryByText('Owner team')).toBeTruthy();
  });

  it('renders SelectProjectsScreen without Owner team column', async () => {
    const { queryByText } = render(
      <SelectProjectsScreen
        projects={projectImportSelectionMock}
        isProjectsLoading={false}
        onSelectAllItems={jest.fn()}
        onChangeComponentType={jest.fn()}
        handleNavigateToConnectedPage={jest.fn()}
        projectsFetchingError=''
        onSelectItem={jest.fn()}
        selectedProjects={projectImportSelectionMock}
        handleNavigateToScreen={jest.fn()}
        isProjectsImporting
        totalProjects={1}
        setPage={jest.fn()}
        groups={groupMock}
        isGroupsLoading={false}
        handleChangeGroup={jest.fn()}
        handleSearchValue={jest.fn()}
        importableComponentTypes={componentTypesErrorResultMock}
        locationGroupId={1}
        isOwnerTeamEnabled={false}
      />,
    );

    expect(await queryByText('Owner team')).toBeFalsy();
  });
});
