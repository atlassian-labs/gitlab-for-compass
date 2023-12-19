/* eslint-disable import/first, import/order */
import { mockAgg, mockSyncComponentWithFile, mockUpdateComponent } from '../../__tests__/helpers/mock-agg';

mockAgg();

import {
  Component,
  CompassComponentType,
  CompassLinkType,
  ConfigFileActions,
  ConfigFileMetadata,
  ComponentSyncEventStatus,
} from '@atlassian/forge-graphql';
import { mocked } from 'jest-mock';
import yaml from 'js-yaml';

import { generatePushEvent } from '../../__tests__/helpers/gitlab-helper';
import { CompassYaml, ComponentSyncDetails, ComponentSyncPayload, PushEvent, YamlLink } from '../../types';
import { syncComponent } from './sync-component';
import { EXTERNAL_SOURCE, IMPORT_LABEL } from '../../constants';
import { reportSyncError } from './report-sync-error';
import { getProjectById } from '../../client/gitlab';
import { getProjectLabels } from '../get-labels';
import { MOCK_CLOUD_ID, TEST_GET_PROJECT_BY_ID_RESPONSE, TEST_TOKEN } from '../../__tests__/fixtures/gitlab-data';

jest.mock('../../client/gitlab');
jest.mock('../../services/get-labels');
jest.mock('./yaml-config-transforms');
jest.mock('./report-sync-error');

const TEST_FILE_NAME = 'TEST_FILE_NAME';

const MOCK_GET_PROJECT_LABELS = [...TEST_GET_PROJECT_BY_ID_RESPONSE.topics, 'language:javascript'];
const MOCK_COMPONENT_LABELS = ['label'];

const mockGetProjectById = mocked(getProjectById);
const mockGetProjectLabels = mocked(getProjectLabels);

const getMockedComponent = (overrideMockedComponent: Partial<Component> = {}): Component => ({
  id: 'id',
  name: 'mock',
  type: CompassComponentType.Service,
  typeId: 'SERVICE',
  labels: MOCK_COMPONENT_LABELS,
  changeMetadata: {},
  ...overrideMockedComponent,
});

const getMockedCompassYaml = (overrideMockedCompassYaml: Partial<CompassYaml> = {}): CompassYaml => ({
  id: 'id',
  name: 'name',
  description: 'description',
  ownerId: 'ownerId',
  fields: { tier: 1 },
  relationships: { DEPENDS_ON: ['depends1'] },
  ...overrideMockedCompassYaml,
});

const createCompassYamlLink = (type: CompassLinkType): YamlLink => ({
  type,
  url: 'https://url',
});

const getMockedSyncPayload = (
  compassYaml: CompassYaml,
  event: PushEvent,
): [ComponentSyncPayload, ComponentSyncDetails, ConfigFileMetadata] => {
  const mockComponentsToUpdate = {
    componentYaml: compassYaml,
    absoluteFilePath: TEST_FILE_NAME,
    filePath: '/path/fileName.yaml',
    previousFilePath: '/previousPath/fileName.yaml',
  };
  const mockComponentSyncDetails: ComponentSyncDetails = {
    token: TEST_TOKEN,
    event,
    trackingBranch: event.project.default_branch,
    cloudId: MOCK_CLOUD_ID,
  };

  const mockConfigFileMetadata = {
    configFileAction: ConfigFileActions.UPDATE,
    newPath: mockComponentsToUpdate.filePath,
    oldPath: mockComponentsToUpdate.previousFilePath,
    deduplicationId: event.project.id.toString(),
  };

  return [mockComponentsToUpdate, mockComponentSyncDetails, mockConfigFileMetadata];
};

describe('syncComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProjectById.mockResolvedValue(TEST_GET_PROJECT_BY_ID_RESPONSE);
    mockGetProjectLabels.mockResolvedValue(MOCK_GET_PROJECT_LABELS);
  });

  it('should call syncComponentByExternal Alias', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml();
    const component = getMockedComponent({ dataManager: { externalSourceURL: 'url' } });
    mockSyncComponentWithFile.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    const syncPayload = getMockedSyncPayload(compassYaml, event);
    await syncComponent(...syncPayload);

    expect(mockSyncComponentWithFile).toBeCalledWith({
      cloudId: MOCK_CLOUD_ID,
      configFile: yaml.dump(compassYaml),
      additionalExternalAliases: [{ externalId: event.project.id.toString(), externalSource: EXTERNAL_SOURCE }],
      externalSourceURL: `${event.project.web_url}/blob/${event.project.default_branch}/${TEST_FILE_NAME}`,
      additionalLinks: [
        {
          url: event.project.web_url,
          type: CompassLinkType.Repository,
        },
      ],
      configFileMetadata: syncPayload[2],
    });
  });

  it('should update component with adding labels', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml({
      links: [createCompassYamlLink(CompassLinkType.Project)],
    });
    const component = getMockedComponent({ dataManager: { externalSourceURL: 'url' } });
    mockSyncComponentWithFile.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    const syncPayload = getMockedSyncPayload(compassYaml, event);

    await syncComponent(...syncPayload);

    const expectedLabels = [...MOCK_COMPONENT_LABELS, IMPORT_LABEL, ...MOCK_GET_PROJECT_LABELS];

    expect(mockUpdateComponent).toBeCalledWith(
      expect.objectContaining({
        labels: expectedLabels,
      }),
    );
  });

  it('should catch error when update component fails', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml();
    const component = getMockedComponent({ dataManager: {} });
    const error = new Error('test');
    mockSyncComponentWithFile.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    mockUpdateComponent.mockRejectedValue(error);

    const syncPayload = getMockedSyncPayload(compassYaml, event);
    await syncComponent(...syncPayload);

    expect(reportSyncError).toBeCalledWith(error, component.id, expect.anything());
  });

  it('should not update component when dataManager has sync error', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml();
    const component = getMockedComponent({
      dataManager: {
        componentId: 'id',
        lastSyncEvent: { lastSyncErrors: ['error'], status: ComponentSyncEventStatus.UserError },
      },
    });
    mockSyncComponentWithFile.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    const syncPayload = getMockedSyncPayload(compassYaml, event);
    await syncComponent(...syncPayload);

    expect(mockUpdateComponent).not.toBeCalled();
  });
});
