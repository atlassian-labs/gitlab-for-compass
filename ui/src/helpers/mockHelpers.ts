import { invoke as realInvoke, view } from '@forge/bridge';

export const invoke: jest.Mock = realInvoke as jest.Mock;
const getContext: jest.Mock = view.getContext as jest.Mock;

export const defaultMocks: {
  [key: string]: unknown;
} = {
  groups: {
    success: true,
    data: [],
  },
  features: {
    success: true,
    data: {},
  },
  appId: {
    success: true,
    data: 'app-id',
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
    };
  });
};
