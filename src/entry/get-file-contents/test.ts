/* eslint-disable import/order */
import { storage, mockForgeApi } from '../../__tests__/helpers/forge-helper';
/* eslint-disable import/first */
mockForgeApi();

import { getFileContents } from './index';
import { getRawFileContent } from '../../client/gitlab';
import { GitlabHttpMethodError } from '../../models/errors';

jest.mock('../../client/gitlab');

describe('getFileContent', () => {
  const mockPayload = {
    groupId: 102702678,
    projectId: 67324416,
    filePath: 'path/to/file',
    ref: 'main',
  };

  it('returns file contents for a successful request', async () => {
    const mockContents = 'file contents';
    storage.getSecret.mockResolvedValue('mockToken');
    (getRawFileContent as jest.Mock).mockResolvedValue(mockContents);

    const result = await getFileContents(mockPayload);
    expect(result).toEqual({
      success: true,
      file: {
        contents: mockContents,
      },
      statusCode: 200,
    });
  });

  it('returns an error message if getRawFileContent fails', async () => {
    storage.getSecret.mockResolvedValue('mockToken');
    (getRawFileContent as jest.Mock).mockRejectedValue(new Error('Request failed'));

    const result = await getFileContents(mockPayload);
    expect(result).toEqual({
      success: false,
      errorMessage: 'Request failed',
      statusCode: 500,
    });
  });

  it('returns an error message if GitlabHttpMethodError is thrown', async () => {
    storage.getSecret.mockResolvedValue('mockToken');
    (getRawFileContent as jest.Mock).mockRejectedValue(new GitlabHttpMethodError(404, 'Not found'));

    const result = await getFileContents(mockPayload);
    expect(result).toEqual({
      success: false,
      errorMessage: 'Not found',
      statusCode: 404,
    });
  });
});
