import { createContext, FunctionComponent, ReactNode, useState } from 'react';

type ImportProviderProps = {
  children: ReactNode;
};

export type ImportContextType = {
  isImportInProgress: boolean;
  setIsImportInProgress: (value: boolean) => void;
  importedRepositories: number;
  setImportedRepositories: (importedRepositories: number) => void;
  totalSelectedRepos: number;
  setTotalSelectedRepos: (totalSelectedRepositories: number) => void;
};

export const ImportContext = createContext({} as ImportContextType);

export const ImportContextProvider: FunctionComponent<ImportProviderProps> = ({ children }) => {
  const [isImportInProgress, setIsImportInProgress] = useState<boolean>(false);
  const [importedRepositories, setImportedRepositories] = useState<number>(0);
  const [totalSelectedRepos, setTotalSelectedRepos] = useState<number>(0);

  return (
    <ImportContext.Provider
      value={{
        isImportInProgress,
        setIsImportInProgress,
        importedRepositories,
        setImportedRepositories,
        totalSelectedRepos,
        setTotalSelectedRepos,
      }}
    >
      {children}
    </ImportContext.Provider>
  );
};
