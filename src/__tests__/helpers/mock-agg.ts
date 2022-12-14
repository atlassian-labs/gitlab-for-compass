import { ApiPayload } from '@atlassian/forge-graphql';
import { mockForgeApi } from './forge-helper';

const defaultImpl = async (): Promise<ApiPayload<any>> => ({
  success: true,
  errors: [],
  data: {},
});

export const mockDeleteExternalAlias = jest.fn(defaultImpl);
export const mockDetachDataManager = jest.fn(defaultImpl);
export const mockGetComponent = jest.fn(defaultImpl);
export const mockCreateExternalAlias = jest.fn(defaultImpl);
export const mockUpdateComponent = jest.fn(defaultImpl);
export const mockUpdateComponentDataManager = jest.fn(defaultImpl);
export const mockCreateEvent = jest.fn(defaultImpl);
export const mockInsertMetricValueByExternalId = jest.fn(defaultImpl);

export function mockAgg() {
  mockForgeApi();

  jest.mock('@atlassian/forge-graphql', () => ({
    ...(jest.requireActual('@atlassian/forge-graphql') as any),
    compass: {
      asApp: () => ({
        getComponent: mockGetComponent,
        deleteExternalAlias: mockDeleteExternalAlias,
        detachDataManager: mockDetachDataManager,
        createExternalAlias: mockCreateExternalAlias,
        updateComponent: mockUpdateComponent,
        updateDataManager: mockUpdateComponentDataManager,
        createEvent: mockCreateEvent,
        insertMetricValueByExternalId: mockInsertMetricValueByExternalId,
      }),
    },
  }));
}
