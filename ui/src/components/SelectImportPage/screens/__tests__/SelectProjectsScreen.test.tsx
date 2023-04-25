import { fireEvent, render } from '@testing-library/react';

import { SelectProjectsScreen } from '../SelectProjectsScreen';
import {
  projectImportSelectionMock,
  groupMock,
  componentTypesResultMock,
  componentTypesErrorResultMock,
  componentTypesWithTemplateResultMock,
} from '../__mocks__/mocks';

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
        componentTypesResult={componentTypesResultMock}
        locationGroupId={1}
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
        componentTypesResult={componentTypesResultMock}
        locationGroupId={1}
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
        componentTypesResult={componentTypesResultMock}
        locationGroupId={1}
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
        componentTypesResult={componentTypesErrorResultMock}
        locationGroupId={1}
      />,
    );

    expect(getByTestId('error-loading-component-types'));
    fireEvent.click(getByTestId('error-loading-component-types--button'));
    expect(getByText('Error loading component types. Try refreshing!'));
  });

  it('should filter out template component type', async () => {
    const { findByTestId, container, findByText } = render(
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
        componentTypesResult={componentTypesWithTemplateResultMock}
        locationGroupId={1}
      />,
    );

    const select = await findByTestId('select-2');
    await select.click();
    expect(await findByText('label')).toBeDefined();
    const allOptions = await container.getElementsByClassName('type-selector__single-value');
    expect(allOptions).toHaveLength(1);
  });
});
