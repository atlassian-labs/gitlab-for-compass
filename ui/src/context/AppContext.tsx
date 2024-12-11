import { createContext, FunctionComponent, ReactNode, useEffect, useState } from 'react';

import Spinner from '@atlaskit/spinner';

import { view } from '@forge/bridge';
import { CenterWrapper } from '../components/styles';
import { AuthErrorTypes, ErrorTypes, FeaturesList, GitlabAPIGroup } from '../resolverTypes';
import { ApplicationState } from '../routes';
import { getForgeAppId, connectedInfo } from '../services/invokes';
import { DefaultErrorState } from '../components/DefaultErrorState';
import { useFeatures } from '../hooks/useFeatures';

type AppContextProviderProps = {
  children: ReactNode;
};

export type AppContextProps = {
  initialRoute?: ApplicationState;
  getConnectedInfo: () => Promise<GitlabAPIGroup[] | undefined>;
  clearGroup: (groupId: number) => void;
  features: FeaturesList;
  moduleKey: string;
  appId: string;
};

export const AppContext = createContext({} as AppContextProps);

export const AppContextProvider: FunctionComponent<AppContextProviderProps> = ({ children }) => {
  const [isGroupsLoading, setIsGroupsLoading] = useState<boolean>(false);
  const [isAppIdLoading, setIsAppIdLoading] = useState<boolean>(false);
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

    getContext().catch((e) => {
      console.error('Error while getting context', e);
    });

    setIsGroupsLoading(true);
    setIsAppIdLoading(true);

    getForgeAppId()
      .then(({ data, success, errors }) => {
        setIsAppIdLoading(false);

        if (success && data) {
          setAppId(data);
        }

        if (errors && errors.length > 0) {
          setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
        }
      })
      .catch(() => {
        setIsAppIdLoading(false);
        setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
      });

    connectedInfo()
      .then(({ data, success, errors }) => {
        setIsGroupsLoading(false);

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
        setIsGroupsLoading(false);
        setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
      });
  }, []);

  const getConnectedInfo = async (): Promise<GitlabAPIGroup[] | undefined> => {
    if (groups && groups?.length > 0) {
      return groups;
    }

    try {
      const { data, success, errors } = await connectedInfo();

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
    <AppContext.Provider value={{ initialRoute, getConnectedInfo, clearGroup, features, moduleKey, appId }}>
      {children}
    </AppContext.Provider>
  );
};
