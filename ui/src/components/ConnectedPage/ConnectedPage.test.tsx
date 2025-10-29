import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConnectedPage } from './index';
import { useAppContext } from '../../hooks/useAppContext';
import { useImportContext } from '../../hooks/useImportContext';
import { isRenderingInOnboardingFlow } from '../onboarding-flow-context-helper';

jest.mock('../../hooks/useAppContext');
jest.mock('../../hooks/useImportContext');
jest.mock('../../services/invokes');
jest.mock('../onboarding-flow-context-helper');
jest.mock('@forge/bridge', () => ({
  Modal: jest.fn().mockImplementation(() => ({ open: jest.fn() })),
}));
jest.mock('@forge/bridge/out/flag/flag', () => ({
  showFlag: jest.fn(),
}));
jest.mock('@forge/bridge/out/bridge', () => ({
  getCallBridge: jest.fn(() => jest.fn()),
}));
jest.mock('./ConnectInfoPanel', () => ({
  ConnectInfoPanel: () => <div data-testid='connect-info-panel' />,
}));
jest.mock('./ImportControls', () => ({
  ImportControls: () => <div data-testid='import-controls' />,
}));
jest.mock('../ImportResult', () => ({
  ImportResult: () => <div data-testid='import-result' />,
}));
jest.mock('../IncomingWebhookSectionMessage', () => ({
  IncomingWebhookSectionMessage: () => <div data-testid='incoming-webhook-section-message' />,
}));
jest.mock('../DefaultErrorState', () => ({
  DefaultErrorState: ({ errorType }: any) => <div data-testid='default-error-state'>{errorType}</div>,
}));
jest.mock('./RotateGroupAccessToken', () => ({
  RotateGroupAccessToken: () => <div data-testid='rotate-group-access-token' />,
}));
jest.mock('../styles', () => ({
  CenterWrapper: ({ children }: any) => <div data-testid='center-wrapper'>{children}</div>,
}));
jest.mock('@atlaskit/spinner', () => ({
  __esModule: true,
  default: () => <div data-testid='spinner' />,
}));
jest.mock('@atlaskit/section-message', () => ({
  __esModule: true,
  default: ({ children, appearance, testId }: any) => (
    <div data-testid={testId} data-appearance={appearance}>
      {children}
    </div>
  ),
}));

const mockGroup = { id: 1, name: 'Test Group' };

function setupAppContext(overrides = {}) {
  (useAppContext as jest.Mock).mockReturnValue({
    features: { isGitlabMaintainerTokenEnabled: false, isResyncConfigAsCodeEnabled: false },
    getConnectedInfo: jest.fn().mockResolvedValue([mockGroup]),
    clearGroup: jest.fn(),
    appId: 'app-id',
    isOwnerRole: true,
    webhookStatus: undefined,
    numOfTokenExpirationDays: undefined,
    ...overrides,
  });
}

function setupImportContext(overrides = {}) {
  (useImportContext as jest.Mock).mockReturnValue({
    isImportInProgress: false,
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (isRenderingInOnboardingFlow as jest.Mock).mockResolvedValue(false);
  setupAppContext();
  setupImportContext();
});

describe('ConnectedPage', () => {
  it('renders loading spinner when groups are not loaded', async () => {
    setupAppContext({
      getConnectedInfo: jest.fn().mockResolvedValue([]),
    });
    render(
      <MemoryRouter>
        <ConnectedPage />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('spinner')).toBeDefined();
  });

  it('renders main connected page with all sections', async () => {
    render(
      <MemoryRouter>
        <ConnectedPage />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('gitlab-connected-page')).toBeDefined();
    expect(screen.getByText('Connected group')).toBeDefined();
    expect(screen.getByTestId('connect-info-panel')).toBeDefined();
    expect(screen.getByTestId('import-controls')).toBeDefined();
    expect(screen.getByTestId('rotate-group-access-token')).toBeDefined();
    expect(screen.getByTestId('import-result')).toBeDefined();
  });

  it('shows token expiration warning for <=30 and >10 days', async () => {
    setupAppContext({ numOfTokenExpirationDays: 20 });
    render(
      <MemoryRouter>
        <ConnectedPage />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('token-expires-within-30-days-message')).toBeDefined();
  });

  it('shows token expiration warning for <=10 and >0 days', async () => {
    setupAppContext({ numOfTokenExpirationDays: 5 });
    render(
      <MemoryRouter>
        <ConnectedPage />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('token-expires-within-10-days-message')).toBeDefined();
  });

  it('shows IncomingWebhookSectionMessage if not onboarding', async () => {
    render(
      <MemoryRouter>
        <ConnectedPage />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('incoming-webhook-section-message')).toBeDefined();
  });

  it('does not show ImportResult if import is in progress', async () => {
    setupImportContext({ isImportInProgress: true });
    render(
      <MemoryRouter>
        <ConnectedPage />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('import-result')).toBeNull();
  });
});
