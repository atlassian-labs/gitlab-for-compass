/* eslint-disable import/first */

import {
  mockAgg,
  mockDeleteExternalAlias,
  mockDetachDataManager,
  mockGetComponentByExternalAlias,
} from '../../__tests__/helpers/mock-agg';

mockAgg();

import { unlinkComponent } from './unlink-component';
import { CompassYaml } from '../../types';
import { mockComponent, MOCK_CLOUD_ID } from '../../__tests__/fixtures/gitlab-data';

describe('Unlink component from file', () => {
  const mockCompassYaml: CompassYaml = {
    id: 'abc123',
  };
  const mockCompassYamlWithExternalAlias: CompassYaml = {
    immutableLocalKey: 'abc123',
  };
  const mockProjId = 'mockProjId-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detaches data manager and deletes external alias when config removed', async () => {
    mockDetachDataManager.mockResolvedValueOnce({
      success: true,
      errors: [],
    });
    mockDeleteExternalAlias.mockResolvedValueOnce({
      success: true,
      errors: [],
    });
    await unlinkComponent(mockCompassYaml, mockProjId, MOCK_CLOUD_ID);
    expect(mockGetComponentByExternalAlias).not.toBeCalled();
    expect(mockDetachDataManager).toBeCalled();
    expect(mockDeleteExternalAlias).toBeCalled();
  });

  test('detaches data manager and deletes external alias by immutableLocalkey', async () => {
    mockGetComponentByExternalAlias.mockResolvedValueOnce({
      success: true,
      data: { component: mockComponent },
      errors: [],
    });
    mockDetachDataManager.mockResolvedValueOnce({
      success: true,
      errors: [],
    });
    mockDeleteExternalAlias.mockResolvedValueOnce({
      success: true,
      errors: [],
    });
    await unlinkComponent(mockCompassYamlWithExternalAlias, mockProjId, MOCK_CLOUD_ID);
    expect(mockGetComponentByExternalAlias).toBeCalled();
    expect(mockDetachDataManager).toBeCalled();
    expect(mockDeleteExternalAlias).toBeCalled();
  });

  test('throws error if detachDataManager fails', async () => {
    mockDetachDataManager.mockResolvedValueOnce({
      success: false,
      errors: [{ message: 'testError' }],
    });
    mockDeleteExternalAlias.mockResolvedValueOnce({
      success: true,
      errors: [],
    });
    await expect(unlinkComponent(mockCompassYaml, mockProjId, MOCK_CLOUD_ID)).rejects.toThrow(
      new Error('Error unlinking component: testError'),
    );
  });

  test('throws error if deleteExternalAlias fails', async () => {
    mockDetachDataManager.mockResolvedValueOnce({
      success: false,
      errors: [],
    });
    mockDeleteExternalAlias.mockResolvedValueOnce({
      success: true,
      errors: [{ message: 'testError' }],
    });
    await expect(unlinkComponent(mockCompassYaml, mockProjId, MOCK_CLOUD_ID)).rejects.toThrow(
      new Error('Error unlinking component: testError'),
    );
  });
});
