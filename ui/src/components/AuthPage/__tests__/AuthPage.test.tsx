import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom/extend-expect';

import { AppRouter } from '../../../AppRouter';
import { AppContextProvider } from '../../../context/AppContext';
import { ErrorMessages } from '../../../errorMessages';
import { defaultMocks, mockInvoke, mockGetContext, gitlabFFDisabledMocks } from '../../../helpers/mockHelpers';
import { AuthErrorTypes } from '../../../resolverTypes';

jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
  view: {
    getContext: jest.fn(),
  },
}));

jest.mock('escape-string-regexp', () => ({
  escapeStringRegexp: jest.fn(),
}));

const setup = async () => {
  const { findByText, findByTestId } = render(
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
    fireEvent.click(await findByText('Connect'));
  });
};

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
    const { findByRole } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const ownerRadio = await findByRole('radio', { name: 'Owner' });
    const maintainerRadio = await findByRole('radio', { name: 'Maintainer' });

    expect(ownerRadio).toBeChecked();
    expect(maintainerRadio).not.toBeChecked();
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
    expect(queryByTestId('webhook-secret-token')).toBeInTheDocument();
  });

  it('hides group name input when owner role is selected', async () => {
    const { findByRole, queryByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    const maintainerRadio = await findByRole('radio', { name: 'Maintainer' });
    const ownerRadio = await findByRole('radio', { name: 'Owner' });

    await act(async () => {
      fireEvent.click(maintainerRadio);
    });
    await act(async () => {
      fireEvent.click(ownerRadio);
    });

    expect(queryByTestId('group-name')).not.toBeInTheDocument();
  });

  it('disables connect button when maintainer selected with missing required fields', async () => {
    const { findByRole, findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    // Wait for the auth page to load
    await findByTestId('gitlab-auth-page');

    // Fill in basic required fields
    await act(async () => {
      fireEvent.change(await findByTestId('group-access-token'), {
        target: { value: 'test-token' },
      });
    });
    await act(async () => {
      fireEvent.change(await findByTestId('access-token-name'), {
        target: { value: 'test-name' },
      });
    });

    const maintainerRadio = await findByRole('radio', { name: 'Maintainer' });
    await act(async () => {
      fireEvent.click(maintainerRadio);
    });

    // Test Case 1: Only group name filled
    await act(async () => {
      fireEvent.change(await findByTestId('group-name'), {
        target: { value: 'test-group' },
      });
    });

    let connectButton = await findByRole('button', { name: 'Connect' });
    expect(connectButton).toHaveAttribute('disabled');

    // Test Case 2: Only webhook token filled
    await act(async () => {
      fireEvent.change(await findByTestId('group-name'), {
        target: { value: '' },
      });
    });
    await act(async () => {
      fireEvent.change(await findByTestId('webhook-secret-token'), {
        target: { value: 'webhook-token' },
      });
    });

    connectButton = await findByRole('button', { name: 'Connect' });
    expect(connectButton).toHaveAttribute('disabled');

    // Test Case 3: Only webhook id filled
    await act(async () => {
      fireEvent.change(await findByTestId('webhook-secret-token'), {
        target: { value: '' },
      });
    });
    await act(async () => {
      fireEvent.change(await findByTestId('webhook-id'), {
        target: { value: '12343' },
      });
    });

    connectButton = await findByRole('button', { name: 'Connect' });
    expect(connectButton).toHaveAttribute('disabled');
  });

  it('enables connect button when maintainer selected with all required fields', async () => {
    const { findByRole, findByTestId } = render(
      <AppContextProvider>
        <AppRouter />
      </AppContextProvider>,
    );

    // Wait for the auth page to load
    await findByTestId('gitlab-auth-page');

    // Fill in all required fields
    await act(async () => {
      fireEvent.change(await findByTestId('group-access-token'), {
        target: { value: 'test-token' },
      });
    });
    await act(async () => {
      fireEvent.change(await findByTestId('access-token-name'), {
        target: { value: 'test-name' },
      });
    });

    const maintainerRadio = await findByRole('radio', { name: 'Maintainer' });
    await act(async () => {
      fireEvent.click(maintainerRadio);
    });

    await act(async () => {
      fireEvent.change(await findByTestId('group-name'), {
        target: { value: 'test-group' },
      });
    });

    await act(async () => {
      fireEvent.change(await findByTestId('webhook-secret-token'), {
        target: { value: 'webhook-token' },
      });
    });

    await act(async () => {
      fireEvent.change(await findByTestId('webhook-id'), {
        target: { value: '12343' },
      });
    });

    const connectButton = await findByRole('button', { name: 'Connect' });
    expect(connectButton).not.toHaveAttribute('disabled');
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
