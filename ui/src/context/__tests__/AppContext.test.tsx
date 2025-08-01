import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { getCallBridge as realGetCallBridge } from '@forge/bridge/out/bridge';
import { showFlag as realShowFlag } from '@forge/bridge';
import { AppContextProvider } from '../AppContext';
import { AppRouter } from '../../AppRouter';
import {
  filledMocks,
  mocksWithError,
  mockWithEnablindImportAllFF,
  webhookSetupInProgressMocks,
} from '../__mocks__/mocks';
import { defaultMocks, mockInvoke, mockGetContext } from '../../helpers/mockHelpers';
import { ImportAllCaCProvider } from '../ImportAllCaCContext';
import { GitLabRoles, WebhookAlertStatus } from '../../types';
import { AuthErrorTypes, DefaultErrorTypes, StoreTokenErrorTypes } from '../../resolverTypes';

const MOCK_APP_ID = 'app-id';

jest.mock('@forge/bridge', () => ({
  view: {
    getContext: jest.fn(),
  },
  invoke: jest.fn(),
  showFlag: jest.fn(),
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
const showFlag: jest.Mock = realShowFlag as jest.Mock;

const expectToShowSuccessTokenRotationFlag = () => {
  expect(showFlag).toHaveBeenCalledWith({
    id: 'success-token-rotation-flag',
    title: 'Token successfully rotated',
    type: 'success',
    description: `Your GitLab group token was successfully rotated`,
    actions: [],
    isAutoDismiss: false,
  });
};

const setupRotationForm = async () => {
  const { findByTestId, getByTestId, queryByTestId } = render(
    <AppContextProvider>
      <AppRouter />
    </AppContextProvider>,
  );

  await act(async () => {
    fireEvent.change(await findByTestId('group-access-token'), { target: { value: 'koko' } });
  });
  await act(async () => {
    fireEvent.change(await findByTestId('access-token-name'), { target: { value: 'momo' } });
  });
  await act(async () => {
    fireEvent.click(await findByTestId('rotate-token-button'));
  });

  return { getByTestId, queryByTestId };
};

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
    expect(await findByTestId('incoming-webhook-information')).toBeDefined();
  });

  it('renders initial auth screen in onboarding without incoming webhook message', async () => {
    mockInvoke(defaultMocks);
    mockGetContext('admin-page-ui', 'onboardingFlow');

    const { findByTestId, queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    expect(await findByTestId('gitlab-auth-page')).toBeDefined();
    expect(await findByTestId('token-setup-message')).toBeDefined();

    expect(queryByTestId('incoming-webhook-information')).toBeNull();
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
    expect(await findByTestId('incoming-webhook-information')).toBeDefined();
  });

  it('renders connect screen in the onboarding without incoming webhook message', async () => {
    mockInvoke(filledMocks);
    mockGetContext('admin-page-ui', 'onboardingFlow');

    const { findByTestId, queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    expect(await findByTestId('gitlab-connected-page')).toBeDefined();

    expect(queryByTestId('incoming-webhook-information')).toBeNull();
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

  it('should render Rotate webhook button if token role is Owner', async () => {
    mockInvoke(filledMocks);
    mockGetContext('admin-page-ui');

    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const rotateWebhookButton = await findByTestId('rotate-web-trigger-1');

    expect(rotateWebhookButton).toBeDefined();
  });

  it('should not render Rotate webhook button if token role is Maintainer', async () => {
    mockInvoke({
      ...filledMocks,
      'group/getRole': {
        success: true,
        data: GitLabRoles.MAINTAINER,
      },
    });
    mockGetContext('admin-page-ui');

    const { queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const rotateWebhookButton = queryByTestId('rotate-web-trigger-1');

    expect(rotateWebhookButton).toBeNull();
  });

  it('should render a warning message about the disabled webhook status', () => {
    mockInvoke({
      ...filledMocks,
      'webhooks/getWebhookStatus': {
        success: true,
        data: WebhookAlertStatus.DISABLED,
      },
    });
    mockGetContext('admin-page-ui');

    const { queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const webhookDisabledStatusMessage = queryByTestId('disabled-webhook-warning-message');

    expect(webhookDisabledStatusMessage).toBeDefined();
  });

  it('should not render a warning message about the disabled webhook status if request is failed', () => {
    mockInvoke({
      ...filledMocks,
      'webhooks/getWebhookStatus': {
        success: false,
        errors: [{ message: 'Error', errorType: DefaultErrorTypes.UNEXPECTED_ERROR }],
      },
    });
    mockGetContext('admin-page-ui');

    const { queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const webhookDisabledStatusMessage = queryByTestId('disabled-webhook-warning-message');

    expect(webhookDisabledStatusMessage).toBeNull();
  });

  it('should not render a warning message about the disabled webhook status if status executable', () => {
    mockInvoke({
      filledMocks,
    });
    mockGetContext('admin-page-ui');

    const { queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const webhookDisabledStatusMessage = queryByTestId('disabled-webhook-warning-message');

    expect(webhookDisabledStatusMessage).toBeNull();
  });

  it('should render rotation token form', async () => {
    mockInvoke({
      filledMocks,
    });
    mockGetContext('admin-page-ui');

    const { queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const tokenRotationSection = queryByTestId('rotate-token-section');
    expect(tokenRotationSection).toBeDefined();
  });

  it('should render validation error if rotation token is invalid', async () => {
    mockInvoke({
      ...filledMocks,
      'groups/rotateToken': {
        success: false,
        errors: [{ message: 'Error', errorType: AuthErrorTypes.INVALID_GROUP_TOKEN }],
      },
    });
    mockGetContext('admin-page-ui');

    const { getByTestId } = await setupRotationForm();

    expect(getByTestId('incorrect-token-message')).toBeDefined();
  });

  it('should render validation error if rotation token name is incorrect', async () => {
    mockInvoke({
      ...filledMocks,
      'groups/rotateToken': {
        success: false,
        errors: [{ message: 'Error', errorType: AuthErrorTypes.INVALID_GROUP_TOKEN_NAME }],
      },
    });
    mockGetContext('admin-page-ui');

    const { getByTestId } = await setupRotationForm();

    expect(getByTestId('incorrect-token-name-message')).toBeDefined();
  });

  it('should render validation error if rotation token scopes is incorrect', async () => {
    mockInvoke({
      ...filledMocks,
      'groups/rotateToken': {
        success: false,
        errors: [{ message: 'Error', errorType: AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES }],
      },
    });
    mockGetContext('admin-page-ui');

    const { getByTestId } = await setupRotationForm();

    expect(getByTestId('incorrect-token-scopes-message')).toBeDefined();
  });

  it('should render validation error if rotation token scopes is incorrect', async () => {
    mockInvoke({
      ...filledMocks,
      'groups/rotateToken': {
        success: false,
        errors: [{ message: 'Error', errorType: AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES }],
      },
    });
    mockGetContext('admin-page-ui');

    const { getByTestId } = await setupRotationForm();

    expect(getByTestId('incorrect-token-scopes-message')).toBeDefined();
  });

  it('should render validation error if storing rotation token is failed', async () => {
    mockInvoke({
      ...filledMocks,
      'groups/rotateToken': {
        success: false,
        errors: [{ message: 'Error', errorType: StoreTokenErrorTypes.STORE_ERROR }],
      },
    });
    mockGetContext('admin-page-ui');

    const { getByTestId } = await setupRotationForm();

    expect(getByTestId('store-token-failed-message')).toBeDefined();
  });

  it('should render success flag if token rotation is sucessfull', async () => {
    mockInvoke({
      ...filledMocks,
      'groups/rotateToken': {
        success: true,
      },
    });
    mockGetContext('admin-page-ui');

    await setupRotationForm();

    expectToShowSuccessTokenRotationFlag();
  });

  it('setup config-as-code checkbox sends analytic event', async () => {
    mockInvoke(mockWithEnablindImportAllFF);
    mockGetContext('admin-page-ui');

    const { findByTestId } = render(
      <AppContextProvider>
        <ImportAllCaCProvider>
          <AppRouter />
        </ImportAllCaCProvider>
      </AppContextProvider>,
    );

    const setupCaCWithImportAll = await findByTestId('connected-page.setup-config-file--checkbox-label');

    setupCaCWithImportAll?.click();
    expectToSendAnalyticsEvent('importAllSetupCaC enabled');

    setupCaCWithImportAll?.click();
    expectToSendAnalyticsEvent('importAllSetupCaC disabled');
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
