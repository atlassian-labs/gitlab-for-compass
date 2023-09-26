import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom/extend-expect';

import { AppRouter } from '../../../AppRouter';
import { AppContextProvider } from '../../../context/AppContext';
import { ErrorMessages } from '../../../errorMessages';
import { defaultMocks, mockInvoke, mockGetContext } from '../../../helpers/mockHelpers';
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
  const { findByPlaceholderText, findByText } = render(
    <AppContextProvider>
      <AppRouter />
    </AppContextProvider>,
  );

  await act(async () => {
    fireEvent.change(await findByPlaceholderText('Enter your GitLab URL'), {
      target: { value: 'https://gitlab.toto.io' },
    });
  });
  await act(async () => {
    fireEvent.change(await findByPlaceholderText('Enter your group access token'), { target: { value: 'koko' } });
  });
  await act(async () => {
    fireEvent.change(await findByPlaceholderText('Enter your group token name'), { target: { value: 'momo' } });
  });
  await act(async () => {
    fireEvent.click(await findByText('Connect group'));
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
