type GetFileContentsPayload = {
  projectId: number;
  groupId: number;
  filePath: string;
  ref?: string;
};

type GetFileContentsResponse = {
  success: boolean;
  statusCode: number;
  errorMessage?: string;
  file?: {
    contents: string;
  };
};

export { GetFileContentsPayload, GetFileContentsResponse };
