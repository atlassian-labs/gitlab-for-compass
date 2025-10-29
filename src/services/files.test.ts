import { storage } from '@forge/api';
import { getGroupCaCFiles } from './files'; // Adjust path as needed
import { STORAGE_SECRETS } from '../constants';
import { searchGroupFiles, GitLabHeaders } from '../client/gitlab';

jest.mock('@forge/api');
jest.mock('../client/gitlab');

describe('getGroupCaCFiles', () => {
  const groupId = 123;
  const page = 2;
  const perPage = 50;
  const groupToken = 'token-abc';
  const fakeData = [{ id: 1, name: 'compass.yml' }];
  const fakeHeaders = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getSecret as jest.Mock).mockResolvedValue(groupToken);
    (searchGroupFiles as jest.Mock).mockResolvedValue({ data: fakeData, headers: fakeHeaders });
    fakeHeaders.get.mockReset();
  });

  it('returns data and hasNextPage=true when next page header is present', async () => {
    fakeHeaders.get.mockImplementation((header) => (header === GitLabHeaders.PAGINATION_NEXT_PAGE ? '3' : undefined));

    const result = await getGroupCaCFiles({ groupId, page, perPage });

    expect(storage.getSecret).toHaveBeenCalledWith(`${STORAGE_SECRETS.GROUP_TOKEN_KEY_PREFIX}123`);
    expect(searchGroupFiles).toHaveBeenCalledWith({
      groupToken,
      groupId,
      page,
      perPage,
      search: 'file:compass.yml|compass.yaml',
    });
    expect(result).toEqual({
      data: fakeData,
      hasNextPage: true,
    });
  });

  it('returns data and hasNextPage=false when next page header is missing', async () => {
    fakeHeaders.get.mockImplementation((header) => undefined);

    const result = await getGroupCaCFiles({ groupId, page, perPage });

    expect(result).toEqual({
      data: fakeData,
      hasNextPage: false,
    });
  });

  it('throws and logs error if storage.getSecret fails', async () => {
    const error = new Error('secret error');
    (storage.getSecret as jest.Mock).mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getGroupCaCFiles({ groupId, page, perPage })).rejects.toThrow('secret error');
    expect(consoleSpy).toHaveBeenCalledWith(`Error while searching yaml files in the group: ${groupId}:`, error);
    consoleSpy.mockRestore();
  });

  it('throws and logs error if searchGroupFiles fails', async () => {
    const error = new Error('search error');
    (searchGroupFiles as jest.Mock).mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getGroupCaCFiles({ groupId, page, perPage })).rejects.toThrow('search error');
    expect(consoleSpy).toHaveBeenCalledWith(`Error while searching yaml files in the group: ${groupId}:`, error);
    consoleSpy.mockRestore();
  });

  it('uses correct search query', async () => {
    fakeHeaders.get.mockReturnValue(undefined);
    await getGroupCaCFiles({ groupId, page, perPage });
    expect(searchGroupFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'file:compass.yml|compass.yaml',
      }),
    );
  });
});
