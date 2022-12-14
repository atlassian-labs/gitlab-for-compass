import { useCallback, useEffect, useState } from 'react';
import { ErrorTypes, ImportErrorTypes } from '../resolverTypes';
import { getImportResult } from '../services/invokes';
import { ImportableProject } from '../types';
import { useImportContext } from './useImportContext';

type UseImportResultType = {
  isLoading: boolean;
  failedProjects: ImportableProject[];
  totalProjects: number;
  error?: ErrorTypes | null;
};

export const useImportResult = (): UseImportResultType => {
  const { isImportInProgress } = useImportContext();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [failedProjects, setFailedProjects] = useState<ImportableProject[]>([]);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [error, setError] = useState<ErrorTypes | null>(null);

  const fetchFailedImportedRepositories = useCallback(async () => {
    try {
      setIsLoading(true);

      const { success, data, errors } = await getImportResult();

      if (success && data) {
        setTotalProjects(data.total);
        setFailedProjects(data.failed);
      } else {
        setError((errors && errors[0].errorType) || ImportErrorTypes.UNEXPECTED_ERROR);
      }
    } catch (err) {
      setError(ImportErrorTypes.UNEXPECTED_ERROR);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setTotalProjects, setFailedProjects]);

  useEffect(() => {
    if (!isImportInProgress) {
      fetchFailedImportedRepositories();
    }
  }, [isImportInProgress]);

  return {
    isLoading,
    failedProjects,
    totalProjects,
    error,
  };
};
