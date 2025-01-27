import { ImportRecentReposPayload, ImportRecentReposReturn } from './types';

/**
 * Dummy handler function to import recent repositories.
 *
 * @param payload - The payload containing the number of recent repositories to import.
 * @returns An object indicating the success of the operation and the number of repositories imported.
 */
export const importRecentRepos = async ({
  numRepos = 20,
}: ImportRecentReposPayload): Promise<ImportRecentReposReturn> => {
  console.log(`Importing ${numRepos} recent repos`);

  return {
    success: true,
    response: {
      numReposImported: numRepos,
    },
  };
};
