import { useEffect, useState } from 'react';
import { getAllCompassComponentTypes } from '../services/invokes';
import { CompassComponentTypeId, ComponentTypesResult } from '../services/types';
import { ErrorTypes, ImportErrorTypes } from '../resolverTypes';

export const useComponentTypes = (): ComponentTypesResult => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorTypes | null>();
  const [componentTypes, setComponentTypes] = useState<CompassComponentTypeId[]>([]);
  useEffect(() => {
    setLoading(true);
    getAllCompassComponentTypes()
      .then((response) => {
        const { success, data, errors } = response;
        setLoading(false);
        if (success && data) {
          setComponentTypes(data);
        } else if (errors && errors.length) {
          setError((errors && errors[0].errorType) || ImportErrorTypes.UNEXPECTED_ERROR);
        }
      })
      .catch((e) => {
        setLoading(false);
        setError(e);
      });
  }, []);

  return {
    componentTypesLoading: loading,
    error,
    componentTypes,
  };
};
