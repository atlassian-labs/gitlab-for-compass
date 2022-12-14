/* eslint-disable import/first */

import { mockAgg, mockDeleteExternalAlias, mockDetachDataManager } from '../../__tests__/helpers/mock-agg';

mockAgg();

import { unlinkComponent } from './unlink-component';
import { CompassYaml } from '../../types';

describe('Unlink component from file', () => {
  const mockCompassYaml: CompassYaml = {
    id: 'abc123',
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
    await unlinkComponent(mockCompassYaml.id, mockProjId);
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
    await expect(unlinkComponent(mockCompassYaml.id, mockProjId)).rejects.toThrow(
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
    await expect(unlinkComponent(mockCompassYaml.id, mockProjId)).rejects.toThrow(
      new Error('Error unlinking component: testError'),
    );
  });
});
