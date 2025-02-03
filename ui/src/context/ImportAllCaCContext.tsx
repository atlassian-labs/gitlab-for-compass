import { createContext, FunctionComponent, ReactNode, useMemo, useState } from 'react';

type ImportAllCaCProviderProps = {
  children: ReactNode;
};

export type ImportAllCaCContextType = {
  isCaCEnabledForImportAll: boolean;
  setCaCEnabledForImportAll: (value: boolean) => void;
};

export const ImportAllCaCContext = createContext({} as ImportAllCaCContextType);

export const ImportAllCaCProvider: FunctionComponent<ImportAllCaCProviderProps> = ({ children }) => {
  const [isCaCEnabledForImportAll, setCaCEnabledForImportAll] = useState(false);

  const providerValues = useMemo(() => {
    return {
      isCaCEnabledForImportAll,
      setCaCEnabledForImportAll,
    };
  }, [isCaCEnabledForImportAll, setCaCEnabledForImportAll]);

  return <ImportAllCaCContext.Provider value={providerValues}>{children}</ImportAllCaCContext.Provider>;
};
