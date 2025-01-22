import { invoke as realInvoke, view } from '@forge/bridge';
import { GitlabFeaturesEnum } from '../features';

export const invoke: jest.Mock = realInvoke as jest.Mock;
const getContext: jest.Mock = view.getContext as jest.Mock;

export const defaultMocks: {
  [key: string]: unknown;
} = {
  'groups/connectedInfo': {
    success: true,
    data: [],
  },
  features: {
    success: true,
    data: {
      [GitlabFeaturesEnum.ENABLE_GITLAB_MAINTAINER_TOKEN]: true,
    },
  },
  appId: {
    success: true,
    data: 'app-id',
  },
  'webhooks/setupConfig': {
    success: true,
    data: {
      webhookSetupInProgress: false,
      triggerUrl: '',
    },
  },
};

export const gitlabFFDisabledMocks: {
  [key: string]: unknown;
} = {
  ...defaultMocks,
  features: {
    success: true,
    data: {
      [GitlabFeaturesEnum.ENABLE_GITLAB_MAINTAINER_TOKEN]: false,
    },
  },
};

export const mockInvoke = (mocks = defaultMocks) => {
  invoke.mockImplementation(async (key) => {
    if (mocks[key] instanceof Error) {
      throw mocks[key];
    }

    return mocks[key];
  });
};

export const mockGetContext = (moduleKey: string) => {
  getContext.mockImplementation(async () => {
    return {
      moduleKey,
      extension: {},
    };
  });
};
