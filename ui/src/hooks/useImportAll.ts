import { useCallback, useEffect, useState } from 'react';
import { showFlag } from '@forge/bridge';
import { useAppContext } from './useAppContext';
import { getGroupProjects, importProjects } from '../services/invokes';
import { getComponentTypeOption, sleep } from '../components/utils';
import { ImportableProject } from '../types';
import { DEFAULT_COMPONENT_TYPE_ID } from '../constants';

const DELAY_BETWEEN_REPO_IMPORT_CALLS = 50;

const MAX_PER_PAGE = 100;
const DEFAULT_GROUP_ID = 0;

export enum IMPORT_STATE {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ALREADY_IMPORTED = 'ALREADY_IMPORTED',
}

export type ImportProjectWithStates = ImportableProject & {
  state?: IMPORT_STATE;
};

export const useImportAll = (): {
  importedProjects: ImportProjectWithStates[];
  isImporting: boolean;
  projectsFetchingError: string;
} => {
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [locationGroupId, setLocationGroupId] = useState<number>(DEFAULT_GROUP_ID);
  const [groupId, setGroupId] = useState<number>(DEFAULT_GROUP_ID);
  const [importedProjects, setImportedProjects] = useState<ImportProjectWithStates[]>([]);
  const [projectsFetchingError, setProjectsFetchingError] = useState<string>('');

  const { getConnectedInfo } = useAppContext();

  const updateProjectsToImport = (repository: ImportProjectWithStates, states: { state: IMPORT_STATE }) => {
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
          const importResponse = await importProjects([repositoryToImport], groupId);

          if (!importResponse.success && !importResponse.data) {
            updateProjectsToImport(repositoryToImport, {
              state: IMPORT_STATE.FAILED,
            });
          }
          updateProjectsToImport(repositoryToImport, {
            state: IMPORT_STATE.SUCCESS,
          });
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
            return {
              ...project,
              isSelected: false,
              ownerTeamOption: null,
              typeId: project.typeId || DEFAULT_COMPONENT_TYPE_ID,
              typeOption: getComponentTypeOption(project?.typeId),
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
  };
};
