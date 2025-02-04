import { getCallBridge as realGetCallBridge } from '@forge/bridge/out/bridge';
import { act, render, waitFor } from '@testing-library/react';
import { ConfirmationScreen } from '../ConfirmationScreen';
import { componentTypesResultMock, teamsResult, projectImportSelectionMock } from '../__mocks__/mocks';
import { useAppContext } from '../../../../hooks/useAppContext';

const mockedBridge = jest.fn();
jest.mock('@forge/bridge/out/bridge', () => ({
  getCallBridge: jest.fn(),
}));
const getCallBridge: jest.Mock = realGetCallBridge as jest.Mock;

jest.mock('../../../../hooks/useAppContext', () => ({
  useAppContext: jest.fn(),
}));

const MOCK_APP_ID = 'app-id';

const expectToSendAnalyticsEvent = (
  expectedAnalyticEvent: string,
  attributes?: { [key: string]: boolean | string },
) => {
  expect(mockedBridge).toHaveBeenCalledWith('fireForgeAnalytic', {
    forgeAppId: MOCK_APP_ID,
    analyticEvent: expectedAnalyticEvent,
    attributes,
  });
};

describe('ConfirmationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCallBridge.mockReturnValue(mockedBridge);
    (useAppContext as jest.Mock).mockReturnValue({
      appId: MOCK_APP_ID,
    });
  });
  it('should render the Start Import button', async () => {
    const { findByTestId } = render(
      <ConfirmationScreen
        syncWithCompassYml={false}
        setSyncWithCompassYml={jest.fn()}
        handleNavigateToScreen={jest.fn()}
        isProjectsImporting={false}
        handleImportProjects={jest.fn()}
        projectsImportingData={null}
        importableComponentTypes={componentTypesResultMock}
        teamsResult={teamsResult}
        selectProjectTeam={jest.fn()}
        projectsReadyToImport={projectImportSelectionMock}
        onChangeComponentType={jest.fn()}
        isOnboardingFlow={true}
      />,
    );

    const startImportButton = await findByTestId('start-import-button');
    expect(startImportButton).toBeDefined();
  });

  it('should fire analytic with CaC as false and start import when button is clicked', async () => {
    const mockHandleImportProjects = jest.fn();

    const { findByTestId } = render(
      <ConfirmationScreen
        syncWithCompassYml={false}
        setSyncWithCompassYml={jest.fn()}
        handleNavigateToScreen={jest.fn()}
        isProjectsImporting={false}
        handleImportProjects={mockHandleImportProjects}
        projectsImportingData={null}
        importableComponentTypes={componentTypesResultMock}
        teamsResult={teamsResult}
        selectProjectTeam={jest.fn()}
        projectsReadyToImport={projectImportSelectionMock}
        onChangeComponentType={jest.fn()}
        isOnboardingFlow={true}
      />,
    );

    const startImportButton = await findByTestId('start-import-button');
    act(() => {
      startImportButton.click();
    });

    expect(mockedBridge).toHaveBeenCalledTimes(1);
    expectToSendAnalyticsEvent('startImportButton clicked', { isCaCEnabled: false });
    await waitFor(() => expect(mockHandleImportProjects).toHaveBeenCalledTimes(1));
  });

  it('should fire analytic with CaC as true and start import when button is clicked', async () => {
    const mockHandleImportProjects = jest.fn();

    const { findByTestId } = render(
      <ConfirmationScreen
        syncWithCompassYml={true}
        setSyncWithCompassYml={jest.fn()}
        handleNavigateToScreen={jest.fn()}
        isProjectsImporting={false}
        handleImportProjects={mockHandleImportProjects}
        projectsImportingData={null}
        importableComponentTypes={componentTypesResultMock}
        teamsResult={teamsResult}
        selectProjectTeam={jest.fn()}
        projectsReadyToImport={projectImportSelectionMock}
        onChangeComponentType={jest.fn()}
        isOnboardingFlow={true}
      />,
    );

    const startImportButton = await findByTestId('start-import-button');
    act(() => {
      startImportButton.click();
    });

    expect(mockedBridge).toHaveBeenCalledTimes(1);
    expectToSendAnalyticsEvent('startImportButton clicked', { isCaCEnabled: true });
    await waitFor(() => expect(mockHandleImportProjects).toHaveBeenCalledTimes(1));
  });
});
