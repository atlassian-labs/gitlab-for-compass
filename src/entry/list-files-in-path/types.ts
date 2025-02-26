// https://docs.gitlab.com/api/repositories/#list-repository-tree
import { ProjectFile } from '../../types';

type ListFilesInPathPayload = {
  projectId: number;
  groupId: number;
  ref?: string;
  path?: string;
  pageToken?: string;
  pageSize?: number;
  recursive?: boolean;
};

type ListFilesInPathResponse = {
  success: boolean;
  statusCode: number;
  files?: ProjectFile[];
  errorMessage?: string;
};

export { ListFilesInPathPayload, ListFilesInPathResponse };
