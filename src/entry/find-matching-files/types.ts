export type FindMatchingFilesPayload = {
  repoUrl: string;
  fileName: {
    // These are OR'd together
    equalsOneOf: string[];
    containsOneOf: string[];
  };
  context: {
    cloudId: string;
    extensionId: string;
  };
};

export type File = {
  path: string;
  metadata: {
    size?: number;
  };
};

export type FindMatchingFilesResponse = {
  success: boolean;
  statusCode: number;
  files: File[];
  errorMessage?: string;
};
