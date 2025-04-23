import { ProjectFile } from 'src/types';
import { FindMatchingFilesPayload, FindMatchingFilesResponse } from './types';
import { getProjectDataFromUrl } from '../../services/data-provider-link-parser';
import { listFiles } from '../../client/gitlab';
import { isPackageDependenciesM3Enabled } from '../../services/feature-flags';

const MAX_NUM_FILES_PER_PAGE = 100;
const LEVELS_TO_SEARCH = 5;

const callListFiles = async (groupToken: string, projectId: number, path?: string) => {
  let shouldContinue = true;
  let pageToken;
  const topLevelFiles: ProjectFile[] = [];

  while (shouldContinue) {
    const files: ProjectFile[] = await listFiles(
      groupToken,
      projectId,
      path,
      undefined,
      pageToken,
      MAX_NUM_FILES_PER_PAGE,
      false,
    );

    topLevelFiles.push(...files);

    if (files.length < MAX_NUM_FILES_PER_PAGE) {
      // there are no more files to paginate
      shouldContinue = false;
    } else {
      pageToken = files[files.length - 1].id;
    }
  }

  return topLevelFiles;
};

const getDirectories = (files: ProjectFile[]) => {
  return files.filter((file) => file.type === 'tree');
};

const getMatchingFiles = (files: ProjectFile[], containsOneOf: string[], equalsOneOf: string[]) => {
  return files.filter(
    (file) => file.type === 'blob' && (containsOneOf.includes(file.name) || equalsOneOf.includes(file.name)),
  );
};

export const findMatchingFiles = async (payload: FindMatchingFilesPayload): Promise<FindMatchingFilesResponse> => {
  if (!isPackageDependenciesM3Enabled()) {
    return {
      success: false,
      errorMessage: 'Feature not implemented.',
      statusCode: 405,
      files: [],
    };
  }
  try {
    if (payload.fileName.containsOneOf.length === 0 && payload.fileName.equalsOneOf.length === 0) {
      return {
        success: false,
        errorMessage: 'No file names provided.',
        statusCode: 400,
        files: [],
      };
    }

    const projectData = await getProjectDataFromUrl(payload.repoUrl);
    if (projectData == null) {
      return {
        success: false,
        errorMessage: 'Error parsing repository URL.',
        statusCode: 400,
        files: [],
      };
    }

    const { project, groupToken } = projectData;

    let foundMatchingFiles: ProjectFile[] = [];
    let nextLevelDirectoriesToCheck: ProjectFile[] = [];

    // Check top level first
    const allTopLevelFiles = await callListFiles(groupToken, project.id);
    const matchingTopLevelFiles = getMatchingFiles(
      allTopLevelFiles,
      payload.fileName.containsOneOf,
      payload.fileName.equalsOneOf,
    );
    if (matchingTopLevelFiles.length > 0) {
      console.log(`Found ${matchingTopLevelFiles.length} matching files in depth level 0`);
      foundMatchingFiles = [...foundMatchingFiles, ...matchingTopLevelFiles];
    }

    nextLevelDirectoriesToCheck = getDirectories(allTopLevelFiles);
    for (let i = 0; i < LEVELS_TO_SEARCH - 1; i += 1) {
      let tempNextLevelDirectoriesToCheck: ProjectFile[] = [];
      console.log(`Searching ${nextLevelDirectoriesToCheck.length} directories in depth level ${i + 1}`);

      for (const directory of nextLevelDirectoriesToCheck) {
        const allProjectFiles = await callListFiles(groupToken, project.id, directory.path);
        console.log(`Found ${allProjectFiles.length} project files in depth level ${i + 1}`);

        const matchingFiles = getMatchingFiles(
          allProjectFiles,
          payload.fileName.containsOneOf,
          payload.fileName.equalsOneOf,
        );
        if (matchingFiles.length > 0) {
          console.log(`Found ${matchingFiles.length} matching files in depth level ${i + 1}`);
          foundMatchingFiles = [...foundMatchingFiles, ...matchingFiles];
        }

        const directories = getDirectories(allProjectFiles);
        tempNextLevelDirectoriesToCheck = [...tempNextLevelDirectoriesToCheck, ...directories];
      }
      nextLevelDirectoriesToCheck = tempNextLevelDirectoriesToCheck;
    }

    return {
      success: true,
      files: foundMatchingFiles.map((file) => ({
        path: file.path,
        metadata: {},
      })),
      statusCode: 200,
    };
  } catch (e) {
    console.log('Failed to find matching files', e.message);
    return {
      success: false,
      errorMessage: e.message,
      statusCode: 500,
      files: [],
    };
  }
};
