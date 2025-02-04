import { fireEvent, render } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { getCallBridge as realGetCallBridge } from '@forge/bridge/out/bridge';
import { CompassComponentType, Link } from '@atlassian/forge-graphql';
import { ImportProgressResultPage } from '..';
import * as useImportContextHook from '../../../hooks/useImportContext';
import * as useImportResultHook from '../../../hooks/useImportResult';
import * as useImportProgressHook from '../../../hooks/useImportProgress';
import * as onboardingFlowContextHelper from '../../onboarding-flow-context-helper';
import { useAppContext } from '../../../hooks/useAppContext';
import { ImportErrorTypes } from '../../../resolverTypes';
import { DEFAULT_COMPONENT_TYPE_ID } from '../../../constants';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
  view: {
    getContext: jest.fn(),
  },
}));

jest.mock('../../../hooks/useAppContext', () => ({
  useAppContext: jest.fn(),
}));

const MOCK_APP_ID = 'test-app-id';

const mockedBridge = jest.fn();
jest.mock('@forge/bridge/out/bridge', () => ({
  getCallBridge: jest.fn(),
}));

const expectToSendAnalyticsEvent = (expectedAnalyticEvent: string, attributes?: { [key: string]: number | string }) => {
  expect(mockedBridge).toHaveBeenCalledWith('fireForgeAnalytic', {
    forgeAppId: MOCK_APP_ID,
    analyticEvent: expectedAnalyticEvent,
    attributes,
  });
};

const getCallBridge: jest.Mock = realGetCallBridge as jest.Mock;

const failedProjectMock = [
  {
    isSelected: false,
    typeOption: {
      label: 'label',
      value: DEFAULT_COMPONENT_TYPE_ID,
    },
    id: 2,
    name: 'a',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    typeId: 'APPLICATION',
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'koko',
    groupName: 'koko',
    groupPath: 'koko',
    ownerTeamOption: { value: 'test-team', label: 'test-team', iconUrl: 'https://google.com' },
  },
];
describe('ImportProgressResultPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(jest.fn());
    (useAppContext as jest.Mock).mockReturnValue({
      appId: MOCK_APP_ID,
    });
    getCallBridge.mockReturnValue(mockedBridge);
  });

  it('renders ImportProgressBar when isImportInProgress is true and fires analytic', () => {
    jest.spyOn(useImportContextHook, 'useImportContext').mockReturnValue({
      isImportInProgress: true,
      setIsImportInProgress: jest.fn(),
      importedRepositories: 0,
      setImportedRepositories: jest.fn(),
      totalSelectedRepos: 0,
      setTotalSelectedRepos: jest.fn(),
    });
    render(<ImportProgressResultPage moduleKey='someKey' />);
    expectToSendAnalyticsEvent('importProgress started', { step: 'MANUAL_IMPORT' });
  });

  it('renders ImportProgressBar and handles import error', async () => {
    jest.spyOn(useImportProgressHook, 'useImportProgress').mockReturnValue({
      error: ImportErrorTypes.UNEXPECTED_ERROR,
      importedRepositories: 0,
      totalSelectedRepos: 0,
    });
    jest.spyOn(useImportContextHook, 'useImportContext').mockReturnValue({
      isImportInProgress: true,
      setIsImportInProgress: jest.fn(),
      importedRepositories: 0,
      setImportedRepositories: jest.fn(),
      totalSelectedRepos: 0,
      setTotalSelectedRepos: jest.fn(),
    });

    const isRenderingInOnboardingFlowMock = jest
      .spyOn(onboardingFlowContextHelper, 'isRenderingInOnboardingFlow')
      .mockResolvedValue(true);
    const checkOnboardingRedirectionMock = jest.spyOn(onboardingFlowContextHelper, 'checkOnboardingRedirection');

    render(<ImportProgressResultPage moduleKey='someKey' />);
    expectToSendAnalyticsEvent('importProgress started', { step: 'MANUAL_IMPORT' });

    expect(checkOnboardingRedirectionMock).toHaveBeenCalledWith('IMPORT_ERROR');
    isRenderingInOnboardingFlowMock.mockRestore();
    checkOnboardingRedirectionMock.mockRestore();
  });

  it('renders ImportResult when isImportInProgress is false and handles failed projects', () => {
    jest.spyOn(useImportContextHook, 'useImportContext').mockReturnValue({
      isImportInProgress: false,
      setIsImportInProgress: jest.fn(),
      importedRepositories: 0,
      setImportedRepositories: jest.fn(),
      totalSelectedRepos: 0,
      setTotalSelectedRepos: jest.fn(),
    });
    jest.spyOn(useImportResultHook, 'useImportResult').mockReturnValue({
      totalProjects: 3,
      isLoading: false,
      failedProjects: failedProjectMock,
    });
    const isRenderingInOnboardingFlowMock = jest
      .spyOn(onboardingFlowContextHelper, 'isRenderingInOnboardingFlow')
      .mockResolvedValue(true);
    const checkOnboardingRedirectionMock = jest.spyOn(onboardingFlowContextHelper, 'checkOnboardingRedirection');

    render(<ImportProgressResultPage moduleKey='someKey' />);

    expect(checkOnboardingRedirectionMock).toHaveBeenCalledWith('IMPORT_ERROR');
    isRenderingInOnboardingFlowMock.mockRestore();
    checkOnboardingRedirectionMock.mockRestore();
  });

  it('renders Done button and navigates correctly when Done button is clicked', async () => {
    jest.spyOn(useImportContextHook, 'useImportContext').mockReturnValue({
      isImportInProgress: false,
      setIsImportInProgress: jest.fn(),
      importedRepositories: 0,
      setImportedRepositories: jest.fn(),
      totalSelectedRepos: 0,
      setTotalSelectedRepos: jest.fn(),
    });
    jest.spyOn(useImportResultHook, 'useImportResult').mockReturnValue({
      totalProjects: 5,
      isLoading: false,
      failedProjects: [],
    });

    const isRenderingInOnboardingFlowMock = jest
      .spyOn(onboardingFlowContextHelper, 'isRenderingInOnboardingFlow')
      .mockResolvedValue(true);
    const checkOnboardingRedirectionMock = jest.spyOn(onboardingFlowContextHelper, 'checkOnboardingRedirection');

    const { getByText } = render(<ImportProgressResultPage moduleKey='someKey' />);
    fireEvent.click(getByText('Done'));

    expect(checkOnboardingRedirectionMock).toHaveBeenCalledWith(undefined, 5);
    isRenderingInOnboardingFlowMock.mockRestore();
    checkOnboardingRedirectionMock.mockRestore();
  });
});
