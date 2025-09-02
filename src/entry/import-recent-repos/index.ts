import { internalMetrics } from '@forge/metrics';
import { backOff } from 'exponential-backoff';
import { storage } from '@forge/api';
import { ALL_SETTLED_STATUS } from '@atlassian/forge-graphql';
import { createComponent, createComponentSlug } from '../../client/compass';
import { getConnectedGroups } from '../../services/group';
import { getProjectLabels } from '../../services/get-labels';
import { ImportRecentReposPayload, ImportRecentReposReturn, ImportResultsSummary } from './types';
import { BACK_OFF, DEFAULT_COMPONENT_TYPE_ID, STORAGE_KEYS, STORAGE_SECRETS } from '../../constants';
import { CompareProjectWithExistingComponent, GitlabAPIProject, ImportableProject } from '../../types';
import { getProjects } from '../../client/gitlab';
import { compareProjectWithExistingComponent } from '../../services/fetch-projects';

const fetchRecentProjects = async (
  groupToken: string,
  groupId: number,
  numRepos: number,
): Promise<{ data: GitlabAPIProject[]; headers: Headers }> => {
  return getProjects(groupToken, groupId, 1, numRepos, undefined, 'last_activity_at');
};

const checkForExistingImports = async (
  cloudId: string,
  groupToken: string,
  projects: GitlabAPIProject[],
): Promise<CompareProjectWithExistingComponent[]> => {
  const settledPromises = await Promise.allSettled(
    projects.map((project) => compareProjectWithExistingComponent(cloudId, project.id, groupToken)),
  );

  const checkedDataWithExistingComponents = settledPromises.map((result) => {
    if (result.status === ALL_SETTLED_STATUS.FULFILLED) {
      return result.value;
    }
    console.error(`Error processing project: ${result.reason}`);
    throw new Error(result.reason);
  });

  return checkedDataWithExistingComponents;
};

const filterExistingProjects = (
  projects: GitlabAPIProject[],
  checkedDataWithExistingComponents: CompareProjectWithExistingComponent[],
): GitlabAPIProject[] => {
  return projects
    .filter((project, i) => !checkedDataWithExistingComponents[i].hasComponent)
    .map((project, i) => ({
      ...project,
      ...checkedDataWithExistingComponents[i],
    }));
};

const mapProjectToImportableProject = async (
  project: GitlabAPIProject,
  groupToken: string,
): Promise<ImportableProject> => {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    url: project.web_url,
    defaultBranch: project.default_branch,
    groupName: project.namespace.name,
    groupPath: project.namespace.path,
    groupFullPath: project.namespace.full_path,
    labels: await getProjectLabels(project.id, groupToken, project.topics),
    isManaged: false,
    hasComponent: false,
    isCompassFilePrOpened: false,
    typeId: DEFAULT_COMPONENT_TYPE_ID,
  };
};

const setFailedRepositoriesToStore = async (project: ImportableProject) => {
  try {
    internalMetrics.counter('compass.gitlab.import.end.fail').incr();
    await backOff(
      () => storage.set(`${STORAGE_KEYS.CURRENT_IMPORT_FAILED_PROJECT_PREFIX}:${project.id}`, project),
      BACK_OFF,
    );
  } catch (err) {
    console.error('Failed to stored failed project after all retries', err);
  }
};

const importReposToCompass = async (
  cloudId: string,
  projects: GitlabAPIProject[],
  groupToken: string,
): Promise<PromiseSettledResult<boolean>[]> => {
  return Promise.allSettled(
    projects.map(async (project) => {
      const projectReadyForImport = await mapProjectToImportableProject(project, groupToken);
      try {
        const response = await backOff(() => createComponent(cloudId, projectReadyForImport), BACK_OFF);
        if ('err' in response) {
          await setFailedRepositoriesToStore(projectReadyForImport);
          return false;
        }
        if (response.id && projectReadyForImport.name) {
          await createComponentSlug(response.id, projectReadyForImport.name);
        }
        internalMetrics.counter('compass.gitlab.import.end.success').incr();
        return true;
      } catch (err) {
        console.error(`Failed to import project ${project.id}`, err);
        await setFailedRepositoriesToStore(projectReadyForImport);
        return false;
      }
    }),
  );
};

const summarizeImportResults = (importResults: PromiseSettledResult<boolean>[]): ImportResultsSummary => {
  return importResults.reduce(
    (acc, result) => {
      if (result.status === 'fulfilled') {
        acc[result.value ? 'successfulImports' : 'failedImports'] += 1;
      }
      return acc;
    },
    { successfulImports: 0, failedImports: 0 },
  );
};

export const importRecentRepos = async ({
  cloudId,
  numRepos = 20,
}: ImportRecentReposPayload): Promise<ImportRecentReposReturn> => {
  try {
    const connectedGroups = await getConnectedGroups();

    if (!connectedGroups || connectedGroups.length === 0) {
      console.error('No connected Gitlab groups found.');
      return {
        success: false,
        errors: 'No connected Gitlab groups',
        response: { numReposImported: 0 },
      };
    }

    const groupId = connectedGroups[0].id;
    const groupToken = await storage.getSecret(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}${groupId}`);

    const recentProjects = await fetchRecentProjects(groupToken, groupId, numRepos);
    const checkedDataWithExistingComponents = await checkForExistingImports(cloudId, groupToken, recentProjects.data);
    const projectsToImport = filterExistingProjects(recentProjects.data, checkedDataWithExistingComponents);

    // eslint-disable-next-line no-console
    console.log(`Importing ${projectsToImport.length} recent repos that have not been imported yet`);

    const importResults = await importReposToCompass(cloudId, projectsToImport, groupToken);
    const { successfulImports, failedImports } = summarizeImportResults(importResults);

    return {
      success: failedImports === 0,
      response: {
        numReposImported: successfulImports,
      },
    };
  } catch (error) {
    console.error('An error occurred during the import process:', error);
    return {
      success: false,
      errors: `An error occurred while importing projects: ${error.message}`,
      response: {
        numReposImported: 0,
      },
    };
  }
};
