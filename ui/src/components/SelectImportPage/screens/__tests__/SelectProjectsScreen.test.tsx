import { render } from '@testing-library/react';

import { SelectProjectsScreen } from '../SelectProjectsScreen';
import { projectImportSelectionMock, groupMock, componentTypesResultMock } from '../__mocks__/mocks';

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
});
