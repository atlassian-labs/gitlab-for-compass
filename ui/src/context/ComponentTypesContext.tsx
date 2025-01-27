import React, { createContext, useEffect, useState } from 'react';
import Spinner from '@atlaskit/spinner';
import { CompassComponentTypeObject } from '@atlassian/forge-graphql';
import { getAllCompassComponentTypes } from '../services/invokes';

export type ComponentTypesContextValue = {
  componentTypes: CompassComponentTypeObject[];
};

export const ComponentTypesContext = createContext({ componentTypes: [] } as ComponentTypesContextValue);

const useGetComponentTypes = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [componentTypes, setComponentTypes] = useState<CompassComponentTypeObject[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    getAllCompassComponentTypes()
      .then((response) => {
        const { success, data, errors } = response;
        setLoading(false);
        if (success && data) {
          setComponentTypes(data);
        } else {
          setError((errors ?? []).map((e) => e.message).join(', '));
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

export const ComponentTypesContextProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const types = useGetComponentTypes();
  if (types.componentTypesLoading) {
    return <Spinner size={'small'} />;
  }

  if (types.error) {
    return <div>There was an error loading information abut component types. Please try reloading the page</div>;
  }

  return (
    <ComponentTypesContext.Provider value={{ componentTypes: types.componentTypes }}>
      {children}
    </ComponentTypesContext.Provider>
  );
};
