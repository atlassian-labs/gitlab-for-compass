import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom/extend-expect';

import { getCallBridge as realGetCallBridge } from '@forge/bridge/out/bridge';
import { AppRouter } from '../../../AppRouter';
import { AppContextProvider } from '../../../context/AppContext';
import { ErrorMessages } from '../../../errorMessages';
import { defaultMocks, mockInvoke, mockGetContext, gitlabFFDisabledMocks } from '../../../helpers/mockHelpers';
import { AuthErrorTypes } from '../../../resolverTypes';
import { webhookSetupInProgressMocks } from '../../../context/__mocks__/mocks';
import * as onboardingFlowContextHelper from '../../onboarding-flow-context-helper';

jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
  view: {
    getContext: jest.fn(),
  },
}));

jest.mock('escape-string-regexp', () => ({
  escapeStringRegexp: jest.fn(),
}));

const mockedBridge = jest.fn();
jest.mock('@forge/bridge/out/bridge', () => ({
  getCallBridge: jest.fn(),
}));
const getCallBridge: jest.Mock = realGetCallBridge as jest.Mock;
const MOCK_APP_ID = 'app-id';

const setup = async () => {
  const { findByTestId } = render(
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
    fireEvent.click(await findByTestId('connect-group-button'));
  });
};

const expectToSendAnalyticsEvent = (expectedAnalyticEvent: string) => {
  expect(mockedBridge).toHaveBeenCalledWith('fireForgeAnalytic', {
    forgeAppId: MOCK_APP_ID,
    analyticEvent: expectedAnalyticEvent,
  });
};

describe('Auth flow in onboarding flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCallBridge.mockReturnValue(mockedBridge);
  });

  it('renders cancel button, fires analytic, and calls checkOnboardingRedirection with SKIP', async () => {
    mockGetContext('admin-page-ui', 'onboardingFlow');
    mockInvoke({
      ...defaultMocks,
    });
    const isRenderingInOnboardingFlowMock = jest
      .spyOn(onboardingFlowContextHelper, 'isRenderingInOnboardingFlow')
      .mockResolvedValue(true);
    const checkOnboardingRedirectionMock = jest.spyOn(onboardingFlowContextHelper, 'checkOnboardingRedirection');

    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const cancelButton = await findByTestId('gitlab-cancel-auth-button');
    expect(cancelButton).toBeDefined();
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expectToSendAnalyticsEvent('cancelConnectionButton clicked');
    expect(checkOnboardingRedirectionMock).toHaveBeenCalledWith('SKIP');

    isRenderingInOnboardingFlowMock.mockRestore();
    checkOnboardingRedirectionMock.mockRestore();
  });

  it('should call checkOnboardingRedirection with CONFIUGRATION_ERROR if authentication fails', async () => {
    mockGetContext('admin-page-ui', 'onboardingFlow');
    mockInvoke({
      ...defaultMocks,
      'groups/connect': {
        success: false,
        errors: [{ message: 'Error', errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
      },
    });
    const isRenderingInOnboardingFlowMock = jest
      .spyOn(onboardingFlowContextHelper, 'isRenderingInOnboardingFlow')
      .mockResolvedValue(true);
    const checkOnboardingRedirectionMock = jest.spyOn(onboardingFlowContextHelper, 'checkOnboardingRedirection');

    await setup();

    expect(checkOnboardingRedirectionMock).toHaveBeenCalledWith('CONFIGURATION_ERROR');
    isRenderingInOnboardingFlowMock.mockRestore();
    checkOnboardingRedirectionMock.mockRestore();
  });
});

describe('Auth flow validation', () => {
  it('renders error in the case when group token invalid', async () => {
    mockGetContext('admin-page-ui');
    mockInvoke({
      ...defaultMocks,
      'groups/connect': {
        success: false,
        errors: [{ message: 'Error', errorType: AuthErrorTypes.INVALID_GROUP_TOKEN }],
      },
    });

    await setup();

    expect(screen.getByTestId('incorrect-token-message')).toHaveTextContent(
      ErrorMessages[AuthErrorTypes.INVALID_GROUP_TOKEN].description.join(''),
    );
  });

  it('renders error in the case when group token name invalid', async () => {
    mockGetContext('admin-page-ui');
    mockInvoke({
      ...defaultMocks,
      'groups/connect': {
        success: false,
        errors: [{ message: 'Error', errorType: AuthErrorTypes.INVALID_GROUP_TOKEN_NAME }],
      },
    });

    await setup();

    expect(screen.getByTestId('incorrect-token-name-message')).toHaveTextContent(
      ErrorMessages[AuthErrorTypes.INVALID_GROUP_TOKEN_NAME].description,
    );
  });

  it('renders error in the case when group token scopes invalid', async () => {
    mockGetContext('admin-page-ui');
    mockInvoke({
      ...defaultMocks,
      'groups/connect': {
        success: false,
        errors: [{ message: 'Error', errorType: AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES }],
      },
    });

    await setup();

    expect(screen.getByTestId('incorrect-token-scopes-message')).toHaveTextContent(
      ErrorMessages[AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES].description.join(''),
    );
  });

  it('renders error in the case when unexpected error', async () => {
    mockGetContext('admin-page-ui');
    mockInvoke({
      ...defaultMocks,
      'groups/connect': { success: false, errors: [{ message: 'Error', errorType: AuthErrorTypes.UNEXPECTED_ERROR }] },
    });

    await setup();

    expect(screen.getByTestId('unexpected-message')).toHaveTextContent(
      ErrorMessages[AuthErrorTypes.UNEXPECTED_ERROR].description,
    );
  });
});

describe('Auth page role selection', () => {
  beforeEach(() => {
    mockGetContext('admin-page-ui');
    mockInvoke(defaultMocks);
  });

  it('renders role selection radio group with default owner selected', async () => {
    const { findByRole, queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const ownerRadio = await findByRole('radio', { name: 'Owner' });
    const maintainerRadio = await findByRole('radio', { name: 'Maintainer' });

    expect(ownerRadio).toBeChecked();
    expect(maintainerRadio).not.toBeChecked();

    expect(queryByTestId('group-name')).not.toBeInTheDocument();
  });

  it('shows group name input when maintainer role is selected', async () => {
    const { findByRole, queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const maintainerRadio = await findByRole('radio', { name: 'Maintainer' });

    await act(async () => {
      fireEvent.click(maintainerRadio);
    });

    expect(queryByTestId('group-name')).toBeInTheDocument();
  });

  describe('Gitlab Maintainer Token FF disabled', () => {
    beforeEach(() => {
      mockGetContext('admin-page-ui');
      mockInvoke(gitlabFFDisabledMocks);
    });

    it('does not render maintainer role selection radio group', async () => {
      const { queryByRole } = render(
        <AppContextProvider>
          <AppRouter />
        </AppContextProvider>,
      );

      await waitFor(() => {
        const maintainerRadio = queryByRole('radio', { name: 'Maintainer' });
        expect(maintainerRadio).not.toBeInTheDocument();
      });
    });
  });
});

describe('Webhook setup page', () => {
  beforeEach(() => {
    mockInvoke(defaultMocks);
    mockGetContext('admin-page-ui');
  });

  it('renders webhook setup page with input fields', async () => {
    mockInvoke(webhookSetupInProgressMocks);
    mockGetContext('admin-page-ui');

    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );
    expect(await findByTestId('webhooks-setup-message')).toBeInTheDocument();
    expect(await findByTestId('webhook-id')).toBeInTheDocument();
    expect(await findByTestId('webhook-secret-token')).toBeInTheDocument();

    expect(await findByTestId('cancel-webhook-button')).toBeEnabled();
    expect(await findByTestId('connect-webhook-button')).toBeDisabled();
  });

  it('enables connect button when webhook inputs are filled', async () => {
    mockInvoke(webhookSetupInProgressMocks);
    mockGetContext('admin-page-ui');

    const { findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    await act(async () => {
      fireEvent.change(await screen.findByTestId('webhook-id'), { target: { value: 'webhook-id' } });
    });

    await act(async () => {
      fireEvent.change(await screen.findByTestId('webhook-secret-token'), {
        target: { value: 'webhook-secret token' },
      });
    });

    expect(await findByTestId('connect-webhook-button')).toBeEnabled();
  });
});
