type GetRepoDetailsPayload = {
  projectUrl: string;
};

type GetRepoDetailsResponse = {
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

export { GetRepoDetailsPayload, GetRepoDetailsResponse };
