import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { router } from '@forge/bridge';

import { CompassComponentTypeOption, ProjectImportSelection } from '../../services/types';
import { ApplicationState } from '../../routes';
import { getAllExistingGroups, getGroupProjects, importProjects } from '../../services/invokes';
import { ImportableProject, ResolverResponse, GitlabAPIGroup } from '../../resolverTypes';
import { useImportContext } from '../../hooks/useImportContext';
import { SelectProjectsScreen } from './screens/SelectProjectsScreen';
import { ConfirmationScreen } from './screens/ConfirmationScreen';
import { SelectorItem } from './screens/SelectProjectsScreen/buildGroupsSelectorOptions';
import { useAppContext } from '../../hooks/useAppContext';
import { useComponentTypes } from '../../hooks/useComponentTypes';
import { getComponentTypeOption } from '../utils';
import { getAvailableImportComponentTypes } from './utils';

export enum Screens {
  CONFIRMATION = 'CONFIRMATION',
  SELECT_PROJECT = 'SELECT_PROJECT',
}

export const DEFAULT_PAGE = 1;
const DEFAULT_GROUP_ID = 0;

export const SelectImportPage = () => {
  const navigate = useNavigate();

  const { getConnectedInfo, features } = useAppContext();
  const { setTotalSelectedRepos, setIsImportInProgress, setImportedRepositories } = useImportContext();
  const componentTypesResult = useComponentTypes();

  const importableComponentTypes = getAvailableImportComponentTypes(componentTypesResult);

  const [projects, setProjects] = useState<ProjectImportSelection[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);
  const [isGroupsLoading, setIsGroupsLoading] = useState<boolean>(false);
  const [isProjectsImporting, setIsProjectsImporting] = useState<boolean>(false);
  const [projectsImportingData, setProjectsImportingData] = useState<ResolverResponse | null>(null);
  const [projectsFetchingError, setProjectsFetchingError] = useState<string>('');
  const [syncWithCompassYml, setSyncWithCompassYml] = useState<boolean>(false);
  const [screen, setScreen] = useState<Screens>(Screens.SELECT_PROJECT);
  const [page, setPage] = useState<number>(DEFAULT_PAGE);
  const [locationGroupId, setLocationGroupId] = useState<number>(DEFAULT_GROUP_ID);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [groupId, setGroupId] = useState<number>(DEFAULT_GROUP_ID);
  const [groups, setGroups] = useState<GitlabAPIGroup[]>([]);
  const [search, setSearch] = useState<string>();

  const fetchGroups = async () => {
    setIsGroupsLoading(true);

    getAllExistingGroups()
      .then(({ data, success, errors }) => {
        if (success && data && data.length) {
          setGroups(data);
        }

        if (errors && errors[0].message) {
          setProjectsFetchingError(errors[0].message);
        }
      })
      .catch(() => {
        setProjectsFetchingError('Unexpected error');
      })
      .finally(() => {
        setIsGroupsLoading(false);
      });
  };

  const fetchGroupProjects = async () => {
    setIsProjectsLoading(true);

    getGroupProjects(groupId, page, locationGroupId, search)
      .then(({ data, success, errors }) => {
        if (success && data && data.projects.length) {
          const projectsForTable = data.projects.map((project) => ({
            ...project,
            isSelected: false,
            shouldOpenMR: false,
            typeOption: getComponentTypeOption(project?.typeId),
          }));

          setTotalProjects(data.total);
          setProjects((prevState) => [...prevState, ...projectsForTable]);
        }

        if (errors && errors[0].message) {
          setProjectsFetchingError(errors[0].message);
        }
      })
      .catch(() => {
        setProjectsFetchingError('Unexpected error');
      })
      .finally(() => {
        setIsProjectsLoading(false);
      });
  };

  useEffect(() => {
    setIsProjectsLoading(true);
    getConnectedInfo()
      .then((value) => {
        if (value) {
          setLocationGroupId(value[0].id);
          setGroupId(value[0].id);
        }
      })
      .finally(() => setIsProjectsLoading(false));
  }, []);

  useEffect(() => {
    if (groupId !== DEFAULT_GROUP_ID) {
      fetchGroupProjects();
    }
  }, [page, groupId, search]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const onSelectAllItems = (filteredProjects: ProjectImportSelection[], isAllItemsSelected: boolean) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        const existingFilteredProject = filteredProjects.find((filteredProject) => filteredProject.id === project.id);

        if (existingFilteredProject) {
          return {
            ...project,
            isSelected: isAllItemsSelected ? false : !(project.isManaged || project.isCompassFilePrOpened),
          };
        }

        return project;
      }),
    );
  };

  const onSelectItem = (id: number) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        if (id === project.id) {
          return { ...project, isSelected: !project.isSelected };
        }

        return project;
      }),
    );
  };

  const onChangeComponentType = (id: number, componentTypeOption: CompassComponentTypeOption) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        if (id === project.id) {
          return { ...project, typeOption: componentTypeOption };
        }

        return project;
      }),
    );
  };

  const resetInitialProjectsData = () => {
    setProjects([]);
    setPage(1);
    setIsProjectsLoading(true);
  };

  const handleClearSelectedGroup = () => {
    const isSelectionClearedOnEmptyState = groupId === locationGroupId;

    if (isSelectionClearedOnEmptyState) {
      return;
    }

    resetInitialProjectsData();
    setGroupId(locationGroupId);
  };

  const handleSelectGroup = (item: SelectorItem) => {
    const isSameGroupSelected = item.value === groupId;

    if (isSameGroupSelected) {
      return;
    }

    resetInitialProjectsData();
    setGroupId(item.value);
  };

  const handleChangeGroup = (item: SelectorItem | null) => {
    if (item) {
      handleSelectGroup(item);
    } else {
      handleClearSelectedGroup();
    }
  };

  const handleSearchValue = (value: string) => {
    resetInitialProjectsData();

    setSearch(value);
  };

  const selectedProjects = useMemo(() => projects.filter(({ isSelected }) => isSelected), [projects]);

  const handleNavigateToConnectedPage = () => {
    router.navigate('/compass/components');
  };

  const handleNavigateToImportProgressPage = () => {
    navigate(`..${ApplicationState.CONNECTED}/progress`, { replace: true });
  };

  const handleNavigateToConfirmationScreen = () => {
    setScreen(Screens.CONFIRMATION);
  };

  const handleNavigateToSelectProjectsScreen = () => {
    setScreen(Screens.SELECT_PROJECT);
  };

  const handleImportProjects = () => {
    setIsProjectsImporting(true);

    const projectsReadyToImport = projects.reduce<ImportableProject[]>((acc, curr) => {
      if (curr.isSelected) {
        acc.push({
          ...curr,
          typeId: curr.typeOption.value,
          shouldOpenMR: syncWithCompassYml,
        });
      }

      return acc;
    }, []);

    setTotalSelectedRepos(projectsReadyToImport.length);
    setImportedRepositories(0);
    setIsImportInProgress(true);

    importProjects(projectsReadyToImport, groupId)
      .then((response) => {
        if (response.success) {
          setProjectsImportingData(response);
          handleNavigateToImportProgressPage();
        } else {
          setProjectsImportingData(response);
        }
      })
      .finally(() => {
        setIsProjectsImporting(false);
      });
  };

  return (
    <>
      {screen === Screens.SELECT_PROJECT && (
        <SelectProjectsScreen
          projects={projects}
          isProjectsLoading={isProjectsLoading}
          onSelectAllItems={onSelectAllItems}
          onChangeComponentType={onChangeComponentType}
          handleNavigateToConnectedPage={handleNavigateToConnectedPage}
          projectsFetchingError={projectsFetchingError}
          onSelectItem={onSelectItem}
          selectedProjects={selectedProjects}
          handleNavigateToScreen={handleNavigateToConfirmationScreen}
          isProjectsImporting={isProjectsImporting}
          totalProjects={totalProjects}
          setPage={setPage}
          groups={groups}
          isGroupsLoading={isGroupsLoading}
          handleChangeGroup={handleChangeGroup}
          handleSearchValue={handleSearchValue}
          locationGroupId={locationGroupId}
          importableComponentTypes={importableComponentTypes}
        />
      )}
      {screen === Screens.CONFIRMATION && (
        <ConfirmationScreen
          projectsReadyToImport={selectedProjects}
          onChangeComponentType={onChangeComponentType}
          syncWithCompassYml={syncWithCompassYml}
          setSyncWithCompassYml={setSyncWithCompassYml}
          handleNavigateToScreen={handleNavigateToSelectProjectsScreen}
          handleImportProjects={handleImportProjects}
          isProjectsImporting={isProjectsImporting}
          projectsImportingData={projectsImportingData}
          importableComponentTypes={importableComponentTypes}
        />
      )}
    </>
  );
};
