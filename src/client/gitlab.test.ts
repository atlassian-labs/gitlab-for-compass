/* eslint-disable import/order */
import { mockForgeApi } from '../__tests__/helpers/forge-helper';
/* eslint-disable import/first */
mockForgeApi();

import { listFiles } from './gitlab';
import { ProjectFile } from '../types';
import * as gitlabClient from './gitlab';

const MOCK_GITLAB_FILE_DATA: ProjectFile = { id: 'id', name: 'file.text', type: 'blob', path: 'path/to/file' };

describe('listFiles', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('returns a list of files for a successful request', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([MOCK_GITLAB_FILE_DATA]), {
      status: 200,
    });

    const result = await gitlabClient.listFiles('mockToken', 123, 'path/to/dir', 'main', 'token', 100, true);
    expect(result).toEqual([MOCK_GITLAB_FILE_DATA]);

    expect(fetchMock).toHaveBeenCalledWith(
      // eslint-disable-next-line max-len
      'https://gitlab.com/api/v4/projects/123/repository/tree?pagination=keyset&per_page=100&page_token=token&recursive=true&ref=main&path=path%2Fto%2Fdir',
      expect.any(Object),
    );
  });

  it('returns an empty list if no files are found', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([]), {
      status: 200,
    });

    const result = await listFiles('mockToken', 123, 'path/to/dir', 'main', 'token', 100, true);
    expect(result).toEqual([]);
    expect(fetchMock).toBeCalledTimes(1);
  });

  it('throws an error for a failed request', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'failed request' }), {
      status: 500,
    });

    await expect(listFiles('mockToken', 123, 'path/to/dir', 'main', 'token', 100, true)).rejects.toThrow();
    expect(fetchMock).toBeCalledTimes(1);
  });
});

describe('getRawFileContent', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });
  it('returns a file content for a successful request', async () => {
    fetchMock.mockResponseOnce('mock content', {
      status: 200,
    });

    const result = await gitlabClient.getRawFileContent('mockToken', 123, 'path/to/dir', 'main');
    expect(result).toEqual('mock content');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://gitlab.com/api/v4/projects/123/repository/files/path%2Fto%2Fdir/raw?ref=main',
      expect.any(Object),
    );
  });

  it('throws an error for a failed request', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'failed request' }), {
      status: 500,
    });

    await expect(gitlabClient.getRawFileContent('mockToken', 123, 'path/to/dir', 'main')).rejects.toThrow();
    expect(fetchMock).toBeCalledTimes(1);
  });
});
