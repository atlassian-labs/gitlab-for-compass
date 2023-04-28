import { ApiPayload } from '@atlassian/forge-graphql';
import { mockForgeApi } from './forge-helper';

const defaultImpl = async (): Promise<ApiPayload<any>> => ({
  success: true,
  errors: [],
  data: {},
});

export const mockDeleteExternalAlias = jest.fn(defaultImpl);
export const mockDetachDataManager = jest.fn(defaultImpl);
export const mockUpdateComponent = jest.fn(defaultImpl);
export const mockUpdateComponentDataManager = jest.fn(defaultImpl);
export const mockCreateEvent = jest.fn(defaultImpl);
export const mockInsertMetricValueByExternalId = jest.fn(defaultImpl);
export const mockSyncComponentWithFile = jest.fn(defaultImpl);
export const mockGetComponentByExternalAlias = jest.fn(defaultImpl);
export const mockUnlinkComponent = jest.fn(defaultImpl);

export function mockAgg() {
  mockForgeApi();

  jest.mock('@atlassian/forge-graphql', () => ({
    ...(jest.requireActual('@atlassian/forge-graphql') as any),
    compass: {
      asApp: () => ({
        deleteExternalAlias: mockDeleteExternalAlias,
        detachDataManager: mockDetachDataManager,
        updateComponent: mockUpdateComponent,
        updateDataManager: mockUpdateComponentDataManager,
        createEvent: mockCreateEvent,
        insertMetricValueByExternalId: mockInsertMetricValueByExternalId,
        getComponentByExternalAlias: mockGetComponentByExternalAlias,
      }),
      configAsCode: {
        asApp: () => ({
          syncComponentWithFile: mockSyncComponentWithFile,
          unlinkComponent: mockUnlinkComponent,
        }),
      },
    },
  }));
}
