import { useState } from 'react';

import { ErrorTypes, ImportErrorTypes } from '../resolverTypes';
import { getImportStatus } from '../services/invokes';
import { useImportContext } from './useImportContext';
import { useInterval } from './useInterval';

type UseImportProgressType = {
  error: ErrorTypes | null | undefined;
  importedRepositories: number;
  totalSelectedRepos: number;
};

const INVOCATION_DELAY = 1000;

export const useImportProgress = (): UseImportProgressType => {
  const [error, setError] = useState<ErrorTypes | null>();

  const { setIsImportInProgress, importedRepositories, setImportedRepositories, totalSelectedRepos } =
    useImportContext();

  const isNeedToClearProgress =
    totalSelectedRepos === importedRepositories && !!totalSelectedRepos && !!importedRepositories;

  const fetchImportProgress = async () => {
    try {
      const { success, data, errors } = await getImportStatus();

      if (success && data && data.success + data.failed >= importedRepositories) {
        setImportedRepositories(data.success + data.failed);
      }

      if (!success && errors && errors.length) {
        setError((errors && errors[0].errorType) || ImportErrorTypes.UNEXPECTED_ERROR);
      }
    } catch (err) {
      setError(ImportErrorTypes.UNEXPECTED_ERROR);
      setIsImportInProgress(false);
    }
  };

  useInterval(() => {
    if (!isNeedToClearProgress && !error) {
      fetchImportProgress();
    } else {
      setIsImportInProgress(false);
      setImportedRepositories(0);
    }
  }, INVOCATION_DELAY);

  return {
    error,
    importedRepositories,
    totalSelectedRepos,
  };
};
