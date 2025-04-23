import { ProjectFile } from 'src/types';
import { FindMatchingFilesPayload, FindMatchingFilesResponse } from './types';
import { getProjectDataFromUrl } from '../../services/data-provider-link-parser';
import { listFiles } from '../../client/gitlab';
import { isPackageDependenciesM3Enabled } from '../../services/feature-flags';

const MAX_NUM_FILES_PER_PAGE = 100;

const getFiles = async (groupToken: string, projectId: number, path?: string) => {
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

const getTreeProjectFiles = (files: ProjectFile[]) => {
  return files.filter((file) => file.type === 'tree');
};

const getFileBlobs = (files: ProjectFile[]) => {
  return files.filter((file) => file.type === 'blob');
};

// Searches 2 levels deep for files
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

    let allFiles: ProjectFile[] = [];
    const topLevelProjectFiles = await getFiles(groupToken, project.id);
    const topLevelProjectFileBlobs = getFileBlobs(topLevelProjectFiles);
    const treeProjectFiles = getTreeProjectFiles(topLevelProjectFiles);

    allFiles = [...topLevelProjectFileBlobs];

    for (const file of treeProjectFiles) {
      const files = await getFiles(groupToken, project.id, file.path);
      const fileBlobs = getFileBlobs(files);
      allFiles = [...allFiles, ...fileBlobs];
    }

    const matchingFiles = allFiles.filter(
      (file) => payload.fileName.containsOneOf.includes(file.name) || payload.fileName.equalsOneOf.includes(file.name),
    );

    console.log('matchingFiles', matchingFiles);
    return {
      success: true,
      files: matchingFiles.map((file) => ({
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
      statusCode: e.cause ?? 500,
      files: [],
    };
  }
};
