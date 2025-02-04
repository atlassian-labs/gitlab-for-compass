import { useCallback, useEffect, useState } from 'react';
import { showFlag } from '@forge/bridge';
import { useAppContext } from './useAppContext';
import { createMRWithCompassYML, createSingleComponent, getGroupProjects } from '../services/invokes';
import { getComponentTypeOptionForBuiltInType, sleep } from '../components/utils';
import { ImportableProject } from '../types';
import { DEFAULT_COMPONENT_TYPE_ID } from '../constants';
import { useComponentTypes } from './useComponentTypes';
import { useImportAllCaCContext } from './useImportAllCaCContext';

const DELAY_BETWEEN_REPO_IMPORT_CALLS = 50;

const MAX_PER_PAGE = 100;
const DEFAULT_GROUP_ID = 0;

export enum IMPORT_STATE {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ALREADY_IMPORTED = 'ALREADY_IMPORTED',
}

export enum CREATE_PR_STATE {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export type ImportProjectWithStates = ImportableProject & {
  state?: IMPORT_STATE;
  createPRState?: CREATE_PR_STATE;
};

export const useImportAll = (): {
  importedProjects: ImportProjectWithStates[];
  isImporting: boolean;
  projectsFetchingError: string;
  retryFailedProjects: (projectsToImport: ImportProjectWithStates[]) => Promise<void>;
} => {
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [locationGroupId, setLocationGroupId] = useState<number>(DEFAULT_GROUP_ID);
  const [groupId, setGroupId] = useState<number>(DEFAULT_GROUP_ID);
  const [importedProjects, setImportedProjects] = useState<ImportProjectWithStates[]>([]);
  const [projectsFetchingError, setProjectsFetchingError] = useState<string>('');
  const { componentTypes } = useComponentTypes();
  const { getConnectedInfo } = useAppContext();
  const { isCaCEnabledForImportAll } = useImportAllCaCContext();

  const updateProjectsToImport = (
    repository: ImportProjectWithStates,
    states: { state: IMPORT_STATE; createPRState?: CREATE_PR_STATE },
  ) => {
    setImportedProjects((prevState) => [...prevState, { ...repository, ...states }]);
  };

  const createComponentWithCaC = useCallback(async (repositoriesToImport: ImportProjectWithStates[]) => {
    for (const repositoryToImport of repositoriesToImport) {
      if (repositoryToImport.hasComponent || repositoryToImport.isCompassFilePrOpened || repositoryToImport.isManaged) {
        updateProjectsToImport(repositoryToImport, {
          state: IMPORT_STATE.ALREADY_IMPORTED,
        });
      } else {
        try {
          const importResponse = await createSingleComponent(repositoryToImport);

          if (isCaCEnabledForImportAll) {
            if (importResponse.success && importResponse.data) {
              try {
                const { success } = await createMRWithCompassYML(repositoryToImport, importResponse.data.id, groupId);

                if (success) {
                  updateProjectsToImport(repositoryToImport, {
                    state: IMPORT_STATE.SUCCESS,
                    createPRState: CREATE_PR_STATE.SUCCESS,
                  });
                }
                updateProjectsToImport(repositoryToImport, {
                  state: IMPORT_STATE.SUCCESS,
                  createPRState: CREATE_PR_STATE.FAILED,
                });
              } catch (e) {
                updateProjectsToImport(repositoryToImport, {
                  state: IMPORT_STATE.SUCCESS,
                  createPRState: CREATE_PR_STATE.FAILED,
                });
              }
            }
          } else {
            if (!importResponse.success && !importResponse.data) {
              updateProjectsToImport(repositoryToImport, {
                state: IMPORT_STATE.FAILED,
              });
            }
            updateProjectsToImport(repositoryToImport, {
              state: IMPORT_STATE.SUCCESS,
            });
          }
        } catch (e) {
          updateProjectsToImport(repositoryToImport, {
            state: IMPORT_STATE.FAILED,
          });
        }
      }

      await sleep(DELAY_BETWEEN_REPO_IMPORT_CALLS);
    }
  }, []);

  const fetchAndImportRepos = async () => {
    let page = 1;
    let queryMore = true;

    while (queryMore) {
      try {
        const { data, errors } = await getGroupProjects(groupId, page, locationGroupId, undefined, MAX_PER_PAGE);

        if (data && data.projects.length) {
          const projectsToImport = data.projects.map((project) => {
            const componentType = componentTypes.find((t) => t.id === project.typeId);
            const typeOption = componentType
              ? { label: componentType.name, value: componentType.id }
              : getComponentTypeOptionForBuiltInType();
            return {
              ...project,
              isSelected: false,
              ownerTeamOption: null,
              typeId: project.typeId || DEFAULT_COMPONENT_TYPE_ID,
              typeOption,
            };
          });

          await createComponentWithCaC(projectsToImport);

          queryMore = data.total / (page * MAX_PER_PAGE) > 1;
          page += 1;
        }
        if (errors && errors[0].message) {
          setProjectsFetchingError(errors[0].message);
        }
      } catch {
        setProjectsFetchingError('Unexpected error');
      }
    }
  };

  const retryFailedProjects = useCallback(
    async (projectsToImport: ImportProjectWithStates[]) => {
      setIsImporting(true);
      setImportedProjects([]);

      const failedImportedProjects = projectsToImport.filter((project) => project.state === IMPORT_STATE.FAILED);

      await createComponentWithCaC(failedImportedProjects);

      setIsImporting(false);
    },
    [setIsImporting, setImportedProjects],
  );

  useEffect(() => {
    getConnectedInfo()
      .then((value) => {
        if (value) {
          setLocationGroupId(value[0].id);
          setGroupId(value[0].id);
        }
      })
      .catch(() =>
        showFlag({
          id: 'import-all-error-connected-info-flag',
          type: 'error',
          title: `Error while getting group info`,
          description: `Error while getting group info. Try importing all again.`,
          isAutoDismiss: true,
        }),
      );
  }, []);

  useEffect(() => {
    setIsImporting(true);
    if (groupId !== DEFAULT_GROUP_ID) {
      fetchAndImportRepos()
        .catch(() =>
          showFlag({
            id: 'import-all-error-flag',
            type: 'error',
            title: `Error while importing all projects`,
            description: `Error while importing all projects. Try importing all again.`,
            isAutoDismiss: true,
          }),
        )
        .finally(() => setIsImporting(false));
    }
  }, [groupId]);

  return {
    importedProjects,
    isImporting,
    projectsFetchingError,
    retryFailedProjects,
  };
};
