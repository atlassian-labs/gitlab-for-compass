import { createContext, FunctionComponent, ReactNode, useCallback, useEffect, useState } from 'react';

import Spinner from '@atlaskit/spinner';

import { view } from '@forge/bridge';
import { CenterWrapper } from '../components/styles';
import { AuthErrorTypes, DefaultErrorTypes, ErrorTypes, FeaturesList, GitlabAPIGroup } from '../resolverTypes';
import { ApplicationState } from '../routes';
import { connectedInfo, getForgeAppId, getRole, getWebhookSetupConfig } from '../services/invokes';
import { DefaultErrorState } from '../components/DefaultErrorState';
import { useFeatures } from '../hooks/useFeatures';
import { GitLabRoles, WebhookSetupConfig } from '../types';

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
  webhookSetupConfig: WebhookSetupConfig;
  refreshWebhookConfig: () => Promise<void>;
  isOwnerRole: boolean | undefined;
};

export const AppContext = createContext({} as AppContextProps);

export const AppContextProvider: FunctionComponent<AppContextProviderProps> = ({ children }) => {
  const [isGroupsLoading, setIsGroupsLoading] = useState<boolean>(false);
  const [isAppIdLoading, setIsAppIdLoading] = useState<boolean>(false);
  const [isSetupConfigLoading, setSetupConfigLoading] = useState<boolean>(false);
  const [groups, setGroups] = useState<GitlabAPIGroup[]>();
  const [errorType, setErrorType] = useState<ErrorTypes>();
  const [initialRoute, setInitialRoute] = useState<ApplicationState>();
  const [features, isFeaturesLoading, featuresErrorType] = useFeatures();
  const [moduleKey, setModuleKey] = useState('');
  const [appId, setAppId] = useState('');
  const [webhookSetupConfig, setWebhookSetupConfig] = useState<WebhookSetupConfig>({
    webhookSetupInProgress: false,
    triggerUrl: '',
  });
  const [isOwnerRole, setIsOwnerRole] = useState<boolean>();

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
    setSetupConfigLoading(true);

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

    getWebhookSetupConfig()
      .then(({ data, success, errors }) => {
        setSetupConfigLoading(false);

        if (success && data) {
          if (data.webhookSetupInProgress) {
            setInitialRoute(ApplicationState.AUTH);
            setWebhookSetupConfig(data);
          }
          return;
        }

        if (errors && errors.length > 0) {
          setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
        }

        setInitialRoute(ApplicationState.CONNECTED);
      })
      .catch(() => {
        setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
      });
  }, []);

  const getRoles = async (groupId: number): Promise<GitLabRoles | undefined> => {
    try {
      const { data, success, errors } = await getRole(groupId);

      if (success && data) {
        return data;
      }

      if (errors && errors.length > 0) {
        setErrorType((errors && errors[0].errorType) || DefaultErrorTypes.UNEXPECTED_ERROR);
      }
    } catch {
      setErrorType(DefaultErrorTypes.UNEXPECTED_ERROR);
    }

    return undefined;
  };

  useEffect(() => {
    if (groups?.length) {
      getRoles(groups[0].id)
        .then((role) => {
          if (role) {
            setIsOwnerRole(role === GitLabRoles.OWNER);
          }
        })
        .catch((e) => console.error('Error while getting roles', e));
    }
  }, [groups]);

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

  const refreshWebhookConfig = async () => {
    try {
      const { data, success, errors } = await getWebhookSetupConfig();

      if (success && data) {
        setWebhookSetupConfig(data);
        return;
      }

      if (errors && errors.length > 0) {
        setErrorType((errors && errors[0].errorType) || AuthErrorTypes.UNEXPECTED_ERROR);
      }
    } catch {
      setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
    }
  };

  if (errorType || featuresErrorType) {
    return <DefaultErrorState errorType={errorType || featuresErrorType} />;
  }

  if (isGroupsLoading || isFeaturesLoading || isAppIdLoading || isSetupConfigLoading) {
    return (
      <CenterWrapper>
        <Spinner size='large' />
      </CenterWrapper>
    );
  }

  return (
    <AppContext.Provider
      value={{
        initialRoute,
        getConnectedInfo,
        clearGroup,
        features,
        moduleKey,
        appId,
        webhookSetupConfig,
        refreshWebhookConfig,
        isOwnerRole,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
