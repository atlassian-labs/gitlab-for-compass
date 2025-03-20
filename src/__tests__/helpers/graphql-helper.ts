/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import { Queue as RealQueue } from '@forge/events';
import fetch, { enableFetchMocks } from 'jest-fetch-mock';

export const mockStorageSet = jest.fn();
export const mockStorageGet = jest.fn();
export const storage = {
  set: mockStorageSet,
  get: mockStorageGet,
  delete: jest.fn(),
};

export const webTrigger = {
  getUrl: jest.fn(),
};

export const aggQuery = jest.fn();

// This function is used to mock Forge's fetch API by using the mocked version
// of `fetch` provided in the jest-fetch-mock library.

export function mockForgeApi() {
  const requestGraph = jest.fn();
  const internalMetricsMock = jest.fn();

  const apiMethods = {
    asApp: () => ({
      requestGraph,
    }),
    asUser: () => ({
      requestGraph,
    }),
    internalMetrics: internalMetricsMock,
  };
  // Global API mock
  (global as any).api = apiMethods;

  const agg = require('../../client/agg');
  agg.aggQuery = aggQuery;

  jest.mock('@forge/api', () => ({
    __esModule: true,
    default: apiMethods,
    fetch, // assign the fetch import to return the jest-fetch-mock version of fetch
    storage,
    webTrigger,
  }));
  enableFetchMocks(); // enable jest-fetch-mock
}

export const mockAttachDataManager = jest.fn();
export const mockAddEventSource = jest.fn();
export const mockAddLabels = jest.fn();
export const mockAttachEventSource = jest.fn();
export const mockCreateBaseComponent = jest.fn();
export const mockCreateComponent = jest.fn();
export const mockCreateEvent = jest.fn();
export const mockCreateEventSource = jest.fn();
export const mockCreateExternalAlias = jest.fn();
export const mockCreateLink = jest.fn();
export const mockCreateMetricSource = jest.fn();
export const mockCreateRelationship = jest.fn();
export const mockDeleteComponent = jest.fn();
export const mockDeleteExternalAlias = jest.fn();
export const mockDeleteMetricSource = jest.fn();
export const mockDetachEventSource = jest.fn();
export const mockDetachExternalSource = jest.fn();
export const mockDeleteLink = jest.fn();
export const mockDeleteRelationship = jest.fn();
export const mockDetachDataManager = jest.fn();
export const mockGetComponent = jest.fn();
export const mockGetComponentByExternalAlias = jest.fn();
export const mockGetAllComponentTypes = jest.fn();
export const mockGetEventSource = jest.fn();
export const mockRemoveLabels = jest.fn();
export const mockSearchComponents = jest.fn();
export const mockSyncComponentByExternalAlias = jest.fn();
export const mockUnlinkExternalSource = jest.fn();
export const mockUpdateBaseComponent = jest.fn();
export const mockUpdateComponent = jest.fn();
export const mockUpdateComponentDataManager = jest.fn();
export const mockUpdateEventSources = jest.fn();
export const mockGetMetricDefinitions = jest.fn();
export const mockCreateMetricDefinition = jest.fn();
export const mockInsertMetricValue = jest.fn();
export const mockInsertMetricValueByExternalId = jest.fn();
export const mockSynchronizeLinkAssociations = jest.fn();
export const mockSyncComponentWithFile = jest.fn();
export const mockUnlinkComponent = jest.fn();

export function mockSdk() {
  mockForgeApi();
  jest.mock('@atlassian/forge-graphql', () => ({
    ...(jest.requireActual('@atlassian/forge-graphql') as any),
    compass: {
      configAsCode: {
        asApp: () => ({
          syncComponentWithFile: mockSyncComponentWithFile,
          unlinkComponent: mockUnlinkComponent,
        }),
        asUser: () => ({}),
      },
      asApp: () => ({
        addEventSource: mockAddEventSource,
        addLabels: mockAddLabels,
        attachDataManager: mockAttachDataManager,
        attachEventSource: mockAttachEventSource,
        createBaseComponent: mockCreateBaseComponent,
        createComponent: mockCreateComponent,
        createEvent: mockCreateEvent,
        createEventSource: mockCreateEventSource,
        createExternalAlias: mockCreateExternalAlias,
        createLink: mockCreateLink,
        createMetricSource: mockCreateMetricSource,
        createMetricDefinition: mockCreateMetricDefinition,
        createRelationship: mockCreateRelationship,
        deleteComponent: mockDeleteComponent,
        detachEventSource: mockDetachEventSource,
        deleteExternalAlias: mockDeleteExternalAlias,
        deleteMetricSource: mockDeleteMetricSource,
        detachExternalSource: mockDetachExternalSource,
        deleteLink: mockDeleteLink,
        deleteRelationship: mockDeleteRelationship,
        detachDataManager: mockDetachDataManager,
        getComponent: mockGetComponent,
        getComponentByExternalAlias: mockGetComponentByExternalAlias,
        getAllComponentTypes: mockGetAllComponentTypes,
        getEventSource: mockGetEventSource,
        getMetricDefinitions: mockGetMetricDefinitions,
        insertMetricValue: mockInsertMetricValue,
        insertMetricValueByExternalId: mockInsertMetricValueByExternalId,
        removeLabels: mockRemoveLabels,
        searchComponents: mockSearchComponents,
        syncComponentByExternalAlias: mockSyncComponentByExternalAlias,
        unlinkExternalSource: mockUnlinkExternalSource,
        updateBaseComponent: mockUpdateBaseComponent,
        updateComponent: mockUpdateComponent,
        updateDataManager: mockUpdateComponentDataManager,
        updateEventSources: mockUpdateEventSources,
        synchronizeLinkAssociations: mockSynchronizeLinkAssociations,
      }),
    },
  }));
}
