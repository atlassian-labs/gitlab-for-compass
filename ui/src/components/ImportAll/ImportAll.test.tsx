import { render, waitFor } from '@testing-library/react';
import { getCallBridge as realGetCallBridge } from '@forge/bridge/out/bridge';
import { MemoryRouter } from 'react-router-dom';
import * as importAllhook from '../../hooks/useImportAll';
import { ImportAllPage } from '.';
import * as useAppContextHook from '../../hooks/useAppContext';

const mockProject = (
  importState: importAllhook.IMPORT_STATE = importAllhook.IMPORT_STATE.SUCCESS,
  hasComponent = false,
) => ({
  componentId: 'test-component-id',
  componentLinks: [],
  defaultBranch: 'main',
  description: null,
  groupFullPath: 'gitlab-com/partners/alliance/atlassian/shared-projects/compass-electromagnets-testing/test-subgroup',
  groupName: 'test-subgroup',
  groupPath: 'test-subgroup',
  hasComponent,
  id: 38535417,
  isCompassFilePrOpened: false,
  isManaged: false,
  labels: ['language:javascript'],
  name: 'jojo',
  typeId: 'SERVICE',
  url: 'https://gitlab.com/gitlab-com/compass-electromagnets-testing/test-subgroup/jojo',
  state: importState,
});

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

describe('ImportAll page', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    getCallBridge.mockReturnValue(mockedBridge);
  });
  it('renders Info screen', async () => {
    const { queryByTestId } = render(
      <MemoryRouter>
        <ImportAllPage />
      </MemoryRouter>,
    );
    const infoScreenTitle = queryByTestId('info-screen-title');
    const infoScreenInformationMessage = queryByTestId('info-screen-information-message');
    const infoScreenStartButton = queryByTestId('info-screen-start-btn');
    const infoScreenBackButton = queryByTestId('info-screen-back-btn');

    expect(infoScreenTitle).toBeDefined();
    expect(infoScreenInformationMessage).toBeDefined();
    expect(infoScreenStartButton).toBeDefined();
    expect(infoScreenBackButton).toBeDefined();
  });

  it('renders progress screen with successfully imported repo', async () => {
    const project = mockProject();

    jest.spyOn(importAllhook, 'useImportAll').mockImplementation(() => ({
      importedProjects: [project],
      isImporting: false,
      projectsFetchingError: '',
      retryFailedProjects: jest.fn(),
    }));
    jest.spyOn(useAppContextHook, 'useAppContext').mockImplementation(() => ({
      appId: MOCK_APP_ID,
      features: {
        isDataComponentTypesEnabled: true,
        isDocumentComponentLinksDisabled: true,
        isGitlabMaintainerTokenEnabled: true,
        isImportAllEnabled: true,
        isSendStagingEventsEnabled: true,
        isCompassPushEventEnabled: true,
      },
      refreshWebhookConfig: jest.fn(),
      getConnectedInfo: jest.fn(),
      clearGroup: jest.fn(),
      moduleKey: '',
      webhookSetupConfig: {
        triggerUrl: '',
        webhookSetupInProgress: false,
      },
    }));

    const { queryByTestId } = render(
      <MemoryRouter>
        <ImportAllPage />
      </MemoryRouter>,
    );

    const infoScreenStartButton = queryByTestId('info-screen-start-btn');

    infoScreenStartButton?.click();

    const progressScreenTitle = queryByTestId('info-screen-start-btn');
    const progressScreenInfoMessage = queryByTestId('import-all.progress-screen.information');
    const successfullyImportedRepo = queryByTestId('import-all.progress-screen.successfully-imported');
    const importProgressBox = queryByTestId('import-all.progress-screen.import-progress');

    const importedRepoName = queryByTestId(`import-all.progress-screen.name.${project.name}`);
    const importedRepoImportState = queryByTestId(
      `import-all.progress-screen.import-status.${project.name}.${importAllhook.IMPORT_STATE.SUCCESS}`,
    );
    const importAllBackButton = queryByTestId('import-all.progress-screen.back-btn');
    const importAllDoneButton = queryByTestId('import-all.progress-screen.done-btn');

    await waitFor(() => {
      expectToSendAnalyticsEvent('importAllResult imported', {
        successfullyImported: 1,
      });
    });

    expect(progressScreenTitle).toBeDefined();
    expect(progressScreenInfoMessage).toBeDefined();
    expect(successfullyImportedRepo).toBeDefined();
    expect(importProgressBox).toBeDefined();
    expect(importedRepoName).toBeDefined();
    expect(importedRepoImportState).toBeDefined();
    expect(importAllBackButton).toBeDefined();
    expect(importAllDoneButton).toBeDefined();
  });

  it('renders progress screen with already imported repo', async () => {
    const project = mockProject(importAllhook.IMPORT_STATE.ALREADY_IMPORTED, true);
    jest.spyOn(importAllhook, 'useImportAll').mockImplementation(() => ({
      isImporting: false,
      importedProjects: [project],
      projectsFetchingError: '',
      retryFailedProjects: jest.fn(),
    }));
    jest.spyOn(useAppContextHook, 'useAppContext').mockImplementation(() => ({
      appId: MOCK_APP_ID,
      features: {
        isDataComponentTypesEnabled: true,
        isDocumentComponentLinksDisabled: true,
        isGitlabMaintainerTokenEnabled: true,
        isImportAllEnabled: true,
        isSendStagingEventsEnabled: true,
        isCompassPushEventEnabled: true,
      },
      refreshWebhookConfig: jest.fn(),
      getConnectedInfo: jest.fn(),
      clearGroup: jest.fn(),
      moduleKey: '',
      webhookSetupConfig: {
        triggerUrl: '',
        webhookSetupInProgress: false,
      },
    }));

    const { queryByTestId } = render(
      <MemoryRouter>
        <ImportAllPage />
      </MemoryRouter>,
    );

    const infoScreenStartButton = queryByTestId('info-screen-start-btn');

    infoScreenStartButton?.click();

    const progressScreenTitle = queryByTestId('info-screen-start-btn');
    const progressScreenInfoMessage = queryByTestId('import-all.progress-screen.information');
    const successfullyImportedRepo = queryByTestId('import-all.progress-screen.already-imported');
    const importProgressBox = queryByTestId('import-all.progress-screen.import-progress');

    const importedRepoName = queryByTestId(`import-all.progress-screen.name.${project.name}`);
    const importedRepoImportState = queryByTestId(
      `import-all.progress-screen.import-status.${project.name}.${importAllhook.IMPORT_STATE.ALREADY_IMPORTED}`,
    );

    await waitFor(() => {
      expectToSendAnalyticsEvent('importAllResult imported', {
        successfullyImported: 0,
      });
    });

    expect(progressScreenTitle).toBeDefined();
    expect(progressScreenInfoMessage).toBeDefined();
    expect(successfullyImportedRepo).toBeDefined();
    expect(importProgressBox).toBeDefined();
    expect(importedRepoName).toBeDefined();
    expect(importedRepoImportState).toBeDefined();
  });

  it('renders progress screen with failed imported repo', async () => {
    const project = mockProject(importAllhook.IMPORT_STATE.FAILED, true);

    jest.spyOn(importAllhook, 'useImportAll').mockImplementation(() => ({
      isImporting: false,
      importedProjects: [project],
      projectsFetchingError: '',
      retryFailedProjects: jest.fn(),
    }));
    jest.spyOn(useAppContextHook, 'useAppContext').mockImplementation(() => ({
      appId: MOCK_APP_ID,
      features: {
        isDataComponentTypesEnabled: true,
        isDocumentComponentLinksDisabled: true,
        isGitlabMaintainerTokenEnabled: true,
        isImportAllEnabled: true,
        isSendStagingEventsEnabled: true,
        isCompassPushEventEnabled: true,
      },
      refreshWebhookConfig: jest.fn(),
      getConnectedInfo: jest.fn(),
      clearGroup: jest.fn(),
      moduleKey: '',
      webhookSetupConfig: {
        triggerUrl: '',
        webhookSetupInProgress: false,
      },
    }));

    const { queryByTestId } = render(
      <MemoryRouter>
        <ImportAllPage />
      </MemoryRouter>,
    );

    const infoScreenStartButton = queryByTestId('info-screen-start-btn');

    infoScreenStartButton?.click();

    const progressScreenTitle = queryByTestId('info-screen-start-btn');
    const progressScreenInfoMessage = queryByTestId('import-all.progress-screen.information');
    const successfullyImportedRepo = queryByTestId('import-all.progress-screen.failed-imported');
    const importProgressBox = queryByTestId('import-all.progress-screen.import-progress');

    const importedRepoName = queryByTestId(`import-all.progress-screen.name.${project.name}`);
    const importedRepoImportState = queryByTestId(
      `import-all.progress-screen.import-status.${project.name}.${importAllhook.IMPORT_STATE.FAILED}`,
    );

    await waitFor(() => {
      expectToSendAnalyticsEvent('importAllResult imported', {
        successfullyImported: 0,
      });
    });

    expect(progressScreenTitle).toBeDefined();
    expect(progressScreenInfoMessage).toBeDefined();
    expect(successfullyImportedRepo).toBeDefined();
    expect(importProgressBox).toBeDefined();
    expect(importedRepoName).toBeDefined();
    expect(importedRepoImportState).toBeDefined();
  });
});
