import { createContext, FunctionComponent, ReactNode, useEffect, useState } from 'react';

import Spinner from '@atlaskit/spinner';

import { view } from '@forge/bridge';
import { CenterWrapper } from '../components/styles';
import { AuthErrorTypes, ErrorTypes, FeaturesList, GitlabAPIGroup } from '../resolverTypes';
import { ApplicationState } from '../routes';
import { getForgeAppId, listConnectedGroups } from '../services/invokes';
import { DefaultErrorState } from '../components/DefaultErrorState';
import { useFeatures } from '../hooks/useFeatures';

type AppContextProviderProps = {
  children: ReactNode;
};

export type AppContextProps = {
  initialRoute?: ApplicationState;
  getGroups: () => Promise<GitlabAPIGroup[] | undefined>;
  clearGroup: (groupId: number) => void;
  features: FeaturesList;
  moduleKey: string;
  appId: string;
};

export const AppContext = createContext({} as AppContextProps);

export const AppContextProvider: FunctionComponent<AppContextProviderProps> = ({ children }) => {
  const [isGroupsLoading, setGroupsLoading] = useState<boolean>(false);
  const [isAppIdLoading, setAppIdLoading] = useState<boolean>(false);
  const [groups, setGroups] = useState<GitlabAPIGroup[]>();
  const [errorType, setErrorType] = useState<ErrorTypes>();
  const [initialRoute, setInitialRoute] = useState<ApplicationState>();
  const [features, isFeaturesLoading, featuresErrorType] = useFeatures();
  const [moduleKey, setModuleKey] = useState('');
  const [appId, setAppId] = useState('');

  useEffect(() => {
    async function getContext() {
      const context = (await view.getContext()) as any;
      setModuleKey(context.moduleKey);
    }

    getContext();

    setGroupsLoading(true);
    setAppIdLoading(true);

    getForgeAppId()
      .then(({ data, success, errors }) => {
        setAppIdLoading(false);

        if (success && data) {
          setAppId(data);
        }

        if (errors && errors.length > 0) {
          setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
        }
      })
      .catch(() => {
        setAppIdLoading(false);
        setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
      });

    listConnectedGroups()
      .then(({ data, success, errors }) => {
        setGroupsLoading(false);

        if (success && data && data.length > 0) {
          setGroups(data);
          setInitialRoute(ApplicationState.CONNECTED);
          return;
        }

        if (errors && errors.length > 0) {
          setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
        }

        setInitialRoute(ApplicationState.AUTH);
      })
      .catch(() => {
        setGroupsLoading(false);
        setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
      });
  }, []);

  const getGroups = async (): Promise<GitlabAPIGroup[] | undefined> => {
    if (groups && groups?.length > 0) {
      return groups;
    }

    try {
      const { data, success, errors } = await listConnectedGroups();

      if (success && data && data.length > 0) {
        setGroups(data);

        return data;
      }

      if (errors && errors.length > 0) {
        setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
      }
    } catch {
      setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
    }

    return undefined;
  };

  const clearGroup = (groupId: number): void => {
    setGroups((prevGroups) => prevGroups?.filter((group) => group.id !== groupId));
  };

  if (errorType || featuresErrorType) {
    return <DefaultErrorState errorType={errorType || featuresErrorType} />;
  }

  if (isGroupsLoading || isFeaturesLoading || isAppIdLoading) {
    return (
      <CenterWrapper>
        <Spinner size='large' />
      </CenterWrapper>
    );
  }

  return (
    <AppContext.Provider value={{ initialRoute, getGroups, clearGroup, features, moduleKey, appId }}>
      {children}
    </AppContext.Provider>
  );
};
