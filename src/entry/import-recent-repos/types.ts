export type ImportRecentReposPayload = {
  cloudId: string;
  numRepos: number;
};

export type ImportRecentReposReturn = {
  success: boolean;
  errors?: string;
  response: {
    numReposImported: number;
  };
};

export type ImportResultsSummary = {
  successfulImports: number;
  failedImports: number;
};
