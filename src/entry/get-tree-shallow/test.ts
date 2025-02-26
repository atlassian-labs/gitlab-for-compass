/* eslint-disable import/order */
import { storage, mockForgeApi } from '../../__tests__/helpers/forge-helper';
/* eslint-disable import/first */
mockForgeApi();

import { getTreeShallow } from './index';
import { listFiles } from '../../client/gitlab';

jest.mock('../../client/gitlab');

describe('getTreeShallow', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  const mockPayload = {
    projectId: 67324416,
    groupId: 102702678,
    path: 'file/path',
    ref: 'master',
    pageToken: 'your-page-token',
    pageSize: 100,
    recursive: true,
  };

  it('returns a list of files for a successful request', async () => {
    const mockFiles = [{ id: '1', name: 'file1', type: 'blob', path: 'file/path/file1' }];
    storage.getSecret.mockResolvedValue('mockToken');
    (listFiles as jest.Mock).mockResolvedValue(mockFiles);

    const result = await getTreeShallow(mockPayload);
    expect(result).toEqual({
      success: true,
      files: mockFiles,
      statusCode: 200,
    });
  });

  it('returns an error message if listFiles fails', async () => {
    storage.getSecret.mockResolvedValue('mockToken');
    (listFiles as jest.Mock).mockRejectedValue(new Error('Request failed'));

    const result = await getTreeShallow(mockPayload);
    expect(result).toEqual({
      success: false,
      errorMessage: 'Request failed',
      statusCode: 500,
    });
  });
});
