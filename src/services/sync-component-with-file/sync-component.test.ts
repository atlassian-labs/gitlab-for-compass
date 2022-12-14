/* eslint-disable import/first, import/order */
import {
  mockAgg,
  mockGetComponent,
  mockCreateExternalAlias,
  mockUpdateComponent,
} from '../../__tests__/helpers/mock-agg';

mockAgg();

import { Component, CompassComponentType, CompassLinkType } from '@atlassian/forge-graphql';
import { mocked } from 'jest-mock';

import { generatePushEvent } from '../../__tests__/helpers/gitlab-helper';
import { CompassYaml, YamlLink } from '../../types';
import { syncComponent } from './sync-component';
import { EXTERNAL_SOURCE, IMPORT_LABEL } from '../../constants';
import { reportSyncError } from './report-sync-error';
import { getProjectById } from '../../client/gitlab';
import { getProjectLabels } from '../get-labels';
import { TEST_GET_PROJECT_BY_ID_RESPONSE, TEST_TOKEN } from '../../__tests__/fixtures/gitlab-data';

jest.mock('../../client/gitlab');
jest.mock('../../services/get-labels');
jest.mock('./validate-config-file');
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
  typeId: 'service',
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

describe('syncComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProjectById.mockResolvedValue(TEST_GET_PROJECT_BY_ID_RESPONSE);
    mockGetProjectLabels.mockResolvedValue(MOCK_GET_PROJECT_LABELS);
  });

  it('creates external alias for component in case data manager is not present and external alias was not created previously for the project', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml();
    const component = getMockedComponent({
      externalAliases: [{ externalAliasId: '000000', externalSource: EXTERNAL_SOURCE }],
    });
    mockGetComponent.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

    const expectedParameter = {
      componentId: compassYaml.id,
      externalAlias: {
        externalId: event.project.id.toString(),
        externalSource: EXTERNAL_SOURCE,
      },
    };

    expect(mockCreateExternalAlias).toBeCalledWith(expectedParameter);
  });

  it('should not create external alias for component in case data manager is present', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml();
    const component = getMockedComponent({ dataManager: { externalSourceURL: 'url' } });
    mockGetComponent.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

    expect(mockCreateExternalAlias).not.toBeCalled();
  });

  it('should not create external alias for component in case the same external alias was created previously', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml();
    const component = getMockedComponent({
      externalAliases: [{ externalAliasId: '1', externalSource: EXTERNAL_SOURCE }],
    });
    mockGetComponent.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

    expect(mockCreateExternalAlias).not.toBeCalled();
  });

  it('should not create external alias if no component present', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml({ id: undefined });

    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

    expect(mockCreateExternalAlias).not.toBeCalled();
  });

  it('should update component without changing yaml links', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml({
      links: [
        createCompassYamlLink(CompassLinkType.Repository),
        createCompassYamlLink(CompassLinkType.Repository),
        createCompassYamlLink(CompassLinkType.Repository),
        createCompassYamlLink(CompassLinkType.Repository),
        createCompassYamlLink(CompassLinkType.Repository),
        createCompassYamlLink(CompassLinkType.Project),
      ],
    });
    const component = getMockedComponent({ dataManager: { externalSourceURL: 'url' } });
    mockGetComponent.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

    expect(mockUpdateComponent).toBeCalledWith(
      expect.objectContaining({
        links: compassYaml.links,
      }),
    );
  });

  it('should update component without changing yaml links if required link already exists', async () => {
    const event = generatePushEvent({
      project: {
        id: 1,
        name: 'test',
        default_branch: 'main',
        web_url: 'https://url',
      },
    });
    const compassYaml = getMockedCompassYaml({
      links: [createCompassYamlLink(CompassLinkType.Project)],
    });
    const component = getMockedComponent({ dataManager: { externalSourceURL: 'url' } });
    mockGetComponent.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

    expect(mockUpdateComponent).toBeCalledWith(
      expect.objectContaining({
        links: compassYaml.links,
      }),
    );
  });

  it('should update component with adding required yaml link', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml({
      links: [createCompassYamlLink(CompassLinkType.Project)],
    });
    const component = getMockedComponent({ dataManager: { externalSourceURL: 'url' } });
    mockGetComponent.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

    const expectedLinks = [
      ...compassYaml.links,
      {
        type: CompassLinkType.Repository,
        url: event.project.web_url,
      },
    ];

    expect(mockUpdateComponent).toBeCalledWith(
      expect.objectContaining({
        links: expectedLinks,
      }),
    );
  });

  it('should update component with correct externalSourceURL', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml();
    const component = getMockedComponent({ dataManager: { externalSourceURL: 'url' } });
    mockGetComponent.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

    expect(mockUpdateComponent).toBeCalledWith(
      expect.objectContaining({
        dataManager: {
          externalSourceURL: `${event.project.web_url}/blob/${event.project.default_branch}/${TEST_FILE_NAME}`,
        },
      }),
    );
  });

  it('should update component with adding labels', async () => {
    const event = generatePushEvent();
    const compassYaml = getMockedCompassYaml({
      links: [createCompassYamlLink(CompassLinkType.Project)],
    });
    const component = getMockedComponent({ dataManager: { externalSourceURL: 'url' } });
    mockGetComponent.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

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
    const component = getMockedComponent();
    const error = new Error('test');
    mockGetComponent.mockResolvedValue({
      success: true,
      data: { component },
      errors: [],
    });

    mockUpdateComponent.mockRejectedValue(error);
    await syncComponent(TEST_TOKEN, compassYaml, TEST_FILE_NAME, event, event.project.default_branch);

    expect(reportSyncError).toBeCalledWith(error, expect.anything(), expect.anything());
  });
});
