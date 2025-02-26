type GetProjectDetailsPayload = {
  projectUrl: string;
};

type GetProjectDetailsResponse = {
  success: boolean;
  statusCode: number;
  errorMessage?: string;
  project?: {
    projectId: number;
    groupId: number;
    defaultBranch: string;
    shaOnDefaultBranch: string;
  };
};

export { GetProjectDetailsPayload, GetProjectDetailsResponse };
