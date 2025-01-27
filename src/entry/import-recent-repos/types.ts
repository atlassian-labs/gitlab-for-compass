export type ImportRecentReposPayload = {
  numRepos: number;
};

export type ImportRecentReposReturn = {
  success: boolean;
  errors?: string;
  response: {
    numReposImported: number;
  };
};
