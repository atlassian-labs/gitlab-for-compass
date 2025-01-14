import { render, waitFor } from '@testing-library/react';
import { getCallBridge as realGetCallBridge } from '@forge/bridge/out/bridge';
import { AppContextProvider } from '../AppContext';
import { AppRouter } from '../../AppRouter';
import {
  filledMocks,
  mocksWithError,
  mockWithEnablindImportAllFF,
  webhookSetupInProgressMocks,
} from '../__mocks__/mocks';
import { defaultMocks, mockInvoke, mockGetContext } from '../../helpers/mockHelpers';

const MOCK_APP_ID = 'app-id';

jest.mock('@forge/bridge', () => ({
  view: {
    getContext: jest.fn(),
  },
  invoke: jest.fn(),
}));

jest.mock('escape-string-regexp', () => ({
  escapeStringRegexp: jest.fn(),
}));

const mockedBridge = jest.fn();
jest.mock('@forge/bridge/out/bridge', () => ({
  getCallBridge: jest.fn(),
}));

const expectToSendAnalyticsEvent = (expectedAnalyticEvent: string) => {
  expect(mockedBridge).toHaveBeenCalledWith('fireForgeAnalytic', {
    forgeAppId: MOCK_APP_ID,
    analyticEvent: expectedAnalyticEvent,
  });
};

const getCallBridge: jest.Mock = realGetCallBridge as jest.Mock;

describe('AppContext', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    getCallBridge.mockReturnValue(mockedBridge);
  });

  it('renders application', async () => {
    mockInvoke(defaultMocks);
    mockGetContext('admin-page-ui');

    const { container } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    expect(container.children).toBeDefined();
  });

  it('renders initial auth screen', async () => {
    mockInvoke(defaultMocks);
    mockGetContext('admin-page-ui');

    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    expect(await findByTestId('gitlab-auth-page')).toBeDefined();
    expect(await findByTestId('token-setup-message')).toBeDefined();
  });

  it('renders webhooks setup screen', async () => {
    mockInvoke(webhookSetupInProgressMocks);
    mockGetContext('admin-page-ui');

    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    expect(await findByTestId('gitlab-auth-page')).toBeDefined();
    expect(await findByTestId('webhooks-setup-message')).toBeDefined();
  });

  it('renders connect screen', async () => {
    mockInvoke(filledMocks);
    mockGetContext('admin-page-ui');

    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    expect(await findByTestId('gitlab-connected-page')).toBeDefined();
  });

  it('renders connected page with import all button, if FF_IMPORT_ALL_ENABLED ff is enabled', async () => {
    mockInvoke(mockWithEnablindImportAllFF);
    mockGetContext('admin-page-ui');

    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const importAllButton = await findByTestId('import-all-repositories-btn');

    expect(importAllButton).toBeDefined();

    importAllButton.click();

    await waitFor(() => {
      expectToSendAnalyticsEvent('importAllButton clicked');
    });
  });

  it('renders connected page without import all button, if FF_IMPORT_ALL_ENABLED ff is disabled', () => {
    mockInvoke(filledMocks);
    mockGetContext('admin-page-ui');

    const { queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    expect(queryByTestId('import-all-repositories-btn')).toBeNull();
  });

  it('renders error', async () => {
    mockInvoke(mocksWithError);
    mockGetContext('admin-page-ui');

    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    expect(await findByTestId('error-state')).toBeDefined();
  });

  it('displays import screen when accessed via import extension point', async () => {
    mockInvoke();
    mockGetContext('import-page-ui');
    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );
    expect(await findByTestId('gitlab-select-projects-screen')).toBeDefined();
  });
});
