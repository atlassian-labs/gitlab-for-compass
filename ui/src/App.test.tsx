import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { view } from '@forge/bridge';
import { App } from './App';
import { ROTATE_WEB_TRIGGER_MODAL } from './constants';

// Place this at the very top of your test file!
jest.mock('@forge/bridge', () => ({
  view: {
    theme: { enable: jest.fn() },
    getContext: jest.fn(),
  },
}));

jest.mock('./context/AppContext', () => ({
  AppContextProvider: ({ children }: any) => <div data-testid='app-context'>{children}</div>,
}));
jest.mock('./context/ComponentTypesContext', () => ({
  ComponentTypesContextProvider: ({ children }: any) => <div data-testid='component-types-context'>{children}</div>,
}));
jest.mock('./context/ImportContext', () => ({
  ImportContextProvider: ({ children }: any) => <div data-testid='import-context'>{children}</div>,
}));
jest.mock('./context/ImportAllCaCContext', () => ({
  ImportAllCaCProvider: ({ children }: any) => <div data-testid='import-all-cac'>{children}</div>,
}));
jest.mock('./AppRouter', () => ({
  AppRouter: () => <div data-testid='app-router' />,
}));
jest.mock('./components/RotateWebtriggerModal', () => ({
  RotateWebtriggerModal: ({ groupName }: any) => <div data-testid='rotate-modal'>{groupName}</div>,
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (view.theme.enable as jest.Mock).mockResolvedValue(undefined);
    (view.getContext as jest.Mock).mockResolvedValue({ extension: {} });
  });

  it('calls view.theme.enable and view.getContext on mount', async () => {
    render(<App />);
    await waitFor(() => {
      expect(view.theme.enable).toHaveBeenCalled();
      expect(view.getContext).toHaveBeenCalled();
    });
  });

  it('renders the normal app flow with all providers and AppRouter', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('app-router')).toBeDefined());

    expect(screen.getByTestId('app-context')).toBeDefined();
    expect(screen.getByTestId('component-types-context')).toBeDefined();
    expect(screen.getByTestId('import-context')).toBeDefined();
    expect(screen.getByTestId('import-all-cac')).toBeDefined();
  });

  it('renders RotateWebtriggerModal if extensionContext.renderComponent is ROTATE_WEB_TRIGGER_MODAL', async () => {
    (view.getContext as jest.Mock).mockResolvedValue({
      extension: {
        renderComponent: ROTATE_WEB_TRIGGER_MODAL,
        groupName: 'TestGroup',
      },
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('rotate-modal')).toBeInTheDocument());
    expect(screen.getByTestId('rotate-modal')).toHaveTextContent('TestGroup');
    expect(screen.queryByTestId('app-router')).not.toBeInTheDocument();
  });
});
